import { ILayer, IScene } from "@layerhub-io/types"
import { IDesign } from "./types"

export const prepareDesign = (design: IDesign): IDesign => {
  const preparedScenes = design.scenes.map((scene) => prepareScene(scene))
  return { ...design, scenes: preparedScenes }
}

const prepareScene = (scene: IScene) => {
  const updatedLayers = scene.layers.map((layer) => prepareLayer(layer as ILayer))
  return { ...scene, layers: updatedLayers, duration: scene.duration! / 1000 }
}

const prepareLayer = (layer: ILayer) => {
  if (layer.type === "StaticVideo") {
    const parsedLayer = {
      ...layer,
      ...(layer.duration && { duration: layer.duration / 1000 }),
      ...(layer.cut && {
        cut: { from: layer.cut.from! / 1000, to: layer.cut.to! / 1000 },
      }),
    }
    return parsedLayer
  }
  return layer
}
