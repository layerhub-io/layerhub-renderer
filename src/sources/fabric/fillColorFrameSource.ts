import { fabric } from "fabric"

const fillColorFrameSource = ({ layer, options: { width, height } }: any) => {
  const onRender = async (progress: number, canvas: fabric.StaticCanvas) => {
    const rect = new fabric.Rect({
      width: width,
      height: height,
      left: 0,
      top: 0,
      fill: "#f39c12",
    })
    canvas.add(rect)
  }
  return { onRender }
}

export default fillColorFrameSource
