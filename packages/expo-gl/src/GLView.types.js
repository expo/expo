// @flow

export type SurfaceCreateEvent = {
  nativeEvent: {
    exglCtxId: number,
  },
};

export type SnapshotOptions = {
  flip?: boolean,
  framebuffer?: WebGLFramebuffer,
  rect?: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
  format?: 'jpeg' | 'png',
  compress?: number,
};
