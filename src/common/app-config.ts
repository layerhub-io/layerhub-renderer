import dotenv from "dotenv"

dotenv.config()

export interface AppConfig {
  cdnBase: string
  aws: {
    bucket: string
    credentials: {
      accessKeyId: string
      secretAccessKey: string
    }
  }
  appPort: number
  appHost: string
}

class Config implements AppConfig {
  public cdnBase: string
  public aws: {
    bucket: string
    credentials: { accessKeyId: string; secretAccessKey: string }
  }
  public appPort: number
  public appHost: string
  constructor() {
    this.cdnBase = process.env.CDN_BASE as string
    this.aws = {
      bucket: process.env.AWS_BUCKET_NAME as string,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    }
    this.appPort = parseInt((process.env.PORT as string) || "8080")
  }
}

export default new Config()
