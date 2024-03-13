package expo.modules.video.transparent.glTexture

import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

interface Renderer {
  fun onSurfaceCreated(gl: GL10, config: EGLConfig)
  fun onSurfaceChanged(gl: GL10, width: Int, height: Int)
  fun onDrawFrame(gl: GL10)
  fun onSurfaceDestroyed()
}
