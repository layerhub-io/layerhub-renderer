import { Layer } from "../interfaces/common"

export type RenderingProgress = number

export interface VideoRendererOptions {
  clips: Clip[]
}

export interface Clip {
  id: string
  duration?: string
  name?: string
  description?: string
  layers: Layer[]
}

export type LayerType = "Video" | "Image" | "Path"
