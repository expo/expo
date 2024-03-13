package expo.modules.video.transparent.glTexture.egl

import android.opengl.EGL14.EGL_CONTEXT_CLIENT_VERSION
import javax.microedition.khronos.egl.EGL10
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay

internal object EGLHandlerBuilder {
  private const val RED_BUFFER_SIZE = 8
  private const val GREEN_BUFFER_SIZE = 8
  private const val BLUE_BUFFER_SIZE = 8
  private const val ALPHA_BUFFER_SIZE = 8
  private const val DEPTH_BUFFER_SIZE = 16
  private const val RENDER_TYPE = 4
  private const val OPENGL_VERSION_MAJOR = 2

  fun createEglConfig(egl: EGL10, display: EGLDisplay): EGLConfig {
    val attributes = intArrayOf(
      EGL10.EGL_RED_SIZE, RED_BUFFER_SIZE,
      EGL10.EGL_GREEN_SIZE, GREEN_BUFFER_SIZE,
      EGL10.EGL_BLUE_SIZE, BLUE_BUFFER_SIZE,
      EGL10.EGL_ALPHA_SIZE, ALPHA_BUFFER_SIZE,
      EGL10.EGL_DEPTH_SIZE, DEPTH_BUFFER_SIZE,
      EGL10.EGL_RENDERABLE_TYPE, RENDER_TYPE,
      EGL10.EGL_NONE
    )

    val configQuantityList = IntArray(1)
    egl.eglChooseConfig(display, attributes, null, 0, configQuantityList)
    val configQuantity = configQuantityList.first()
    require(configQuantity != 0)
    val configs = arrayOfNulls<EGLConfig>(configQuantity)
    egl.eglChooseConfig(display, attributes, configs, configQuantity, configQuantityList)
    return configs.first() ?: throw IllegalStateException("Error during EGL config")
  }

  fun createDisplay(egl: EGL10): EGLDisplay = egl
    .eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY)
    .also {
      val unusedVersion = IntArray(3)
      egl.eglInitialize(it, unusedVersion)
    }

  fun createContext(egl: EGL10, display: EGLDisplay, config: EGLConfig): EGLContext {
    val contextAttr = intArrayOf(
      EGL_CONTEXT_CLIENT_VERSION,
      OPENGL_VERSION_MAJOR,
      EGL10.EGL_NONE
    )
    return egl.eglCreateContext(display, config, EGL10.EGL_NO_CONTEXT, contextAttr)
  }
}
