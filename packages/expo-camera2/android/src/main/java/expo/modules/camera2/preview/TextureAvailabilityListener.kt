package expo.modules.camera2.preview

import android.graphics.SurfaceTexture
import android.view.TextureView

/**
 * [TextureView.SurfaceTextureListener] called when a [SurfaceTexture] becomes available.
 */
internal class TextureAvailabilityListener(
  private val onSurfaceTextureAvailable: () -> Unit,
  private val onSurfaceTextureSizeChanged: () -> Unit
) : TextureView.SurfaceTextureListener {
  override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
    onSurfaceTextureAvailable()
  }

  override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {
    onSurfaceTextureSizeChanged()
  }

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    // Do nothing
    return true
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
    // Do nothing
  }
}