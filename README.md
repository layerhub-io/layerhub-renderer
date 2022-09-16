# Layerhub Renderer Engine

Layerhub image, gif and video renderer engine.

## How to start

1. Make sure you have FFmpeg installed in your system.
2. Create `.env` file from `.env.sample`

```sh
pnmp i # install dependencies
pnpm dev # start server on development mode
```

NOTE 1: The environment varialble `CDN_BASE` should point where are located your uploaded videos.

NOTE 2: Renderer API should be running in port 8080, make sure you are updating it on client APP.
