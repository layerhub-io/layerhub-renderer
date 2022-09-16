import { Dimension, Layer, TemplateType } from "./common"

export interface ImageTemplate {
  id: string
  name?: string
  description?: string
  type: TemplateType.IMAGE
  dimension: Dimension
  layers: Layer[]
  metadata: ImageTemplateMetadata
}

interface ImageTemplateMetadata {
  preview: string
}
