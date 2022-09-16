// @ts-nocheck
import { fabric } from "fabric"
import { PathLayer } from "../../interfaces/common"

function staticPathFrameSource({ layer, options }: { layer: PathLayer; options: any }) {
  const { path, fill } = layer
  // @ts-ignore
  const element = new fabric.Path(path, { ...layer, fill })

  async function onRender(progress: number, canvas: fabric.StaticCanvas) {
    canvas.add(element)
  }

  return { onRender }
}

export default staticPathFrameSource
