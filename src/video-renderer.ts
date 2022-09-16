import { join, dirname } from "path"
import fs from "fs-extra"
import { nanoid } from "nanoid"
import parseConfig from "./parse-config"
import createFrameSource from "./sources/frameSource"
import FFmpeg from "./ffmpeg"
import { Dimension } from "./interfaces/common"
import "./objects"
const channels = 4

function parseFps(fps: any) {
  const match = typeof fps === "string" && fps.match(/^([0-9]+)\/([0-9]+)$/)
  if (match) {
    const num = parseInt(match[1], 10)
    const den = parseInt(match[2], 10)
    if (den > 0) return num / den
  }
  return undefined
}

interface VideoRendererOptions {
  dimension: Dimension
  duration: number
  scenes: any[]
  verbose: boolean
  fps: number
}

class VideoRenderer {
  public channels: number = 4
  public options: VideoRendererOptions
  private ffmpeg: FFmpeg
  private tmpDir: string

  constructor(options: VideoRendererOptions) {
    this.options = options
  }

  public render = async () => {
    const {
      verbose = false,
      scenes: clipsIn,
      dimension: { width, height },
    } = this.options

    const { clips } = await parseConfig({
      clips: clipsIn,
    })
    await this.createTempDir()

    let frameSource1
    let frameSource2
    let frameSource1Data
    let totalFramesWritten = 0
    let fromClipFrameAt = 0
    let transitionFromClipId = 0

    // Try to detect parameters from first video
    let firstVideoWidth
    let firstVideoHeight
    let firstVideoFramerateStr

    let toClipFrameAt = 0

    clips.find(
      (clip) =>
        clip &&
        clip.layers.find((layer) => {
          if (layer.type === "StaticVideo") {
            firstVideoWidth = layer.inputWidth
            firstVideoHeight = layer.inputHeight
            firstVideoFramerateStr = layer.framerateStr

            return true
          }
          return false
        })
    )

    let fps: any
    let framerateStr: any

    if (firstVideoFramerateStr) {
      fps = parseFps(firstVideoFramerateStr)
      framerateStr = firstVideoFramerateStr
    } else {
      fps = 25
      framerateStr = String(fps)
    }

    this.ffmpeg = new FFmpeg({
      fps,
      framerateStr,
      dimension: {
        width,
        height,
      },
    })
    const getTransitionFromClip = () => {
      return clips[transitionFromClipId]
    }

    // @ts-ignore
    const getSource = async (clip, clipIndex) => {
      return createFrameSource({
        clip,
        clipIndex,
        width,
        height,
        channels,
        verbose,
        fps,
        framerateStr,
      })
    }

    const getTransitionToClipId = () => transitionFromClipId + 1

    const getTransitionToClip = () => clips[getTransitionToClipId()]
    const getTransitionFromSource = async () => getSource(getTransitionFromClip(), transitionFromClipId)
    const getTransitionToSource = async () =>
      getTransitionToClip() && getSource(getTransitionToClip(), getTransitionToClipId())

    console.log(`${width}x${height} ${fps}fps`)
    try {
      frameSource1 = await getTransitionFromSource()
      frameSource2 = await getTransitionToSource()

      while (true) {
        const transitionFromClip = getTransitionFromClip()
        const fromClipNumFrames = Math.round(transitionFromClip.duration * fps)
        const fromClipProgress = fromClipFrameAt / fromClipNumFrames
        const fromClipTime = transitionFromClip.duration * fromClipProgress
        const transitionNumFramesSafe = 0
        console.log(fromClipFrameAt, fromClipNumFrames, transitionNumFramesSafe)
        const transitionFrameAt = fromClipFrameAt - (fromClipNumFrames - transitionNumFramesSafe)
        const transitionLastFrameIndex = transitionNumFramesSafe
        if (transitionFrameAt >= transitionLastFrameIndex) {
          transitionFromClipId += 1
          console.log(`Done with transition, switching to next transitionFromClip (${transitionFromClipId})`)
          if (!getTransitionFromClip()) {
            console.log("No more transitionFromClip, done")
            break
          }
          await frameSource1.close()
          frameSource1 = frameSource2
          frameSource2 = await getTransitionToSource()

          fromClipFrameAt = transitionLastFrameIndex
          toClipFrameAt = 0

          continue
        }

        const newFrameSource1Data = await frameSource1.readNextFrame({ time: fromClipTime })
        // If we got no data, use the old data
        // TODO maybe abort?
        if (newFrameSource1Data) {
          frameSource1Data = newFrameSource1Data
        } else {
          console.warn("No frame data returned, using last frame")
        }

        let outFrameData = frameSource1Data

        await this.ffmpeg.write(outFrameData)

        if (this.ffmpeg.outProcessError) {
          break
        }

        totalFramesWritten += 1
        fromClipFrameAt += 1
      }

      this.ffmpeg.close()
    } catch (err) {
      this.ffmpeg.kill()
      throw err
    } finally {
      if (frameSource1) {
        await frameSource1.close()
      }
      await this.removeTempDir()
    }

    try {
      await this.ffmpeg.ensureDone()
    } catch (err: any) {
      if (this.ffmpeg.outProcessExitCode !== 0 && !err.killed) throw err
    }

    console.log("Done")
  }

  public createTempDir = async () => {
    const outPath = "./position.mp4"
    const outDir = dirname(outPath)
    const tmpDir = join(outDir, `renderer-tmp-${nanoid()}`)
    await fs.mkdirp(tmpDir)
    this.tmpDir = tmpDir
  }

  public removeTempDir = async () => {
    await fs.remove(this.tmpDir)
  }

  public getEstimatedTotalFrames = (clips: any) => {
    const { fps } = this.options
    const estimatedTotalFrames =
      fps *
      clips.reduce((acc: any, c: any, i: any) => {
        let newAcc = acc + c.duration
        if (i !== clips.length - 1) newAcc -= c.transition.duration
        return newAcc
      }, 0)
    return estimatedTotalFrames
  }
}
export default VideoRenderer
