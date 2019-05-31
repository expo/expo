package expo.modules.camera2.preview

import android.content.Context
import android.graphics.SurfaceTexture
import android.support.annotation.WorkerThread
import android.util.Size
import android.view.Surface
import android.view.TextureView

import expo.modules.camera2.exception.UnavailableSurfaceException

import java.util.concurrent.CountDownLatch

import expo.modules.camera2.hardware.orientation.Orientation
import expo.modules.camera2.utils.swapDimensions

class Preview(context: Context?) : TextureView(context) {

  /**
   * CountDownLatch that waits until surfaceTexture is available what is signaled after view is mounted
   */
  private val surfaceTextureLatch = CountDownLatch(1)

  init {
    surfaceTextureListener = TextureAvailabilityListener({ surfaceTextureLatch.countDown() }, {})
  }

  private var surface: Surface? = null
  internal val surfaceSize: Size
    get() = Size(width, height)

  internal var previewSize: Size? = null
  private var availablePreviewSizes: Array<Size>? = null


  /**
   * Get [Surface] that wraps [SurfaceTexture] or wait for it and return when [SurfaceTexture] become available
   */
  @WorkerThread
  fun getSurface(): Surface = surface
    ?: safeGetSurfaceTexture().let(::Surface).also { surface = it }

  @WorkerThread
  private fun safeGetSurfaceTexture(): SurfaceTexture = surfaceTexture
    ?: getSurfaceTextureAfterLatch()

  @WorkerThread
  private fun getSurfaceTextureAfterLatch(): SurfaceTexture {
    surfaceTextureLatch.await()
    return surfaceTexture ?: throw UnavailableSurfaceException()
  }

  fun setOrientation(orientation: Orientation) {
    previewSize = when (orientation) {
      is Orientation.Horizontal -> availablePreviewSizes?.get(0)?.swapDimensions()
      else -> availablePreviewSizes?.get(0)
    }
  }

  fun setAvailablePreviewSizes(availablePreviewSizes: Array<Size>) {
    this.availablePreviewSizes = availablePreviewSizes
  }
}