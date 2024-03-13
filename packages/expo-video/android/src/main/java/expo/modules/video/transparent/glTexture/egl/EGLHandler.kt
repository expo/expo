package expo.modules.video.transparent.glTexture.egl

import android.graphics.SurfaceTexture
import javax.microedition.khronos.egl.EGL10
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay
import javax.microedition.khronos.egl.EGLSurface
import javax.microedition.khronos.opengles.GL10

internal class EGLHandler(surfaceTexture: SurfaceTexture) {
  val gl by lazy { context.gl as GL10 }
  val config: EGLConfig by lazy {
    EGLHandlerBuilder.createEglConfig(egl = egl, display = display)
  }
  private val surface: EGLSurface by lazy {
    egl.eglCreateWindowSurface(display, config, surfaceTexture, null)
  }
  private val context: EGLContext by lazy {
    EGLHandlerBuilder.createContext(egl = egl, display = display, config = config)
  }
  private val egl: EGL10 = EGLContext.getEGL() as EGL10
  private val display: EGLDisplay by lazy { EGLHandlerBuilder.createDisplay(egl = egl) }

  init {
    egl.eglMakeCurrent(display, surface, surface, context)
  }

  fun destroy() {
    destroySurface()
    egl.eglDestroyContext(display, context)
    egl.eglTerminate(display)
  }

  fun displaySurface() {
    egl.eglSwapBuffers(display, surface)
  }

  private fun destroySurface() {
    if (surface !== EGL10.EGL_NO_SURFACE) {
      egl.eglMakeCurrent(
        display,
        EGL10.EGL_NO_SURFACE,
        EGL10.EGL_NO_SURFACE,
        EGL10.EGL_NO_CONTEXT
      )
      egl.eglDestroySurface(display, surface)
    }
  }
}
