// @ts-nocheck
import { fabric } from "fabric"

export class StaticVideoObject extends fabric.Image {
  static type = "StaticVideo"
  initialize(video: any, options: any) {
    const defaultOpts = {
      objectCaching: false,
      cacheProperties: ["time"],
    }
    options = options || {}

    super.initialize(video, Object.assign({}, defaultOpts, options))
    return this
  }

  _draw(video, ctx, w, h) {
    const d = {
      x: -this.width / 2,
      y: -this.height / 2,
      w: this.width,
      h: this.height,
    }
    ctx.drawImage(video, d.x, d.y, d.w, d.h)
  }
  _render(ctx) {
    this._draw(this.getElement(), ctx)
  }
}
fabric.StaticVideo = fabric.util.createClass(StaticVideoObject, {
  type: StaticVideoObject.type,
})

declare module "fabric" {
  namespace fabric {
    class StaticVideo extends StaticVideoObject {
      constructor(element: any, options: any)
    }
  }
}
