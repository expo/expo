package expo.modules.gl

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.SurfaceTexture
import android.view.TextureView
import android.view.TextureView.SurfaceTextureListener
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher

data class OnSurfaceCreateRecord(
  @Field val exglCtxId: Int
) : Record

@SuppressLint("ViewConstructor")
class GLView(context: Context, appContext: AppContext) : TextureView(context), SurfaceTextureListener {
  private var onSurfaceCreateWasCalled = false
  private var onSurfaceTextureWasCalledWithZeroSize = false
  private var glContext = GLContext(
    appContext
      .registry
      .getModule<GLObjectManagerModule>()
  )

  private val exglContextId: Int
    get() = glContext.contextId

  var enableExperimentalWorkletSupport: Boolean = false
  val onSurfaceCreate by EventDispatcher<OnSurfaceCreateRecord>()

  init {
    surfaceTextureListener = this
    isOpaque = false
  }

  // Public interface to allow running events on GL thread
  fun runOnGLThread(r: Runnable?) {
    glContext.runAsync(r)
  }

  // `TextureView.SurfaceTextureListener` events
  @Synchronized
  override fun onSurfaceTextureAvailable(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
    if (!onSurfaceCreateWasCalled) {
      // onSurfaceTextureAvailable is sometimes called with 0 size texture
      // and immediately followed by onSurfaceTextureSizeChanged with actual size
      if (width == 0 || height == 0) {
        onSurfaceTextureWasCalledWithZeroSize = true
      }
      if (!onSurfaceTextureWasCalledWithZeroSize) {
        initializeSurfaceInGLContext(surfaceTexture)
      }
      onSurfaceCreateWasCalled = true
    }
  }

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    glContext.destroy()

    // reset flag, so the context will be recreated when the new surface is available
    onSurfaceCreateWasCalled = false
    return true
  }

  @Synchronized
  override fun onSurfaceTextureSizeChanged(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
    if (onSurfaceTextureWasCalledWithZeroSize && (width != 0 || height != 0)) {
      initializeSurfaceInGLContext(surfaceTexture)
      onSurfaceTextureWasCalledWithZeroSize = false
    }
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) = Unit

  fun flush() {
    glContext.flush()
  }

  private fun initializeSurfaceInGLContext(surfaceTexture: SurfaceTexture) {
    glContext.initialize(surfaceTexture, enableExperimentalWorkletSupport) {
      onSurfaceCreate(OnSurfaceCreateRecord(exglContextId))
    }
  }
}
