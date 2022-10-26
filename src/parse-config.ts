import pMap from "p-map"
import assert from "assert"
import flatMap from "lodash/flatMap"
import { execa } from "execa"

const FFPROBE = "ffprobe"

async function readDuration(p: string) {
  const { stdout } = await execa(FFPROBE, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    p,
  ])
  const parsed = parseFloat(stdout)
  assert(!Number.isNaN(parsed))
  return parsed
}

async function readFileStreams(p: string) {
  const { stdout } = await execa(FFPROBE, ["-show_entries", "stream", "-of", "json", p])
  const json = JSON.parse(stdout)
  return json.streams
}

async function readVideoFileInfo(p: string) {
  const streams = await readFileStreams(p)
  const stream = streams.find((s: any) => s.codec_type === "video") // TODO

  const duration = await readDuration(p)

  const rotation = stream.tags && stream.tags.rotate && parseInt(stream.tags.rotate, 10)
  return {
    // numFrames: parseInt(stream.nb_frames, 10),
    duration,
    width: stream.width, // TODO coded_width?
    height: stream.height,
    framerateStr: stream.r_frame_rate,
    rotation: !Number.isNaN(rotation) ? rotation : undefined,
  }
}

async function parseConfig({ clips }: any) {
  const defaults = {
    duration: 5,
    transition: null,
  }

  let clipsOut = await pMap(
    clips,
    async (clip: any, clipIndex) => {
      const { duration: userClipDuration, layers } = clip
      const videoLayers = layers.filter((layer: any) => layer.type === "StaticVideo")

      const userClipDurationOrDefault = userClipDuration || defaults.duration

      if (videoLayers.length === 0) {
        assert(userClipDurationOrDefault, `Duration parameter is required for videoless clip ${clipIndex}`)
      }

      const transition = { duration: 0 }

      let layersOut = flatMap(
        await pMap(
          layers,
          async (layer: any) => {
            const { type, src } = layer

            if (type === "StaticVideo") {
              const {
                duration: fileDuration,
                width: widthIn,
                height: heightIn,
                framerateStr,
                rotation,
              } = await readVideoFileInfo(src)
              let { cut } = layer

              if (!cut.from) cut.from = 0
              cut.from = Math.max(cut.from, 0)
              cut.from = Math.min(cut.from, fileDuration)

              if (!cut.to) cut.to = fileDuration
              cut.to = Math.max(cut.to, cut.from)
              cut.to = Math.min(cut.to, fileDuration)

              const inputDuration = cut.to - cut.from

              const isRotated = rotation === 90 || rotation === 270
              const inputWidth = isRotated ? heightIn : widthIn
              const inputHeight = isRotated ? widthIn : heightIn

              return {
                ...layer,
                cut,
                duration: inputDuration,
                framerateStr,
                inputWidth,
                inputHeight,
              }
            }

            return layer
          },
          { concurrency: 1 }
        )
      )
      let clipDuration = userClipDurationOrDefault

      const firstVideoLayer = layersOut.find((layer) => layer.type === "StaticVideo")

      if (firstVideoLayer && !userClipDuration) clipDuration = firstVideoLayer.duration

      // We need to map again, because for audio, we need to know the correct clipDuration
      layersOut = await pMap(layersOut, async (layerIn) => {
        const { stop, start = 0, type } = layerIn

        // This feature allows the user to show another layer overlayed (or replacing) parts of the lower layers (start - stop)
        const layerDuration = (stop || clipDuration) - start
        // TODO Also need to handle video layers (speedFactor etc)
        // TODO handle audio in case of start/stop

        const layer = { ...layerIn, start, layerDuration }

        if (type === "StaticVideo") {
          const { duration } = layer

          let speedFactor
          // If user explicitly specified duration for clip, it means that should be the output duration of the video
          if (userClipDuration) {
            // Later we will speed up or slow down video using this factor
            speedFactor = userClipDuration / duration
          } else {
            speedFactor = 1
          }
          return { ...layer, metadata: { ...layer.metadata, speedFactor } }
        }

        return layer
      })
      // Filter out deleted layers
      layersOut = layersOut.filter((l) => l)
      return {
        transition,
        duration: clipDuration,
        layers: layersOut,
      }
    },
    { concurrency: 1 }
  )

  return {
    clips: clipsOut,
    arbitraryAudio: [],
  }
}

export default parseConfig
