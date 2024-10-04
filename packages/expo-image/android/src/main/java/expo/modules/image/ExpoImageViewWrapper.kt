package expo.modules.image

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.Rect
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
import com.facebook.yoga.YogaConstants
import expo.modules.image.enums.ContentFit
import expo.modules.image.enums.Priority
import expo.modules.image.events.GlideRequestListener
import expo.modules.image.events.OkHttpProgressListener
import expo.modules.image.okhttp.GlideUrlWrapper
import expo.modules.image.records.CachePolicy
import expo.modules.image.records.ContentPosition
import expo.modules.image.records.ImageErrorEvent
import expo.modules.image.records.ImageLoadEvent
import expo.modules.image.records.ImageProgressEvent
import expo.modules.image.records.ImageTransition
import expo.modules.image.records.SourceMap
import expo.modules.image.svg.SVGSoftwareLayerSetter
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import jp.wasabeef.glide.transformations.BlurTransformation
import java.lang.ref.WeakReference
import kotlin.math.abs
import kotlin.math.min

@SuppressLint("ViewConstructor")
class ExpoImageViewWrapper(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val activity: Activity
    get() = appContext.currentActivity ?: throw MissingActivity()

  private val requestManager = getOrCreateRequestManager(appContext, activity)
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

  internal var sources: List<SourceMap> = emptyList()
  private val bestSource: SourceMap?
    get() = getBestSource(sources)

  internal var placeholders: List<SourceMap> = emptyList()
  private val bestPlaceholder: SourceMap?
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

  internal var borderStyle: String? = null
    set(value) {
      field = value
      activeView.setBorderStyle(value)
    }

  internal var backgroundColor: Int? = null
    set(value) {
      field = value
      activeView.setBackgroundColor(value)
    }

  internal var tintColor: Int? = null
    set(value) {
      field = value
      activeView.setTintColor(value)
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
      clearViewBeforeChangingSource = value != null && value != field
      field = value
    }

  internal var priority: Priority = Priority.NORMAL
  internal var cachePolicy: CachePolicy = CachePolicy.DISK

  private var borderRadius = FloatArray(9) { YogaConstants.UNDEFINED }
  private var borderWidth = FloatArray(9) { YogaConstants.UNDEFINED }
  private var borderColor = Array(9) { YogaConstants.UNDEFINED to YogaConstants.UNDEFINED }

  fun setBorderRadius(index: Int, radius: Float) {
    borderRadius[index] = radius
    activeView.setBorderRadius(index, radius)
  }

  fun setBorderWidth(index: Int, width: Float) {
    borderWidth[index] = width
    activeView.setBorderWidth(index, width)
  }

  fun setBorderColor(index: Int, rgb: Float, alpha: Float) {
    borderColor[index] = rgb to alpha
    activeView.setBorderColor(index, rgb, alpha)
  }

  /**
   * Whether the image should be loaded again
   */
  private var shouldRerender = false

  /**
   * Currently loaded source
   */
  private var loadedSource: GlideModel? = null

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
    view.setBorderStyle(borderStyle)
    view.setBackgroundColor(backgroundColor)
    view.setTintColor(tintColor)
    view.isFocusable = isFocusableProp
    view.contentDescription = accessibilityLabel
    borderColor.forEachIndexed { index, (rgb, alpha) ->
      view.setBorderColor(index, rgb, alpha)
    }
    borderRadius.forEachIndexed { index, value ->
      view.setBorderRadius(index, value)
    }
    borderWidth.forEachIndexed { index, value ->
      view.setBorderWidth(index, value)
    }
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
          return@postAtFrontOfQueue
        }

        firstView
          .recycleView()
          ?.clear(requestManager)

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

      // The view isn't layout when it's invisible.
      // Therefore, we have to set the correct size manually.
      it.layout(0, 0, width, height)

      it.applyTransformationMatrix()
      it.currentTarget = target
    }
    target.isUsed = true

    if (resource is Animatable) {
      resource.start()
    }
  }

  private fun getBestSource(sources: List<SourceMap>): SourceMap? {
    if (sources.isEmpty()) {
      return null
    }

    if (sources.size == 1) {
      return sources.first()
    }

    val selfRect = Rect(0, 0, width, height)
    if (selfRect.isEmpty) {
      return null
    }

    val targetPixelCount = selfRect.width() * selfRect.height()

    var bestSource: SourceMap? = null
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

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    rerenderIfNeeded()
  }

  private fun createPropOptions(): RequestOptions {
    return RequestOptions()
      .apply {
        priority(this@ExpoImageViewWrapper.priority.toGlidePriority())

        if (cachePolicy != CachePolicy.MEMORY_AND_DISK && cachePolicy != CachePolicy.MEMORY) {
          skipMemoryCache(true)
        }
        if (cachePolicy == CachePolicy.NONE || cachePolicy == CachePolicy.MEMORY) {
          diskCacheStrategy(DiskCacheStrategy.NONE)
        }

        blurRadius?.let {
          transform(BlurTransformation(min(it, 25), 4))
        }
      }
  }

  fun onViewDestroys() {
    firstView.setImageDrawable(null)
    secondView.setImageDrawable(null)

    requestManager.clear(firstTarget)
    requestManager.clear(secondTarget)
  }

  internal fun rerenderIfNeeded() {
    val bestSource = bestSource
    val bestPlaceholder = bestPlaceholder

    val sourceToLoad = bestSource?.createGlideModel(context)
    val placeholder = bestPlaceholder?.createGlideModel(context)
    // We only clean the image when the source is set to null and we don't have a placeholder.
    if ((bestSource == null || sourceToLoad == null) && placeholder == null) {
      firstView.recycleView()
      secondView.recycleView()

      requestManager.clear(firstTarget)
      requestManager.clear(secondTarget)

      shouldRerender = false
      loadedSource = null
      transformationMatrixChanged = false
      clearViewBeforeChangingSource = false
      return
    }

    if (sourceToLoad != loadedSource || shouldRerender || (sourceToLoad == null && placeholder != null)) {
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

      shouldRerender = false
      loadedSource = sourceToLoad
      val options = bestSource?.createOptions(context)
      val propOptions = createPropOptions()

      val model = sourceToLoad?.glideData
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

      val request = requestManager
        .asDrawable()
        .load(model)
        .apply {
          if (placeholder != null) {
            thumbnail(requestManager.load(placeholder.glideData))
            val newPlaceholderContentFit = if (bestPlaceholder.isBlurhash()) {
              contentFit
            } else {
              placeholderContentFit
            }
            newTarget.placeholderContentFit = newPlaceholderContentFit
          }
        }
        .apply {
          options?.let {
            apply(it)
          }
        }
        .downsample(DownsampleStrategy.NONE)
        .addListener(GlideRequestListener(WeakReference(this)))
        .encodeQuality(100)
        .apply(propOptions)

      request.into(newTarget)
    } else {
      // In the case where the source didn't change, but the transformation matrix has to be
      // recalculated, we can apply the new transformation right away.
      // When the source and the matrix is different, we don't want to do anything.
      // We don't want to changed the transformation of the currently displayed image.
      // The new matrix will be applied when new resource is loaded.
      if (transformationMatrixChanged) {
        activeView.applyTransformationMatrix()
      }
    }
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

    fun getOrCreateRequestManager(
      appContext: AppContext,
      activity: Activity
    ): RequestManager = synchronized(Companion) {
      val cachedRequestManager = requestManager
        ?: return createNewRequestManager(activity).also {
          requestManager = it
          appContextRef = WeakReference(appContext)
        }

      // Request manager was created using different activity
      if (appContextRef.get() != appContext) {
        return createNewRequestManager(activity).also {
          requestManager = it
          appContextRef = WeakReference(appContext)
        }
      }

      return cachedRequestManager
    }

    private fun createNewRequestManager(activity: Activity): RequestManager =
      Glide.with(activity).addDefaultRequestListener(SVGSoftwareLayerSetter())
  }
}
