import { TemplateType } from "../interfaces/common"
import { VideoTemplate } from "../interfaces/video"

export const videoTemplate: VideoTemplate = {
  type: TemplateType.VIDEO,
  metadata: {
    preview: "",
  },
  name: "Untitled design",
  clips: [
    {
      id: "la",
      layers: [
        {
          id: "background",
          name: "Initial Frame",
          angle: 0,
          stroke: null,
          strokeWidth: 0,
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          opacity: 1,
          originX: "left",
          originY: "top",
          scaleX: 1,
          scaleY: 1,
          type: "Background",
          flipX: false,
          flipY: false,
          skewX: 0,
          skewY: 0,
          // visible: true,
          metadata: {
            fill: "#ffffff",
          },
        },
        {
          id: "ss",
          angle: 0,
          stroke: "#ffffff",
          strokeWidth: 0,
          left: 720,
          top: 380.25,
          width: 640,
          height: 426,
          opacity: 1,
          originX: "left",
          originY: "top",
          scaleX: 0.75,
          scaleY: 0.75,
          type: "StaticImage",
          flipX: false,
          flipY: false,
          skewX: 0,
          skewY: 0,
          // visible: true,
          metadata: {
            src: "https://pixabay.com/get/gf69771ecc63596b7d3ecb22c74829bde023b47749f7f1298395b6991ab828e546ebc33c882e2e89e724854939821ea75_640.jpg",
            cropX: 0,
            cropY: 0,
          },
        },
      ],
    },
  ],
  dimension: {
    width: 1920,
    height: 1080,
  },
}
