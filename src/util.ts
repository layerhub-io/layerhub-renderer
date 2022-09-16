export const isUrl = (path: string) => /^https?:\/\//.test(path)
export const isGif = (url: string) => url.toLowerCase().endsWith(".gif")
