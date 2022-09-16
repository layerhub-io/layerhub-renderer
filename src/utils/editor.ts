import { Layer } from "../interfaces/common"

export function getBaseOptions(item: Layer) {
  const { left, top, width, height, scaleX, scaleY, opacity, flipX, flipY, skewX, skewY, angle, originX, originY } =
    item
  let metadata = item.metadata ? item.metadata : {}
  let baseOptions = {
    angle: angle ? angle : 0,
    top: top,
    left: left,
    width: width,
    height: height,
    originX: originX || "left",
    originY: originY || "top",
    scaleX: scaleX || 1,
    scaleY: scaleY || 1,
    opacity: opacity ? opacity : 1,
    flipX: flipX ? flipX : false,
    flipY: flipY ? flipY : false,
    skewX: skewX ? skewX : 0,
    skewY: skewY ? skewY : 0,
    metadata: metadata,
  }
  return baseOptions
}
