import { execa, ExecaChildProcess, ExecaError } from "execa"
import assert from "assert"
import compareVersions from "compare-versions"
import { Dimension } from "./interfaces/common"

const FFMPEG = "ffmpeg"
const FFPROBE = "ffprobe"

interface WriterProcessOptions {
  fps: number
  dimension: Dimension
  outPath: string
  outputArgs: string[]
}

class FFmpeg {
  public ffmpegWriterProcess: ExecaChildProcess<Buffer>
  public outProcessExitCode: number | null
  public outProcessError: ExecaError<Buffer>
  public framerateStr: string
  public fps: number
  public dimension: any
  constructor({ framerateStr, fps, dimension }: any) {
    this.dimension = dimension
    this.framerateStr = framerateStr
    this.initialize()
  }

  public initialize = () => {
    this.validate()
    const outputArgs = this.getOutputArgs()
    this.ffmpegWriterProcess = this.startFFmpegWriterProcess({
      fps: 25,
      outPath: "./position.mp4",
      outputArgs,
      dimension: this.dimension,
    })
    this.registerEvents()
  }

  private registerEvents = () => {
    this.ffmpegWriterProcess.on("exit", (code) => {
      this.outProcessExitCode = code
    })
    this.ffmpegWriterProcess.catch((err) => {
      this.outProcessError = err
    })
  }

  public write = async (outFrameData: any) => {
    await new Promise((resolve) => this.ffmpegWriterProcess.stdin!.write(outFrameData, resolve))
  }

  public close = () => {
    this.ffmpegWriterProcess.stdin!.end()
  }

  public kill = () => {
    this.ffmpegWriterProcess.kill()
  }

  public ensureDone = async () => {
    await this.ffmpegWriterProcess
  }

  public validate = async () => {
    // this.validatePackage(FFMPEG)
    // this.validatePackage(FFPROBE)
  }

  public getOutputArgs = () => {
    const outputArgs = [
      "-vf",
      "format=yuv420p",
      "-vcodec",
      "libx264",
      "-profile:v",
      "high",
      "-preset:v",
      "medium",
      "-crf",
      "18",
      "-movflags",
      "faststart",
    ]

    return [...outputArgs]
  }

  public startFFmpegWriterProcess = ({
    fps,
    dimension,
    outPath,
    outputArgs,
  }: WriterProcessOptions): ExecaChildProcess<Buffer> => {
    const { width, height } = dimension
    let framerateStr = this.framerateStr
    const args = [
      ...["-hide_banner", "-loglevel", "error"],
      "-f",
      "rawvideo",
      "-vcodec",
      "rawvideo",
      "-pix_fmt",
      "rgba",
      "-s",
      `${width}x${height}`,
      "-r",
      framerateStr,
      "-i",
      "-",
      ...["-map", "0:v:0"],
      ...outputArgs,
      "-y",
      outPath,
    ]

    return execa(FFMPEG, args, {
      encoding: null,
      buffer: false,
      stdin: "pipe",
      stdout: process.stdout,
      stderr: process.stderr,
    })
  }

  public validatePackage = async (name: string) => {
    const minRequiredVersion = "4.3.1"
    const { stdout } = await execa(name, ["-version"])
    const firstLine = stdout.split("\n")[0]
    const match = firstLine.match(`${name} version n([0-9.]+)`)
    assert(match, "Unknown version string")
    const versionStr = match[1]
    console.log(versionStr)
    assert(compareVersions.compare(versionStr, minRequiredVersion, ">="), "Version is outdated")
  }
}

export default FFmpeg
