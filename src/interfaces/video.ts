import { Dimension, Layer, TemplateType } from "./common"

export interface VideoTemplate {
  name?: string
  type: TemplateType.VIDEO
  description?: string
  dimension: Dimension
  clips: Clip[]
  metadata?: VideoTemplateMetadata
  duration?: number
}

export interface Clip {
  id: string
  duration?: string
  name?: string
  description?: string
  layers: Layer[]
}

export interface VideoRendererOptions {
  clips: Clip[]
}

interface VideoTemplateMetadata {
  preview: string
}
