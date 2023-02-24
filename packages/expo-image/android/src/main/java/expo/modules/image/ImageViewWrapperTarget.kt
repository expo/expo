package expo.modules.image

import android.graphics.drawable.Drawable
import android.util.Log
import com.bumptech.glide.RequestManager
import com.bumptech.glide.request.ThumbnailRequestCoordinator
import com.bumptech.glide.request.transition.Transition
import expo.modules.core.utilities.ifNull
import expo.modules.image.enums.ContentFit
import java.lang.ref.WeakReference

/**
 * A custom target to provide a smooth transition between multiple drawables.
 * It delegates images to the [ExpoImageViewWrapper], where we handle the loaded [Drawable].
 * When the target is cleared, we don't do anything. The [ExpoImageViewWrapper] is responsible for
 * clearing bitmaps before freeing targets. That may be error-prone, but that is the only way
 * of implementing the transition between bitmaps.
 */
class ImageViewWrapperTarget(
  private val imageViewHolder: WeakReference<ExpoImageViewWrapper>,
) : com.bumptech.glide.request.target.CustomTarget<Drawable>(SIZE_ORIGINAL, SIZE_ORIGINAL) {
  var hasSource = false
  var isUsed = false
  var placeholderContentFit: ContentFit? = null

  override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>?) {
    // The image view should always be valid. When the view is deallocated, all targets should be
    // canceled. Therefore that code shouldn't be called in that case. Instead of crashing, we
    // decided to ignore that.
    val imageView = imageViewHolder.get().ifNull {
      Log.w("ExpoImage", "The `ExpoImageViewWrapper` was deallocated, but the target wasn't canceled in time.")
      return
    }

    // The thumbnail and full request are handled in the same way by Glide.
    // Here we're checking if the provided resource is the final bitmap or a thumbnail.
    val isPlaceholder = if (request is ThumbnailRequestCoordinator) {
      (request as? ThumbnailRequestCoordinator)
        ?.getPrivateFullRequest()
        ?.isComplete != true
    } else {
      false
    }

    imageView.onResourceReady(this, resource, isPlaceholder)
  }

  override fun onLoadCleared(placeholder: Drawable?) = Unit

  fun clear(requestManager: RequestManager) {
    requestManager.clear(this)
  }
}
