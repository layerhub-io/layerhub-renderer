import { IFrame, IScene } from "@layerhub-io/types"

export interface IDesign {
  id: string
  name: string
  frame: IFrame
  type: string
  scenes: IScene[]
  previews: { id: string; src: string }[]
  metadata: {}
  published?: boolean
  fps?: number
}
