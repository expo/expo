package expo.modules.image

import android.content.Context
import android.graphics.Point
import android.graphics.drawable.Drawable
import android.util.Log
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.WindowManager
import androidx.annotation.VisibleForTesting
import com.bumptech.glide.RequestManager
import com.bumptech.glide.request.Request
import com.bumptech.glide.request.ThumbnailRequestCoordinator
import com.bumptech.glide.request.target.SizeReadyCallback
import com.bumptech.glide.request.target.Target
import com.bumptech.glide.request.transition.Transition
import com.bumptech.glide.util.Preconditions
import com.bumptech.glide.util.Synthetic
import expo.modules.core.utilities.ifNull
import expo.modules.image.enums.ContentFit
import expo.modules.kotlin.tracing.endAsyncTraceBlock
import java.lang.ref.WeakReference
import kotlin.math.max

/**
 * A custom target to provide a smooth transition between multiple drawables.
 * It delegates images to the [ExpoImageViewWrapper], where we handle the loaded [Drawable].
 * When the target is cleared, we don't do anything. The [ExpoImageViewWrapper] is responsible for
 * clearing bitmaps before freeing targets. That may be error-prone, but that is the only way
 * of implementing the transition between bitmaps.
 */
class ImageViewWrapperTarget(
  private val imageViewHolder: WeakReference<ExpoImageViewWrapper>
) : Target<Drawable> {
  /**
   * Whether the target has a main, non-placeholder source
   */
  var hasSource = false

  /**
   * Whether the target is used - the asset loaded by it has been drawn in the image view
   */
  var isUsed = false

  /**
   * The main source height where -1 means unknown
   */
  var sourceHeight = -1

  /**
   * The main source width where -1 means unknown
   */
  var sourceWidth = -1

  /**
   * The placeholder height where -1 means unknown
   */
  var placeholderHeight = -1

  /**
   * The placeholder width where -1 means unknown
   */
  var placeholderWidth = -1

  private var cookie = -1

  fun setCookie(newValue: Int) {
    endLoadingNewImageTraceBlock()
    synchronized(this) {
      cookie = newValue
    }
  }

  /**
   * The content fit of the placeholder
   */
  var placeholderContentFit: ContentFit? = null

  private var request: Request? = null
  private var sizeDeterminer = SizeDeterminer(imageViewHolder)

  private fun endLoadingNewImageTraceBlock() = synchronized(this) {
    if (cookie < 0) {
      return@synchronized
    }

    endAsyncTraceBlock(Trace.tag, Trace.loadNewImageBlock, cookie)
    cookie = -1
  }

  override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>?) {
    // The image view should always be valid. When the view is deallocated, all targets should be
    // canceled. Therefore that code shouldn't be called in that case. Instead of crashing, we
    // decided to ignore that.
    val imageView = imageViewHolder.get().ifNull {
      endLoadingNewImageTraceBlock()
      Log.w("ExpoImage", "The `ExpoImageViewWrapper` was deallocated, but the target wasn't canceled in time.")
      return
    }

    // The thumbnail and full request are handled in the same way by Glide.
    // Here we're checking if the provided resource is the final bitmap or a thumbnail.
    val isPlaceholder = if (request is ThumbnailRequestCoordinator) {
      (request as? ThumbnailRequestCoordinator)
        ?.getPrivateFullRequest()
        ?.isComplete == false
    } else {
      false
    }

    if (!isPlaceholder) {
      endLoadingNewImageTraceBlock()
    }

    imageView.onResourceReady(this, resource, isPlaceholder)
  }

  override fun onStart() = Unit

  override fun onStop() = Unit

  override fun onDestroy() = Unit

  override fun onLoadStarted(placeholder: Drawable?) = Unit

  // When loading fails, it's handled by the global listener, therefore that method can be NOOP.
  override fun onLoadFailed(errorDrawable: Drawable?) {
    endLoadingNewImageTraceBlock()
  }

  override fun onLoadCleared(placeholder: Drawable?) = Unit

  override fun getSize(cb: SizeReadyCallback) {
    // If we can't resolve the image, we just return unknown size.
    // It shouldn't happen in a production application, because it means that our view was deallocated.
    if (imageViewHolder.get() == null) {
      cb.onSizeReady(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL)
      return
    }

    sizeDeterminer.getSize(cb)
  }

  override fun removeCallback(cb: SizeReadyCallback) {
    sizeDeterminer.removeCallback(cb)
  }

  override fun setRequest(request: Request?) {
    this.request = request
  }

  override fun getRequest() = request

  fun clear(requestManager: RequestManager) {
    sizeDeterminer.clearCallbacksAndListener()
    requestManager.clear(this)
  }
}

// Copied from the Glide codebase.
// We modified that to receive a weak ref to our view instead of strong one.
internal class SizeDeterminer(private val imageViewHolder: WeakReference<ExpoImageViewWrapper>) {
  private val cbs: MutableList<SizeReadyCallback> = ArrayList()

  @Synthetic
  var waitForLayout = false
  private var layoutListener: SizeDeterminerLayoutListener? = null
  private fun notifyCbs(width: Int, height: Int) {
    // One or more callbacks may trigger the removal of one or more additional callbacks, so we
    // need a copy of the list to avoid a concurrent modification exception. One place this
    // happens is when a full request completes from the in memory cache while its thumbnail is
    // still being loaded asynchronously. See #2237.
    for (cb in ArrayList(cbs)) {
      cb.onSizeReady(width, height)
    }
  }

  @Synthetic
  fun checkCurrentDimens() {
    if (cbs.isEmpty()) {
      return
    }
    val currentWidth = targetWidth
    val currentHeight = targetHeight
    if (!isViewStateAndSizeValid(currentWidth, currentHeight)) {
      return
    }
    notifyCbs(currentWidth, currentHeight)
    clearCallbacksAndListener()
  }

  fun getSize(cb: SizeReadyCallback) {
    val view = imageViewHolder.get() ?: return

    val currentWidth = targetWidth
    val currentHeight = targetHeight
    if (isViewStateAndSizeValid(currentWidth, currentHeight)) {
      cb.onSizeReady(currentWidth, currentHeight)
      return
    }

    // We want to notify callbacks in the order they were added and we only expect one or two
    // callbacks to be added a time, so a List is a reasonable choice.
    if (!cbs.contains(cb)) {
      cbs.add(cb)
    }
    if (layoutListener == null) {
      val observer = view.viewTreeObserver
      layoutListener = SizeDeterminerLayoutListener(this)
      observer.addOnPreDrawListener(layoutListener)
    }
  }

  /**
   * The callback may be called anyway if it is removed by another [SizeReadyCallback] or
   * otherwise removed while we're notifying the list of callbacks.
   *
   *
   * See #2237.
   */
  fun removeCallback(cb: SizeReadyCallback) {
    cbs.remove(cb)
  }

  fun clearCallbacksAndListener() {
    // Keep a reference to the layout attachStateListener and remove it here
    // rather than having the observer remove itself because the observer
    // we add the attachStateListener to will be almost immediately merged into
    // another observer and will therefore never be alive. If we instead
    // keep a reference to the attachStateListener and remove it here, we get the
    // current view tree observer and should succeed.
    val observer = imageViewHolder.get()?.viewTreeObserver
    if (observer?.isAlive == true) {
      observer.removeOnPreDrawListener(layoutListener)
    }
    layoutListener = null
    cbs.clear()
  }

  private fun isViewStateAndSizeValid(width: Int, height: Int): Boolean {
    return isDimensionValid(width) && isDimensionValid(height)
  }

  private val targetHeight: Int
    get() {
      val view = imageViewHolder.get() ?: return Target.SIZE_ORIGINAL
      val verticalPadding = view.paddingTop + view.paddingBottom
      val layoutParams = view.layoutParams
      val layoutParamSize = layoutParams?.height ?: PENDING_SIZE
      return getTargetDimen(view.height, layoutParamSize, verticalPadding)
    }
  private val targetWidth: Int
    get() {
      val view = imageViewHolder.get() ?: return Target.SIZE_ORIGINAL
      val horizontalPadding = view.paddingLeft + view.paddingRight
      val layoutParams = view.layoutParams
      val layoutParamSize = layoutParams?.width ?: PENDING_SIZE
      return getTargetDimen(view.width, layoutParamSize, horizontalPadding)
    }

  private fun getTargetDimen(viewSize: Int, paramSize: Int, paddingSize: Int): Int {
    val view = imageViewHolder.get() ?: return Target.SIZE_ORIGINAL

    // We consider the View state as valid if the View has non-null layout params and a non-zero
    // layout params width and height. This is imperfect. We're making an assumption that View
    // parents will obey their child's layout parameters, which isn't always the case.
    val adjustedParamSize = paramSize - paddingSize
    if (adjustedParamSize > 0) {
      return adjustedParamSize
    }

    // Since we always prefer layout parameters with fixed sizes, even if waitForLayout is true,
    // we might as well ignore it and just return the layout parameters above if we have them.
    // Otherwise we should wait for a layout pass before checking the View's dimensions.
    if (waitForLayout && view.isLayoutRequested) {
      return PENDING_SIZE
    }

    // We also consider the View state valid if the View has a non-zero width and height. This
    // means that the View has gone through at least one layout pass. It does not mean the Views
    // width and height are from the current layout pass. For example, if a View is re-used in
    // RecyclerView or ListView, this width/height may be from an old position. In some cases
    // the dimensions of the View at the old position may be different than the dimensions of the
    // View in the new position because the LayoutManager/ViewParent can arbitrarily decide to
    // change them. Nevertheless, in most cases this should be a reasonable choice.
    val adjustedViewSize = viewSize - paddingSize
    if (adjustedViewSize > 0) {
      return adjustedViewSize
    }

    // Finally we consider the view valid if the layout parameter size is set to wrap_content.
    // It's difficult for Glide to figure out what to do here. Although Target.SIZE_ORIGINAL is a
    // coherent choice, it's extremely dangerous because original images may be much too large to
    // fit in memory or so large that only a couple can fit in memory, causing OOMs. If users want
    // the original image, they can always use .override(Target.SIZE_ORIGINAL). Since wrap_content
    // may never resolve to a real size unless we load something, we aim for a square whose length
    // is the largest screen size. That way we're loading something and that something has some
    // hope of being downsampled to a size that the device can support. We also log a warning that
    // tries to explain what Glide is doing and why some alternatives are preferable.
    // Since WRAP_CONTENT is sometimes used as a default layout parameter, we always wait for
    // layout to complete before using this fallback parameter (ConstraintLayout among others).
    if (!view.isLayoutRequested && paramSize == ViewGroup.LayoutParams.WRAP_CONTENT) {
      return getMaxDisplayLength(view.context)
    }

    // If the layout parameters are < padding, the view size is < padding, or the layout
    // parameters are set to match_parent or wrap_content and no layout has occurred, we should
    // wait for layout and repeat.
    return PENDING_SIZE
  }

  private fun isDimensionValid(size: Int): Boolean {
    return size > 0 || size == Target.SIZE_ORIGINAL
  }

  private class SizeDeterminerLayoutListener(sizeDeterminer: SizeDeterminer) : ViewTreeObserver.OnPreDrawListener {
    private val sizeDeterminerRef: WeakReference<SizeDeterminer>

    init {
      sizeDeterminerRef = WeakReference(sizeDeterminer)
    }

    override fun onPreDraw(): Boolean {
      val sizeDeterminer = sizeDeterminerRef.get()
      sizeDeterminer?.checkCurrentDimens()
      return true
    }
  }

  companion object {
    // Some negative sizes (Target.SIZE_ORIGINAL) are valid, 0 is never valid.
    private const val PENDING_SIZE = 0

    @VisibleForTesting
    var maxDisplayLength: Int? = null

    // Use the maximum to avoid depending on the device's current orientation.
    @Suppress("DEPRECATION") // We have copied this code from Glide and are waiting for them to remove the deprecated APIs.
    private fun getMaxDisplayLength(context: Context): Int {
      if (maxDisplayLength == null) {
        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val display = Preconditions.checkNotNull(windowManager).defaultDisplay
        val displayDimensions = Point()
        display.getSize(displayDimensions)
        maxDisplayLength = max(displayDimensions.x, displayDimensions.y)
      }
      return maxDisplayLength!!
    }
  }
}
