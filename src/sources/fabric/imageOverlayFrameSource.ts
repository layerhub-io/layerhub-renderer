// @ts-nocheck
import { fabric } from "fabric"
import fileUrl from "file-url"
import { ImageLayer } from "../../interfaces/common"

const isUrl = (path: string) => /^https?:\/\//.test(path)

const loadImage = async (pathOrUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve) =>
    fabric.util.loadImage(isUrl(pathOrUrl) ? pathOrUrl : fileUrl(pathOrUrl), (img) => {
      resolve(img)
    })
  )

async function imageOverlayFrameSource({ layer, options }: { layer: ImageLayer; options: any }) {
  const src = layer.src

  const image = await loadImage(src)

  const element = new fabric.StaticImage(image, {
    ...layer,
    cropX: 0,
    cropY: 0,
  }) as unknown as fabric.Object

  async function onRender(progress: number, canvas: fabric.StaticCanvas) {
    canvas.add(element)
  }

  return { onRender }
}

export default imageOverlayFrameSource
