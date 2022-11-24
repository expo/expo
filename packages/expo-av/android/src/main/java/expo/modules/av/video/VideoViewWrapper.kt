package expo.modules.av.video

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.widget.FrameLayout
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher

/**
 * We need the wrapper to be able to remove the view from the React-managed tree
 * into the FullscreenVideoPlayer and not have to fight with the React styles
 * overriding our native layout.
 */
@SuppressLint("ViewConstructor")
@DoNotStrip
class VideoViewWrapper @DoNotStrip constructor(context: Context, appContext: AppContext) : FrameLayout(context) {
  val videoViewInstance: VideoView
  private val mLayoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  override fun requestLayout() {
    super.requestLayout()

    // Code borrowed from:
    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166

    // It fixes two bugs:
    // - ExpoMediaController's height = 0 when initialized (until relayout)
    // - blank VideoView (until relayout) after dismissing FullscreenVideoPlayer
    post(mLayoutRunnable)
  }

  init {
    videoViewInstance = VideoView(context, this, appContext)
    addView(videoViewInstance, generateDefaultLayoutParams())
  }

  //region view callbacks

  val onStatusUpdate by EventDispatcher<Bundle>()
  val onLoadStart by EventDispatcher<Unit>()
  val onLoad by EventDispatcher<Bundle>()
  val onError by EventDispatcher<Bundle>()
  val onReadyForDisplay by EventDispatcher<Bundle>()
  val onFullscreenUpdate by EventDispatcher<Bundle>()

  //endregion
}
