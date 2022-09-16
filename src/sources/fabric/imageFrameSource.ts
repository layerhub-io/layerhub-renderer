import { fabric } from "fabric"
import fileUrl from "file-url"

const isUrl = (path: string) => /^https?:\/\//.test(path)

const loadImage = async (pathOrUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve) =>
    fabric.util.loadImage(isUrl(pathOrUrl) ? pathOrUrl : fileUrl(pathOrUrl), (img) => {
      resolve(img)
    })
  )

const imageFrameSource = async ({ verbose, params, width, height }: any) => {
  const { path } = params
  const imgData = await loadImage(path)
  const createImg = () =>
    new fabric.Image(imgData, {
      originX: "center",
      originY: "center",
      left: width / 2,
      top: height / 2,
    })

  async function onRender(progress: number, canvas: fabric.StaticCanvas) {
    const img = createImg()
    canvas.add(img)
  }
  function onClose() {}
  return {
    onRender,
    onClose,
  }
}

export default imageFrameSource
