package expo.modules.video

import android.content.Context
import android.view.ViewGroup
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val playerView = PlayerView(context.applicationContext)
  var videoPlayer: VideoPlayer? = null
    set(videoPlayer) {
      playerView.player = videoPlayer?.player
      field = videoPlayer
    }

  private val mLayoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  init {
    addView(
      playerView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )
  }

  override fun requestLayout() {
    super.requestLayout()

    // Code borrowed from:
    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166
    // This fixes some layout issues with the exoplayer which caused the resizeMode to not work properly
    post(mLayoutRunnable)
  }
}
