import { customAlphabet } from "nanoid"

import AWS from "aws-sdk"
import config from "../common/app-config"
import mime from "mime/lite"

class AWSService {
  client: AWS.S3

  constructor() {
    this.init()
  }

  uploadBuffer = async (filename: string, data: Buffer): Promise<string> => {
    const key = uniqueFilename(filename)
    const contentType = mime.getType(key) as string

    const params = {
      Bucket: config.aws.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }
    const url = await new Promise<string>((resolve, reject) => {
      this.client.putObject(params, (err) => {
        if (err) reject(err)
        resolve(config.cdnBase + key)
      })
    })
    return url
  }

  getSignedUrlForDownload = async ({ fileName }: { fileName: string }) => {
    const { aws } = config
    const params = {
      Bucket: aws.bucket,
      Key: fileName,
      Expires: 60,
    }

    const url = await new Promise((resolve, reject) => {
      this.client.getSignedUrl("getObject", params, (err, url) => {
        if (err) reject(err)
        resolve(url)
      })
    })
    return url
  }

  getSignedUrlForUpload = async ({ fileName }: { fileName: string }) => {
    const { aws } = config
    const contentType = mime.getType(fileName) as string

    const params = {
      Bucket: aws.bucket,
      Key: fileName,
      Expires: 60,
      ContentType: contentType,
    }

    const url = await new Promise((resolve, reject) => {
      this.client.getSignedUrl("putObject", params, (err, url) => {
        if (err) reject(err)

        resolve(url)
      })
    })

    return url
  }

  init = () => {
    const { aws } = config
    AWS.config.update({
      accessKeyId: aws.credentials.accessKeyId,
      secretAccessKey: aws.credentials.secretAccessKey,
      region: "us-east-1",
    })
    this.client = new AWS.S3()
  }
}

export default new AWSService()

function uniqueId() {
  const nanoid = customAlphabet("_0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 24)
  return nanoid()
}

function uniqueFilename(name: string) {
  const nameArray = name.split(".")
  const extension = nameArray[nameArray.length - 1]
  const uniqueName = [uniqueId(), extension].join(".")
  return uniqueName
}
