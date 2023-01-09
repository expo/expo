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
  private var mOnSurfaceCreateCalled = false
  private var mOnSurfaceTextureCreatedWithZeroSize = false
  private var gLContext = GLContext(
    appContext
      .legacyModuleRegistry
      .getExportedModuleOfClass(GLObjectManagerModule::class.java) as GLObjectManagerModule
  )

  private val eXGLCtxId: Int
    get() = gLContext.contextId

  val onSurfaceCreate by EventDispatcher<OnSurfaceCreateRecord>()

  init {
    surfaceTextureListener = this
    isOpaque = false
  }

  // Public interface to allow running events on GL thread
  fun runOnGLThread(r: Runnable?) {
    gLContext.runAsync(r)
  }

  // `TextureView.SurfaceTextureListener` events
  @Synchronized
  override fun onSurfaceTextureAvailable(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
    if (!mOnSurfaceCreateCalled) {
      // onSurfaceTextureAvailable is sometimes called with 0 size texture
      // and immediately followed by onSurfaceTextureSizeChanged with actual size
      if (width == 0 || height == 0) {
        mOnSurfaceTextureCreatedWithZeroSize = true
      }
      if (!mOnSurfaceTextureCreatedWithZeroSize) {
        initializeSurfaceInGLContext(surfaceTexture)
      }
      mOnSurfaceCreateCalled = true
    }
  }

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    gLContext.destroy()

    // reset flag, so the context will be recreated when the new surface is available
    mOnSurfaceCreateCalled = false
    return true
  }

  @Synchronized
  override fun onSurfaceTextureSizeChanged(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
    if (mOnSurfaceTextureCreatedWithZeroSize && (width != 0 || height != 0)) {
      initializeSurfaceInGLContext(surfaceTexture)
      mOnSurfaceTextureCreatedWithZeroSize = false
    }
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) = Unit

  fun flush() {
    gLContext.flush()
  }

  private fun initializeSurfaceInGLContext(surfaceTexture: SurfaceTexture) {
    gLContext.initialize(surfaceTexture) {
      onSurfaceCreate(OnSurfaceCreateRecord(eXGLCtxId))
    }
  }
}