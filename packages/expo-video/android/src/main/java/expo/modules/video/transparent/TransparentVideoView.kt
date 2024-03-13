package expo.modules.video.transparent

import android.content.Context
import android.graphics.SurfaceTexture
import android.view.Surface
import android.view.TextureView
import android.view.ViewGroup
import android.widget.RelativeLayout
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.views.ExpoView
import expo.modules.video.VideoPlayer
import expo.modules.video.transparent.glTexture.GLTextureViewListener
import expo.modules.video.transparent.renderer.TransparentVideoRenderer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(UnstableApi::class)
class TransparentVideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val id: String = UUID.randomUUID().toString()
  private val currentActivity = appContext.currentActivity
    ?: throw Exceptions.MissingActivity()

  var videoPlayer: VideoPlayer? = null
    set(videoPlayer) {
      field?.let {
        TransparentVideoManager.onVideoPlayerDetachedFromView(it, this)
      }
      field = videoPlayer
      videoPlayer?.let {
        TransparentVideoManager.onVideoPlayerAttachedToView(it, this)
      }
    }
  private lateinit var mediaPlayerSurface: Surface
  private val coroutineScope = CoroutineScope(Dispatchers.Main)
  private val onFrameAvailable = MutableSharedFlow<Unit>(extraBufferCapacity = Channel.UNLIMITED)
  private val renderer = TransparentVideoRenderer(onSurfaceTextureCreated = { surface -> onSurfaceTextureCreated(surface) })
  private val textureView = TextureView(context).also {
    onSurfaceTextureCreated(it.surfaceTexture ?: return@also)
  }.apply {
    surfaceTextureListener = GLTextureViewListener(coroutineScope, renderer, onFrameAvailable)
    isOpaque = false
    layoutParams = RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
  }

  init {
    TransparentVideoManager.registerVideoView(this)
    addView(textureView)
  }

  private fun onSurfaceTextureCreated(surfaceTexture: SurfaceTexture) {
    surfaceTexture.setOnFrameAvailableListener { onFrameAvailable.tryEmit(Unit) }
    val surface = Surface(surfaceTexture).also { mediaPlayerSurface = it }
    coroutineScope.launch {
      videoPlayer?.player?.setVideoSurface(surface)
    }
  }

  companion object {
    fun isPictureInPictureSupported(): Boolean {
      return false
    }
  }
}
