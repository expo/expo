package expo.modules.video.transparent.glTexture

import android.graphics.SurfaceTexture
import android.view.TextureView
import expo.modules.video.transparent.glTexture.egl.EGLHandler
import expo.modules.video.transparent.glTexture.opengl.OpenGLContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

internal class GLTextureViewListener(
  scope: CoroutineScope,
  private val renderer: Renderer,
  requestRender: Flow<Unit>
) : TextureView.SurfaceTextureListener {
  private val openGLContext = OpenGLContext(scope)
  private var currentEGLHandler: EGLHandler? = null

  init {
    requestRender.onEach { drawFrame() }.launchIn(scope)
  }

  override fun onSurfaceTextureAvailable(
    surfaceTexture: SurfaceTexture,
    width: Int,
    height: Int
  ) = openGLContext.execute {
    if (currentEGLHandler != null) return@execute
    val eglHandler = EGLHandler(surfaceTexture = surfaceTexture).also { currentEGLHandler = it }
    renderer.onSurfaceCreated(gl = eglHandler.gl, config = eglHandler.config)
    renderer.onSurfaceChanged(gl = eglHandler.gl, width = width, height = height)
    renderer.onDrawFrame(gl = eglHandler.gl)
  }

  override fun onSurfaceTextureSizeChanged(
    surface: SurfaceTexture,
    width: Int,
    height: Int
  ) = openGLContext.execute {
    val eglHandler = currentEGLHandler
      ?: throw IllegalStateException("Surface isn't created")
    renderer.onSurfaceChanged(gl = eglHandler.gl, width = width, height = height)
  }

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    return false
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
    // Do nothing
  }

  fun onDetach() = openGLContext.execute {
    val eglHandler = currentEGLHandler ?: return@execute
    renderer.onSurfaceDestroyed()
    eglHandler.destroy()
    currentEGLHandler = null
  }

  private fun drawFrame() = openGLContext.execute {
    val eglHandler = currentEGLHandler ?: return@execute
    renderer.onDrawFrame(gl = eglHandler.gl)
    eglHandler.displaySurface()
  }
}
