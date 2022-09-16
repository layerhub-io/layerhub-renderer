// @ts-nocheck
import pMap from "p-map"
import { Clip } from "../common/interfaces"

export const parseClips = async (clips: Clip[]) => {
  const defaults = {
    duration: 4,
    transition: null,
  }
  const clipsOut = await pMap(
    clips,
    async (clip, clipIndex) => {
      const { layers } = clip
      const clipDuration = defaults.duration

      const layersOut = await pMap(layers, async (layer) => {
        let duration = {
          start: 0,
          time: clipDuration,
          stop: clipDuration,
        }
        if (layer.duration) {
          const { start = 0, stop } = layer.duration
          const layerDuration = (stop || clipDuration) - start
          duration = {
            ...duration,
            start,
            stop,
            time: layerDuration,
          }
        }

        return {
          ...layer,
          duration: { ...layer.duration, ...duration },
        }
      })
      return {
        transition: { duration: 0 },
        layers: layersOut,
        duration: clipDuration,
      }
    },
    { concurrency: 1 }
  )
  return {
    clips: clipsOut,
    arbitraryAudio: [],
  }
}
