import { fabric } from "fabric"

export type RenderingProgress = number

export enum TemplateType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}
export interface Dimension {
  width: number
  height: number
}

interface LayerBaseOptions {
  id: string
  name?: string
  type: string
  top: number
  left: number
  angle: number
  width: number
  height: number
  originX: string
  originY: string
  scaleX: number
  scaleY: number
  opacity: number
  flipX: boolean
  flipY: boolean
  skewX: number
  skewY: number
  stroke: any
  strokeWidth: number
  animation?: Animation
  duration?: number
  between?: TimeRange
  cut?: TimeRange
}

interface Animation {
  type: string
}

interface Duration {
  start: number
  stop: number
  time?: number
}

interface Cut {
  from: string
  top: string
}

interface TimeRange {
  from: any
  to: any
}

interface TextMetadata {
  textAlign: string
  fontFamily: string
  fontSize: number
  fontWeight: string
  charSpacing: number
  lineHeight: number
  text: string
  fill: string
}

interface BackgroundMetadata {
  fill: string
}

interface ImageMetadata {
  src: string
  cropX: number
  cropY: number
}

interface PathMetadata {
  value: number[][]
  fill: string
}

export interface LayerTemplate<T> extends LayerBaseOptions {
  metadata: T
}

export interface StaticVideoMetadata {
  src: string
  cut: TimeRange
  speedFactor: number
}

export type TextLayer = LayerTemplate<TextMetadata>
export type ImageLayer = LayerTemplate<ImageMetadata>
export type StaticVideoLayer = LayerTemplate<StaticVideoMetadata>
export type PathLayer = LayerTemplate<PathMetadata>
export type BackgroundLayer = LayerTemplate<BackgroundMetadata>
export type Layer = TextLayer | ImageLayer | PathLayer | BackgroundLayer

type FontVariant = 300 | 400 | 500 | 600 | 700 | 800

type FontFile = Record<FontVariant, string>

export interface FontFamily {
  id: string
  family: string
  variants: FontVariant[]
  fontFiles: FontFile[]
  subsets: string[]
  version: string
  lastModified: string
  category: string
  kind: string
}

interface FrameSourceConfig {
  item: Layer
  inGroup: boolean
}

interface FrameRender {
  render: (progress: number, canvas: fabric.StaticCanvas) => void
}

export type FrameSource = (config: FrameSourceConfig) => Promise<FrameRender>
