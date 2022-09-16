import Express from "express"
import cors from "cors"
import fs from "fs"
import { join, dirname } from "path"
import VideoRenderer from "./video-renderer"
import aws from "./services/aws"

const app = Express()

app.use(cors())

app.use(Express.json())

app.get("/", (req, res) => {
  res.send("Running")
})

app.post("/render", async (req, res) => {
  try {
    const template = req.body
    const renderer = new VideoRenderer(template)
    renderer
      .render()
      .then(() => {
        const outDir = dirname("outPath")
        const file = join(outDir, `position.mp4`)
        const buffer = fs.readFileSync(file)
        return aws.uploadBuffer("video.mp4", buffer)
      })
      .then((url) => res.json({ url }))
      .catch((err) => {
        console.log(err)
        res.send("SOMETHING WENT WRONG")
      })
  } catch (err) {
    console.log(err)
    res.send("Something went wrong")
  }
})

app.listen(8080, () => {
  console.log("APP RUNNING ON PORT 8080")
})
