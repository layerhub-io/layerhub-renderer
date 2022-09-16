// @ts-nocheck
import { fabric } from "fabric"
import { BackgroundLayer } from "../../interfaces/common"

function backgroundFrameSource({ layer, options }: { layer: BackgroundLayer; options: any }) {
  const fill = layer.fill
  const element = new fabric.Background({
    ...layer,
    fill: fill ? fill : "#000000",
    id: "background",
    name: "",
  })
  async function onRender(progress: number, canvas: fabric.StaticCanvas) {
    canvas.add(element)
  }

  return { onRender }
}

export default backgroundFrameSource
