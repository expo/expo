package expo.modules.image

import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import com.bumptech.glide.RequestManager
import com.bumptech.glide.request.ThumbnailRequestCoordinator
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import expo.modules.image.enums.ContentFit
import java.lang.ref.WeakReference

/**
 * A custom target to provide a smooth transition between multiple drawables.
 * It contains two separate targets that are operating on a single view.
 * Only one of them is active, and the other one is doing the background operation.
 * When the background one finishes, we can swap them and clean the previously active.
 * In that way, we only clean the image view when we have another image to show.
 */
class ViewConnectedTarget(
  private val requestManager: RequestManager,
  private val imageViewHolder: WeakReference<ExpoImageView>,
  var bgTarget: ViewConnectedTarget? = null
) : CustomTarget<Drawable>(SIZE_ORIGINAL, SIZE_ORIGINAL) {
  /**
   * An enum representing the state of the target.
   */
  private enum class State {
    /**
     * Target is free to use.
     */
    FREE,

    /**
     * Target is currently running but can be stopped if needed.
     */
    RUNNING,

    /**
     * Target is active - the image loaded by it is currently displayed.
     */
    ACTIVE
  }

  private var state = State.FREE

  var placeholderContentFit: ContentFit = ContentFit.ScaleDown

  /**
   * Gets the currently unused target.
   * We get the current target if it's free or running. Otherwise we get the background one.
   * When the current target is running it can mean two things:
   * - the background target is currently active, so we can stop the main one and reuse it
   * - the background target is free and the main target is responsible for the first render, but the
   * src was changed, so we can stop the current task and start another one.
   */
  fun getUnusedTarget(): ViewConnectedTarget? {
    if (state == State.FREE || state == State.RUNNING) {
      return this
    }

    return bgTarget
  }

  override fun onLoadStarted(placeholder: Drawable?) {
    val imageView = imageView
    // The image view was deallocated - something went wrong.
    // We are trying to clear the memory by removing targets from Glide's registry.
    if (imageView == null) {
      clearBothTargets()
      return
    }

    // We know it's the first render of the image.
    // In that case, we should display the placeholder.
    if (bgTarget?.state == State.FREE) {
      imageView.setImageDrawable(placeholder)
      if (placeholder != null) {
        imageView.applyTransformationMatrix(placeholder, placeholderContentFit)
      }
    }

    // The background target shouldn't be running, because it means that we have
    // two target running at the same time. That situation isn't allowed and if we end up here
    // we are trying our best to restore the correct state.
    if (bgTarget?.state == State.RUNNING) {
      clearBgTarget()
    }

    state = State.RUNNING
  }

  override fun onLoadFailed(errorDrawable: Drawable?) {
    // When the load failed we clear the image only if
    // background task isn't active. When it wis we know
    // that the previous image is displayed.
    if (bgTarget?.state != State.ACTIVE) {
      imageView?.setImageDrawable(errorDrawable)

      state = State.FREE
    }
  }

  override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>?) {
    val imageView = imageView
    // Image was deallocated - something went wrong.
    // We are trying to clear the memory by removing targets from Glide's registry.
    if (imageView == null) {
      clearBothTargets()
      return
    }

    var isPlaceholder = false
    val request = request
    if (request is ThumbnailRequestCoordinator) {
      val fullRequest = request.getPrivateFullRequest()
      // The thumbnail and full request are handled in the same way by Glide.
      // Here we're checking if the provided resource is the final bitmap or it is a thumbnail.
      if (fullRequest?.isComplete != true) {
        // We know that we received a thumbnail.
        // But if something is already displayed, we don't want to show the placeholder.
        if (imageView.drawable != null) {
          return
        }

        isPlaceholder = true
      }
    }

    state = State.ACTIVE
    // The main and background target is active so we can swap the image content.
    if (bgTarget?.state == State.ACTIVE) {
      clearBgTarget()
    }

    imageView.setImageDrawable(resource)
    if (isPlaceholder) {
      imageView.applyTransformationMatrix(resource, placeholderContentFit)
    } else {
      imageView.applyTransformationMatrix()
    }

    if (resource is Animatable) {
      resource.start()
    }
  }

  override fun onLoadCleared(placeholder: Drawable?) {
    if (state == State.ACTIVE) {
      imageView?.setImageDrawable(placeholder)
    }
  }

  fun clearBothTargets() {
    clearSelf()
    clearBgTarget()
  }

  private fun clearSelf() {
    state = State.FREE
    requestManager.clear(this)
  }

  private fun clearBgTarget() {
    bgTarget?.state = State.FREE
    requestManager.clear(bgTarget)
  }

  private val imageView: ExpoImageView?
    get() = imageViewHolder.get()
}
