import { StaticVideoLayer } from "../interfaces/common"
import { execa } from "execa"
import { fabric } from "fabric"
import nodeCanvas from "canvas"
import assert from "assert"
const channels = 4
const FFMPEG = "ffmpeg"
const FFPROBE = "ffprobe"

async function readFileStreams(p: string) {
  const { stdout } = await execa(FFPROBE, ["-show_entries", "stream", "-of", "json", p])
  const json = JSON.parse(stdout)
  return json.streams
}

const getFfmpegCommonArgs = () => ["-hide_banner", "-loglevel", "error"]

function toUint8ClampedArray(buffer: any) {
  // return Uint8ClampedArray.from(buffer);
  // Some people are finding that manual copying is orders of magnitude faster than Uint8ClampedArray.from
  // Since I'm getting similar times for both methods, then why not:
  const data = new Uint8ClampedArray(buffer.length)
  for (let i = 0; i < buffer.length; i += 1) {
    data[i] = buffer[i]
  }
  return data
}

async function rgbaToFabricImage({ width, height, rgba }: any) {
  const canvas = nodeCanvas.createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  // https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/putImageData
  ctx.putImageData(new nodeCanvas.ImageData(toUint8ClampedArray(rgba), width, height), 0, 0)
  // https://stackoverflow.com/questions/58209996/unable-to-render-tiff-images-and-add-it-as-a-fabric-object
  // @ts-ignore
  return new fabric.Image(canvas)
}

export async function createVideoFrameSource({ layer, options }: any) {
  const { width, height, top = 0, left = 0, metadata } = layer
  const speedFactor = 1
  const path = layer.src
  const cutFrom = layer.cut.from
  const cutTo = layer.cut.to
  const { framerateStr } = options

  let scaleFilter = `scale=${width}:${height}`

  let ptsFilter = ""
  // if (speedFactor !== 1) {
  //   ptsFilter = `setpts=${speedFactor}*PTS,`
  // }

  const frameByteSize = width * height * channels

  // TODO assert that we have read the correct amount of frames

  const buf = Buffer.allocUnsafe(frameByteSize)
  let length = 0
  // let inFrameCount = 0;

  // https://forum.unity.com/threads/settings-for-importing-a-video-with-an-alpha-channel.457657/
  const streams = await readFileStreams(path)
  const firstVideoStream = streams.find((s: any) => s.codec_type === "video")
  // https://superuser.com/a/1116905/658247

  let inputCodec
  if (firstVideoStream.codec_name === "vp8") inputCodec = "libvpx"
  else if (firstVideoStream.codec_name === "vp9") inputCodec = "libvpx-vp9"

  // http://zulko.github.io/blog/2013/09/27/read-and-write-video-frames-in-python-using-ffmpeg/
  // Testing: ffmpeg -i 'vid.mov' -t 1 -vcodec rawvideo -pix_fmt rgba -f image2pipe - | ffmpeg -f rawvideo -vcodec rawvideo -pix_fmt rgba -s 2166x1650 -i - -vf format=yuv420p -vcodec libx264 -y out.mp4
  // https://trac.ffmpeg.org/wiki/ChangingFrameRate
  const args = [
    ...getFfmpegCommonArgs(),
    ...(inputCodec ? ["-vcodec", inputCodec] : []),
    ...(cutFrom ? ["-ss", cutFrom] : []),
    "-i",
    path,
    ...(cutTo ? ["-t", (cutTo - cutFrom) * speedFactor] : []),
    "-vf",
    `${ptsFilter}fps=${framerateStr},${scaleFilter}`,
    "-map",
    "v:0",
    "-vcodec",
    "rawvideo",
    "-pix_fmt",
    "rgba",
    "-f",
    "image2pipe",
    "-",
  ]

  const ps = execa(FFMPEG, args, {
    encoding: null,
    buffer: false,
    stdin: "ignore",
    stdout: "pipe",
    stderr: process.stderr,
  })

  const stream: any = ps.stdout

  let timeout: any
  let ended = false

  stream.once("end", () => {
    clearTimeout(timeout)
    ended = true
  })

  async function readNextFrame(progress: any, canvas: any) {
    const rgba: any = await new Promise((resolve, reject) => {
      if (ended) {
        console.log(path, "Tried to read next video frame after ffmpeg video stream ended")
        // @ts-ignore
        resolve()
        return
      }

      function onEnd() {
        // @ts-ignore
        resolve()
      }

      function cleanup() {
        stream.pause()
        // eslint-disable-next-line no-use-before-define
        stream.removeListener("data", handleChunk)
        stream.removeListener("end", onEnd)
        stream.removeListener("error", reject)
      }

      function handleChunk(chunk: any) {
        const nCopied = length + chunk.length > frameByteSize ? frameByteSize - length : chunk.length
        chunk.copy(buf, length, 0, nCopied)
        length += nCopied

        if (length > frameByteSize) console.error("Video data overflow", length)

        if (length >= frameByteSize) {
          const out = Buffer.from(buf)

          const restLength = chunk.length - nCopied
          if (restLength > 0) {
            chunk.slice(nCopied).copy(buf, 0)
            length = restLength
          } else {
            length = 0
          }

          // inFrameCount += 1;

          clearTimeout(timeout)
          cleanup()
          resolve(out)
        }
      }

      timeout = setTimeout(() => {
        console.warn("Timeout on read video frame")
        cleanup()
        // @ts-ignore
        resolve()
      }, 60000)

      stream.on("data", handleChunk)
      stream.on("end", onEnd)
      stream.on("error", reject)
      stream.resume()
    })

    if (!rgba) return

    assert(rgba.length === frameByteSize)
    const img = await rgbaToFabricImage({ width: width, height: height, rgba })

    img.setOptions(layer)

    canvas.add(img)
  }

  const close = () => {
    console.log("Close", path)
    ps.cancel()
  }

  return {
    readNextFrame,
    close,
  }
}
