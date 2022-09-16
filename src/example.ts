import VideoRenderer from "./video-renderer"

const options = {
  outPath: "./position.mp4",
  verbose: false,
  duration: 10,
  fps: 25,
  dimension: {
    width: 1200,
    height: 1200,
  },
  clips: [
    {
      duration: 5,
      layers: [
        {
          id: "background",
          name: "Initial Frame",
          angle: 0,
          stroke: null,
          strokeWidth: 0,
          left: 0,
          top: 0,
          width: 1200,
          height: 1200,
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
          visible: true,
          shadow: {
            color: "#fcfcfc",
            blur: 4,
            offsetX: 0,
            offsetY: 0,
            affectStroke: false,
            nonScaling: false,
          },
          fill: "#8e44ad",
          metadata: {},
        },
      ],
    },
    {
      duration: 5,
      layers: [
        {
          id: "background",
          name: "Initial Frame",
          angle: 0,
          stroke: null,
          strokeWidth: 0,
          left: 0,
          top: 0,
          width: 1200,
          height: 1200,
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
          visible: true,
          shadow: {
            color: "#fcfcfc",
            blur: 4,
            offsetX: 0,
            offsetY: 0,
            affectStroke: false,
            nonScaling: false,
          },
          fill: "#c0392b",
          metadata: {},
        },
      ],
    },
  ],
}

const renderer = new VideoRenderer(options)

console.log(JSON.stringify(options))

renderer
  .render()
  .then(() => console.log("DONE"))
  .catch((err) => console.log("ERROR", err))
