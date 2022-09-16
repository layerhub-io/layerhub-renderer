import VideoRenderer from "./video-renderer"
import GifRenderer from "./gif-renderer"
import ImageRenderer from "./image-renderer"

class Renderer {
  static ImageRenderer = ImageRenderer
  static GifRenderer = GifRenderer
  static VideoRenderer = VideoRenderer
}

export default Renderer
