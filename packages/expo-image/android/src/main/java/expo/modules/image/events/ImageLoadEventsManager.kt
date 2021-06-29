package expo.modules.image.events

import android.graphics.BitmapFactory
import android.graphics.drawable.Drawable
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.target.Target
import com.bumptech.glide.request.transition.Transition
import com.facebook.react.modules.network.ProgressListener
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class ImageLoadEventsManager(private val mViewId: Int, private val mEventEmitter: RCTEventEmitter?) : CustomTarget<BitmapFactory.Options?>(), RequestListener<Drawable?>, ProgressListener {
  private var mBitmapFactoryOptions: BitmapFactory.Options? = null
  private var mDataSource: DataSource? = null
  private var mModel: Any? = null
  fun onLoadStarted() {
    dispatch(ImageLoadStartEvent(mViewId))
  }

  override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) {
    dispatch(ImageProgressEvent(mViewId, bytesWritten, contentLength, done))
  }

  override fun onLoadFailed(e: GlideException?, model: Any, target: Target<Drawable?>, isFirstResource: Boolean): Boolean {
    dispatch(ImageErrorEvent(mViewId, e))
    return false
  }

  override fun onResourceReady(resource: BitmapFactory.Options, transition: Transition<in BitmapFactory.Options?>?) {
    mBitmapFactoryOptions = resource
    onResourceReady()
  }

  override fun onResourceReady(resource: Drawable?, model: Any, target: Target<Drawable?>, dataSource: DataSource, isFirstResource: Boolean): Boolean {
    mModel = model
    mDataSource = dataSource
    onResourceReady()
    return false
  }

  private fun onResourceReady() {
    if (mModel != null && mDataSource != null && mBitmapFactoryOptions != null) {
      dispatch(ImageLoadEvent(mViewId, mModel!!, mDataSource!!, mBitmapFactoryOptions!!))
    }
  }

  override fun onLoadCleared(placeholder: Drawable?) = Unit // do nothing

  private fun dispatch(event: Event<*>) {
    if (mEventEmitter != null) {
      event.dispatch(mEventEmitter)
    }
  }
}
