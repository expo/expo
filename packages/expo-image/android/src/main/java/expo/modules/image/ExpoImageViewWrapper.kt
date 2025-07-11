package expo.modules.image

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Handler
import android.view.View
import android.widget.FrameLayout
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.isVisible
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.resource.bitmap.DownsampleStrategy
import com.bumptech.glide.request.RequestOptions
import com.github.penfeizhou.animation.gif.GifDrawable
import expo.modules.image.enums.ContentFit
import expo.modules.image.enums.Priority
import expo.modules.image.events.GlideRequestListener
import expo.modules.image.events.OkHttpProgressListener
import expo.modules.image.okhttp.GlideUrlWrapper
import expo.modules.image.records.CachePolicy
import expo.modules.image.records.ContentPosition
import expo.modules.image.records.DecodeFormat
import expo.modules.image.records.ImageErrorEvent
import expo.modules.image.records.ImageLoadEvent
import expo.modules.image.records.ImageProgressEvent
import expo.modules.image.records.ImageTransition
import expo.modules.image.records.Source
import expo.modules.image.svg.SVGPictureDrawable
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.tracing.beginAsyncTraceBlock
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import jp.wasabeef.glide.transformations.BlurTransformation
import java.lang.ref.WeakReference
import kotlin.math.abs
import kotlin.math.min

@SuppressLint("ViewConstructor")
class ExpoImageViewWrapper(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val activity: Activity
    get() = appContext.throwingActivity

  internal val requestManager = getOrCreateRequestManager(appContext, activity)
  private val progressListener = OkHttpProgressListener(WeakReference(this))

  private val firstView = ExpoImageView(activity)
  private val secondView = ExpoImageView(activity)

  private val mainHandler = Handler(context.mainLooper)

  /**
   * @returns the view which is currently active or will be used when both views are empty
   */
  private val activeView: ExpoImageView
    get() {
      if (secondView.drawable != null) {
        return secondView
      }
      return firstView
    }

  private var firstTarget = ImageViewWrapperTarget(WeakReference(this))
  private var secondTarget = ImageViewWrapperTarget(WeakReference(this))

  internal val onLoadStart by EventDispatcher<Unit>()
  internal val onProgress by EventDispatcher<ImageProgressEvent>()
  internal val onError by EventDispatcher<ImageErrorEvent>()
  internal val onLoad by EventDispatcher<ImageLoadEvent>()
  internal val onDisplay by EventDispatcher<Unit>()

  internal var sources: List<Source> = emptyList()
  private val bestSource: Source?
    get() = getBestSource(sources)

  internal var placeholders: List<Source> = emptyList()
  private val bestPlaceholder: Source?
    get() = getBestSource(placeholders)

  internal var blurRadius: Int? = null
    set(value) {
      if (field != value) {
        shouldRerender = true
      }
      field = value
    }

  internal var transition: ImageTransition? = null

  internal var contentFit: ContentFit = ContentFit.Cover
    set(value) {
      field = value
      activeView.contentFit = value
      transformationMatrixChanged = true
    }

  internal var placeholderContentFit: ContentFit = ContentFit.ScaleDown
    set(value) {
      field = value
      activeView.placeholderContentFit = value
      transformationMatrixChanged = true
    }

  internal var contentPosition: ContentPosition = ContentPosition.center
    set(value) {
      field = value
      activeView.contentPosition = value
      transformationMatrixChanged = true
    }

  internal var tintColor: Int? = null
    set(value) {
      field = value
      // To apply the tint color to the SVG, we need to recreate the drawable.
      if (activeView.drawable is SVGPictureDrawable) {
        shouldRerender = true
      } else {
        activeView.setTintColor(value)
      }
    }

  internal var isFocusableProp: Boolean = false
    set(value) {
      field = value
      activeView.isFocusable = value
    }

  internal var accessible: Boolean = false
    set(value) {
      field = value
      setIsScreenReaderFocusable(activeView, value)
    }

  internal var accessibilityLabel: String? = null
    set(value) {
      field = value
      activeView.contentDescription = accessibilityLabel
    }

  var recyclingKey: String? = null
    set(value) {
      clearViewBeforeChangingSource = field != null && value != null && value != field
      field = value
    }

  internal var allowDownscaling: Boolean = true
    set(value) {
      field = value
      shouldRerender = true
    }

  internal var decodeFormat: DecodeFormat = DecodeFormat.ARGB_8888
    set(value) {
      field = value
      shouldRerender = true
    }

  internal var autoplay: Boolean = true

  internal var lockResource: Boolean = false

  internal var priority: Priority = Priority.NORMAL
  internal var cachePolicy: CachePolicy = CachePolicy.DISK

  fun setIsAnimating(setAnimating: Boolean) {
    // Animatable animations always start from the beginning when resumed.
    // So we check first if the resource is a GifDrawable, because it can continue
    // from where it was paused.
    when (val resource = activeView.drawable) {
      is GifDrawable -> setIsAnimating(resource, setAnimating)
      is Animatable -> setIsAnimating(resource, setAnimating)
    }
  }

  private fun setIsAnimating(resource: GifDrawable, setAnimating: Boolean) {
    if (setAnimating) {
      if (resource.isPaused) {
        resource.resume()
      } else {
        resource.start()
      }
    } else {
      resource.pause()
    }
  }

  private fun setIsAnimating(resource: Animatable, setAnimating: Boolean) {
    if (setAnimating) {
      resource.start()
    } else {
      resource.stop()
    }
  }

  /**
   * Whether the image should be loaded again
   */
  internal var shouldRerender = false

  /**
   * Currently loaded source
   */
  private var loadedSource: GlideModelProvider? = null

  /**
   * Whether the transformation matrix should be reapplied
   */
  private var transformationMatrixChanged = false

  /**
   * Whether the view content should be cleared to blank when the source was changed.
   */
  private var clearViewBeforeChangingSource = false

  /**
   * Copies saved props to the provided view.
   * It ensures that the view state is up to date.
   */
  private fun copyProps(view: ExpoImageView) {
    view.contentFit = contentFit
    view.contentPosition = contentPosition
    view.setTintColor(tintColor)
    view.isFocusable = isFocusableProp
    view.contentDescription = accessibilityLabel
    setIsScreenReaderFocusable(view, accessible)
  }

  /**
   * Allows `isScreenReaderFocusable` to be set on apis below level 28
   */
  private fun setIsScreenReaderFocusable(view: View, value: Boolean) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      view.isScreenReaderFocusable = value
    } else {
      ViewCompat.setAccessibilityDelegate(
        this,
        object : AccessibilityDelegateCompat() {
          override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
            info.isScreenReaderFocusable = value
            super.onInitializeAccessibilityNodeInfo(host, info)
          }
        }
      )
    }
  }

  /**
   * When a new resource is available, this method tries to handle it.
   * It decides where provided bitmap should be displayed and clears the previous target/image.
   */
  fun onResourceReady(
    target: ImageViewWrapperTarget,
    resource: Drawable,
    isPlaceholder: Boolean = false
  ) =
    // The "onResourceReady" function will be triggered when the new resource is available by the Glide.
    // According to the Glide documentation (https://bumptech.github.io/glide/doc/debugging.html#you-cant-start-or-clear-loads-in-requestlistener-or-target-callbacks),
    // it's not advisable to clear the Glide target within the stack frame.
    // To avoid this, a new runnable is posted to the front of the main queue, which can then clean or create targets.
    // This ensures that the "onResourceReady" frame of the Glide code will be discarded, and the internal state can be altered once again.
    // Normally, using "postAtFrontOfQueue" can lead to issues such as message queue starvation, ordering problems, and other unexpected consequences.
    // However, in this case, it is safe to use as long as nothing else is added to the queue.
    // The intention is simply to wait for the Glide code to finish before the content of the underlying views is changed during the same rendering tick.
    mainHandler.postAtFrontOfQueue {
      trace(Trace.tag, "onResourceReady") {
        val transitionDuration = (transition?.duration ?: 0).toLong()

        // If provided resource is a placeholder, but the target doesn't have a source, we treat it as a normal image.
        if (!isPlaceholder || !target.hasSource) {
          val (newView, previousView) = if (firstView.drawable == null) {
            firstView to secondView
          } else {
            secondView to firstView
          }

          val clearPreviousView = {
            previousView
              .recycleView()
              ?.apply {
                // When the placeholder is loaded, one target is displayed in both views.
                // So we just have to move the reference to a new view instead of clearing the target.
                if (this != target) {
                  clear(requestManager)
                }
              }
          }

          configureView(newView, target, resource, isPlaceholder)

          // Dispatch "onDisplay" event only for the main source (no placeholder).
          if (target.hasSource) {
            onDisplay.invoke(Unit)
          }

          if (transitionDuration <= 0) {
            clearPreviousView()
            newView.alpha = 1f
            newView.bringToFront()
          } else {
            newView.bringToFront()
            previousView.alpha = 1f
            newView.alpha = 0f
            previousView.animate().apply {
              duration = transitionDuration
              alpha(0f)
              withEndAction {
                clearPreviousView()
              }
            }
            newView.animate().apply {
              duration = transitionDuration
              alpha(1f)
            }
          }
        } else {
          // We don't want to show the placeholder if something is currently displayed.
          // There is one exception - when we're displaying a different placeholder.
          if ((firstView.drawable != null && !firstView.isPlaceholder) || secondView.drawable != null) {
            return@trace
          }

          firstView
            .recycleView()
            ?.apply {
              // The current target is already bound to the view. We don't want to cancel it in that case.
              if (this != target) {
                clear(requestManager)
              }
            }

          configureView(firstView, target, resource, isPlaceholder)
          if (transitionDuration > 0) {
            firstView.bringToFront()
            firstView.alpha = 0f
            secondView.isVisible = false
            firstView.animate().apply {
              duration = transitionDuration
              alpha(1f)
            }
          }
        }

        // If our image is animated, we want to see if autoplay is disabled. If it is, we should
        // stop the animation as soon as the resource is ready. Placeholders should not follow this
        // value since the intention is almost certainly to display the animation (i.e. a spinner)
        if (resource is Animatable && !isPlaceholder && !autoplay) {
          resource.stop()
        }
      }
    }

  private fun configureView(
    view: ExpoImageView,
    target: ImageViewWrapperTarget,
    resource: Drawable,
    isPlaceholder: Boolean
  ) {
    view.let {
      it.setImageDrawable(resource)

      it.isPlaceholder = isPlaceholder
      it.placeholderContentFit = target.placeholderContentFit ?: ContentFit.ScaleDown
      copyProps(it)

      it.isVisible = true

      it.currentTarget = target

      // The view isn't layout when it's invisible.
      // Therefore, we have to set the correct size manually.
      it.layout(0, 0, width, height)

      it.applyTransformationMatrix()
    }
    target.isUsed = true

    if (resource is Animatable) {
      resource.start()
    }
  }

  private fun getBestSource(sources: List<Source>): Source? {
    if (sources.isEmpty()) {
      return null
    }

    if (sources.size == 1) {
      return sources.first()
    }

    val targetPixelCount = width * height
    if (targetPixelCount == 0) {
      return null
    }

    var bestSource: Source? = null
    var bestFit = Double.MAX_VALUE

    sources.forEach {
      val fit = abs(1 - (it.pixelCount / targetPixelCount))
      if (fit < bestFit) {
        bestFit = fit
        bestSource = it
      }
    }

    return bestSource
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    rerenderIfNeeded(
      shouldRerenderBecauseOfResize = allowDownscaling &&
        contentFit != ContentFit.Fill &&
        contentFit != ContentFit.None
    )
  }

  private fun createPropOptions(): RequestOptions {
    return RequestOptions()
      .priority(this@ExpoImageViewWrapper.priority.toGlidePriority())
      .customize(`when` = cachePolicy != CachePolicy.MEMORY_AND_DISK && cachePolicy != CachePolicy.MEMORY) {
        skipMemoryCache(true)
      }
      .customize(`when` = cachePolicy == CachePolicy.NONE || cachePolicy == CachePolicy.MEMORY) {
        diskCacheStrategy(DiskCacheStrategy.NONE)
      }
      .customize(blurRadius) {
        transform(BlurTransformation(min(it, 25), 4))
      }
  }

  fun onViewDestroys() {
    firstView.setImageDrawable(null)
    secondView.setImageDrawable(null)

    requestManager.clear(firstTarget)
    requestManager.clear(secondTarget)
  }

  private fun cleanIfNeeded(
    newBestSource: Source?,
    newBestSourceModel: GlideModelProvider?,
    newBestPlaceholderModel: GlideModelProvider?
  ): Boolean {
    // We only clean the image when the source is set to null and we don't have a placeholder or the view is empty.
    if (width == 0 || height == 0 || (newBestSource == null || newBestSourceModel == null) && newBestPlaceholderModel == null) {
      firstView.recycleView()
      secondView.recycleView()

      requestManager.clear(firstTarget)
      requestManager.clear(secondTarget)

      shouldRerender = false
      loadedSource = null
      transformationMatrixChanged = false
      clearViewBeforeChangingSource = false
      return true
    }

    return false
  }

  private fun createDownsampleStrategy(target: ImageViewWrapperTarget): DownsampleStrategy {
    return if (!allowDownscaling) {
      DownsampleStrategy.NONE
    } else if (
      contentFit != ContentFit.Fill &&
      contentFit != ContentFit.None
    ) {
      ContentFitDownsampleStrategy(target, contentFit)
    } else {
      // it won't downscale the image if the image is smaller than hardware bitmap size limit
      SafeDownsampleStrategy(decodeFormat)
    }
  }

  private fun clearViewBeforeChangingSource() {
    if (clearViewBeforeChangingSource) {
      val activeView = if (firstView.drawable != null) {
        firstView
      } else {
        secondView
      }

      activeView
        .recycleView()
        ?.apply {
          clear(requestManager)
        }
    }
  }

  internal fun rerenderIfNeeded(shouldRerenderBecauseOfResize: Boolean = false, force: Boolean = false) =
    trace(Trace.tag, "rerenderIfNeeded(shouldRerenderBecauseOfResize=$shouldRerenderBecauseOfResize,force=$force)") {
      if (lockResource && !force) {
        return@trace
      }
      val bestSource = bestSource
      val bestPlaceholder = bestPlaceholder

      val sourceToLoad = bestSource?.createGlideModelProvider(context)
      val placeholder = bestPlaceholder?.createGlideModelProvider(context)

      if (cleanIfNeeded(bestSource, sourceToLoad, placeholder)) {
        // the view was cleaned
        return@trace
      }

      val shouldRerender = sourceToLoad != loadedSource || shouldRerender || (sourceToLoad == null && placeholder != null)
      if (!shouldRerender && !shouldRerenderBecauseOfResize) {
        // In the case where the source didn't change, but the transformation matrix has to be
        // recalculated, we can apply the new transformation right away.
        // When the source and the matrix is different, we don't want to do anything.
        // We don't want to changed the transformation of the currently displayed image.
        // The new matrix will be applied when new resource is loaded.
        if (transformationMatrixChanged) {
          activeView.applyTransformationMatrix()
        }

        transformationMatrixChanged = false
        clearViewBeforeChangingSource = false

        return@trace
      }

      clearViewBeforeChangingSource()

      this.shouldRerender = false
      loadedSource = sourceToLoad
      val options = bestSource?.createGlideOptions(context)
      val propOptions = createPropOptions()

      val model = sourceToLoad?.getGlideModel()
      if (model is GlideUrlWrapper) {
        model.progressListener = progressListener
      }

      onLoadStart.invoke(Unit)
      val newTarget = if (secondTarget.isUsed) {
        firstTarget
      } else {
        secondTarget
      }
      newTarget.hasSource = sourceToLoad != null

      val downsampleStrategy = createDownsampleStrategy(newTarget)

      val request = requestManager
        .asDrawable()
        .load(model)
        .customize(bestPlaceholder, placeholder) { placeholderSource, placeholderModel ->
          val newPlaceholderContentFit = if (!placeholderSource.usesPlaceholderContentFit()) {
            contentFit
          } else {
            placeholderContentFit
          }
          newTarget.placeholderContentFit = newPlaceholderContentFit

          thumbnail(
            requestManager.load(placeholderModel.getGlideModel())
              .downsample(PlaceholderDownsampleStrategy(newTarget))
              .apply(placeholderSource.createGlideOptions(context))
          )
        }
        .downsample(downsampleStrategy)
        .addListener(GlideRequestListener(WeakReference(this)))
        .encodeQuality(100)
        .format(decodeFormat.toGlideFormat())
        .apply(propOptions)
        .apply(options)
        .customize(tintColor) {
          apply(RequestOptions().set(CustomOptions.tintColor, it))
        }

      val cookie = Trace.getNextCookieValue()
      beginAsyncTraceBlock(Trace.tag, Trace.loadNewImageBlock, cookie)
      newTarget.setCookie(cookie)
      request.into(newTarget)

      transformationMatrixChanged = false
      clearViewBeforeChangingSource = false
    }

  init {
    val matchParent = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)

    layoutParams = matchParent

    firstView.isVisible = true
    secondView.isVisible = true

    // We need to add a `FrameLayout` to allow views to overflow.
    // With the `LinearLayout` is impossible to render two views on each other.
    val layout = FrameLayout(context).apply {
      layoutParams = matchParent
      addView(
        firstView,
        matchParent
      )
      addView(
        secondView,
        matchParent
      )
    }

    addView(layout, matchParent)
  }

  companion object {
    private var requestManager: RequestManager? = null
    private var appContextRef: WeakReference<AppContext?> = WeakReference(null)
    private var activityRef: WeakReference<Activity?> = WeakReference(null)

    fun getOrCreateRequestManager(
      appContext: AppContext,
      activity: Activity
    ): RequestManager = synchronized(Companion) {
      val cachedRequestManager = requestManager
        ?: return createNewRequestManager(activity).also {
          requestManager = it
          appContextRef = WeakReference(appContext)
          activityRef = WeakReference(activity)
        }

      // Request manager was created using different activity or app context
      if (appContextRef.get() != appContext || activityRef.get() != activity) {
        return createNewRequestManager(activity).also {
          requestManager = it
          appContextRef = WeakReference(appContext)
          activityRef = WeakReference(activity)
        }
      }

      return cachedRequestManager
    }

    private fun createNewRequestManager(activity: Activity): RequestManager = Glide.with(activity)
  }
}
