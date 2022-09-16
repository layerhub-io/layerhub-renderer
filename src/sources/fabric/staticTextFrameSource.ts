// @ts-nocheck
import { fabric } from "fabric"
import { TextLayer } from "../../interfaces/common"

async function staticTextFrameSource({ layer, options }: { layer: TextLayer; options: any }) {
  // const metadata = layer.metadata
  const { textAlign, fontFamily, fontSize, fontWeight, charSpacing, lineHeight, text } = layer
  const textOptions = {
    ...layer,
    text: text ? text : "Default Text",
    ...(textAlign && { textAlign }),
    ...(fontFamily && { fontFamily }),
    ...(fontSize && { fontSize }),
    ...(fontWeight && { fontWeight }),
    ...(charSpacing && { charSpacing }),
    ...(lineHeight && { lineHeight }),
  }

  const element = new fabric.StaticText(textOptions)

  async function onRender(progress: number, canvas: fabric.StaticCanvas) {
    canvas.add(element)
  }

  return { onRender }
}

export default staticTextFrameSource
