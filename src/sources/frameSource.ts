import pMap from "p-map"
import imageFrameSource from "./fabric/imageFrameSource"
import fillColorFrameSource from "./fabric/fillColorFrameSource"
import imageOverlayFrameSource from "./fabric/imageOverlayFrameSource"
import textFrameSource from "./fabric/staticTextFrameSource"
import { createVideoFrameSource } from "./videoFrameSource"
import { fabric } from "fabric"
import nodeCanvas from "canvas"
import staticPathFrameSource from "./fabric/staticPathFrameSource"
import backgroundFrameSource from "./fabric/backgroundFrameSource"

const fabricFrameSources = {
  image: imageFrameSource,
  "fill-color": fillColorFrameSource,
  Background: backgroundFrameSource,
  StaticImage: imageOverlayFrameSource,
  StaticText: textFrameSource,
  StaticPath: staticPathFrameSource,
}

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

async function createFabricFrameSource(func: any, opts: any) {
  const onInit = async () => func(opts)

  const { onRender, onClose = () => {} } = (await onInit()) || {}
  return {
    readNextFrame: onRender,
    close: onClose,
  }
}
const createFabricCanvas = ({ width, height }: any) => {
  const canvas = new fabric.StaticCanvas(null, { width, height })
  return canvas
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

function getNodeCanvasFromFabricCanvas(fabricCanvas: fabric.StaticCanvas) {
  // @ts-ignore
  return fabric.util.getNodeCanvas(fabricCanvas.lowerCanvasEl)
}

function canvasToRgba(ctx: any) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  return Buffer.from(imageData.data)
}

function fabricCanvasToRgba(fabricCanvas: any) {
  const internalCanvas = getNodeCanvasFromFabricCanvas(fabricCanvas)
  const ctx = internalCanvas.getContext("2d")

  // require('fs').writeFileSync(`${Math.floor(Math.random() * 1e12)}.png`, internalCanvas.toBuffer('image/png'));
  // throw new Error('abort');

  return canvasToRgba(ctx)
}

async function renderFabricCanvas(canvas: any) {
  // console.time('canvas.renderAll');
  canvas.renderAll()
  // console.timeEnd('canvas.renderAll');
  const rgba = fabricCanvasToRgba(canvas)
  canvas.clear()
  canvas.dispose()
  return rgba
}

async function createFrameSource({ clip, width, height, fps, framerateStr }: any) {
  const { layers } = clip
  const visualLayers = layers.filter((layer: any) => layer.type !== "audio")

  const layerFrameSources = await pMap(
    visualLayers,
    async (layer: any, layerIndex) => {
      const { type, ...params } = layer

      let createFrameSourceFunc

      if (fabricFrameSources[type as "image"]) {
        createFrameSourceFunc = async (opts: any) => createFabricFrameSource(fabricFrameSources[type as "image"], opts)
      } else {
        createFrameSourceFunc = {
          StaticVideo: createVideoFrameSource,
          // gl: createGlFrameSource,
          // canvas: createCustomCanvasFrameSource,
        }[type as "StaticVideo"] as any
      }

      // const createFrameSourceFunc = async (opts: any) =>
      //   createFabricFrameSource(fabricFrameSources[type as "image"], opts)

      const frameSource = await createFrameSourceFunc({
        layer,
        options: {
          width,
          height,
          fps,
          framerateStr,
        },
      })

      return { layer, frameSource }
    },
    { concurrency: 1 }
  )

  async function readNextFrame({ time }: any) {
    const canvas = createFabricCanvas({ width, height })
    for (const { frameSource, layer } of layerFrameSources) {
      const offsetProgress = (time - layer.start) / layer.layerDuration
      const shouldDrawLayer = offsetProgress >= 0 && offsetProgress <= 1

      if (shouldDrawLayer) {
        const rgba = await frameSource.readNextFrame(offsetProgress, canvas)

        // Frame sources can either render to the provided canvas and return nothing
        // OR return an raw RGBA blob which will be drawn onto the canvas
        if (rgba) {
          // Optimization: Don't need to draw to canvas if there's only one layer
          if (layerFrameSources.length === 1) return rgba

          const img = await rgbaToFabricImage({ width, height, rgba })
          canvas.add(img)
        } else {
          // Assume this frame source has drawn its content to the canvas
        }
      }
    }
    const rgba = await renderFabricCanvas(canvas)
    return rgba
  }

  async function close() {
    await pMap(layerFrameSources, async ({ frameSource }) => frameSource.close())
  }

  return {
    readNextFrame,
    close,
  }
}

export default createFrameSource
