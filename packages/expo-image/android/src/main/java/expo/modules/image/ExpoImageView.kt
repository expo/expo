package expo.modules.image

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.graphics.transform
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.resource.bitmap.DownsampleStrategy
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.DrawableImageViewTarget
import com.bumptech.glide.request.target.SizeReadyCallback
import com.bumptech.glide.request.target.Target
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.ReactViewBackgroundDrawable
import expo.modules.image.drawing.OutlineProvider
import expo.modules.image.enums.ContentFit
import expo.modules.image.enums.Priority
import expo.modules.image.events.GlideRequestListener
import expo.modules.image.events.OkHttpProgressListener
import expo.modules.image.okhttp.OkHttpClientProgressInterceptor
import expo.modules.image.records.ContentPosition
import expo.modules.image.records.ImageErrorEvent
import expo.modules.image.records.ImageLoadEvent
import expo.modules.image.records.ImageProgressEvent
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
  internal val onLoadStart by EventDispatcher<Unit>()
  internal val onProgress by EventDispatcher<ImageProgressEvent>()
  internal val onError by EventDispatcher<ImageErrorEvent>()
  internal val onLoad by EventDispatcher<ImageLoadEvent>()

  private val activity: Activity
    get() = appContext.currentActivity ?: throw MissingActivity()

  internal val imageView = run {
    val activity = activity
    ExpoImageView(
      activity,
      getOrCreateRequestManager(appContext, activity),
      WeakReference(this)
    ).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      addView(this)
    }
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

@SuppressLint("ViewConstructor")
class ExpoImageView(
  context: Context,
  private val requestManager: RequestManager,
  private val expoImageViewWrapper: WeakReference<ExpoImageViewWrapper>
) : AppCompatImageView(context) {
  private val progressInterceptor = OkHttpClientProgressInterceptor

  private val outlineProvider = OutlineProvider(context)

  private var propsChanged = false
  private var loadedSource: GlideModel? = null

  private val borderDrawableLazyHolder = lazy {
    ReactViewBackgroundDrawable(context).apply {
      callback = this@ExpoImageView

      outlineProvider.borderRadiiConfig
        .map { it.ifYogaDefinedUse(PixelUtil::toPixelFromDIP) }
        .withIndex()
        .forEach { (i, radius) ->
          if (i == 0) {
            setRadius(radius)
          } else {
            setRadius(radius, i - 1)
          }
        }
    }
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    onAfterUpdateTransaction()

    if (drawable == null) {
      return
    }
    applyTransformationMatrix()
  }

  fun applyTransformationMatrix() {
    val imageRect = RectF(0f, 0f, drawable.intrinsicWidth.toFloat(), drawable.intrinsicHeight.toFloat())
    val viewRect = RectF(0f, 0f, width.toFloat(), height.toFloat())

    val matrix = contentFit.toMatrix(imageRect, viewRect)

    val scaledImageRect = imageRect.transform(matrix)

    imageMatrix = matrix.apply {
      contentPosition.apply(this, scaledImageRect, viewRect)
    }
  }

  private val borderDrawable
    get() = borderDrawableLazyHolder.value

  init {
    clipToOutline = true
    scaleType = ScaleType.MATRIX
    super.setOutlineProvider(outlineProvider)
  }

  // region Component Props
  internal var sources: List<SourceMap> = emptyList()
  private val bestSource: SourceMap?
    get() {
      if (sources.isEmpty()) {
        return null
      }

      if (sources.size == 1) {
        return sources.first()
      }

      val parent = parent as? ExpoImageViewWrapper ?: return null
      val parentRect = Rect(0, 0, parent.width, parent.height)
      if (parentRect.isEmpty) {
        return null
      }

      val targetPixelCount = parentRect.width() * parentRect.height()

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

  internal var defaultSourceMap: SourceMap? = null

  internal var blurRadius: Int? = null
    set(value) {
      field = value?.takeIf { it > 0 }
      propsChanged = true
    }

  internal var fadeDuration: Int? = null
    set(value) {
      field = value?.takeIf { it > 0 }
      propsChanged = true
    }

  internal var contentFit: ContentFit = ContentFit.Cover
    set(value) {
      field = value
      propsChanged = true
    }

  internal var contentPosition: ContentPosition = ContentPosition.center
    set(value) {
      field = value
      propsChanged = true
    }

  internal var priority: Priority = Priority.NORMAL

  internal fun setBorderRadius(position: Int, borderRadius: Float) {
    val isInvalidated = outlineProvider.setBorderRadius(borderRadius, position)
    if (isInvalidated) {
      invalidateOutline()
      if (!outlineProvider.hasEqualCorners()) {
        invalidate()
      }
    }

    // Setting the border-radius doesn't necessarily mean that a border
    // should to be drawn. Only update the border-drawable when needed.
    if (borderDrawableLazyHolder.isInitialized()) {
      val radius = borderRadius.ifYogaDefinedUse(PixelUtil::toPixelFromDIP)
      borderDrawableLazyHolder.value.apply {
        if (position == 0) {
          setRadius(radius)
        } else {
          setRadius(radius, position - 1)
        }
      }
    }
  }

  internal fun setBorderWidth(position: Int, width: Float) {
    borderDrawable.setBorderWidth(position, width)
  }

  internal fun setBorderColor(position: Int, rgb: Float, alpha: Float) {
    borderDrawable.setBorderColor(position, rgb, alpha)
  }

  internal fun setBorderStyle(style: String?) {
    borderDrawable.setBorderStyle(style)
  }

  internal fun setBackgroundColor(color: Int?) {
    if (color == null) {
      setBackgroundColor(Color.TRANSPARENT)
    } else {
      setBackgroundColor(color)
    }
  }

  internal fun setTintColor(color: Int?) {
    color?.let { setColorFilter(it, PorterDuff.Mode.SRC_IN) } ?: clearColorFilter()
  }
  // endregion

  // region ViewManager Lifecycle methods
  internal fun onAfterUpdateTransaction() {
    val bestSource = bestSource
    val sourceToLoad = bestSource?.createGlideModel()

    if (bestSource == null || sourceToLoad == null) {
      requestManager.clear(this)
      setImageDrawable(null)
      loadedSource = null
      return
    }

    if (sourceToLoad != loadedSource || propsChanged) {
      propsChanged = false
      loadedSource = sourceToLoad
      val options = bestSource.createOptions(context).apply {
        priority(this@ExpoImageView.priority.toGlidePriority())
      }

      val propOptions = createPropOptions()

      if (sourceToLoad is GlideUrlModel) {
        progressInterceptor.registerProgressListener(
          sourceToLoad.glideData.toStringUrl(),
          OkHttpProgressListener(expoImageViewWrapper)
        )
      }

      expoImageViewWrapper.get()?.onLoadStart?.invoke(Unit)

      val defaultSourceToLoad = defaultSourceMap?.createGlideModel()
      requestManager
        .asDrawable()
        .load(sourceToLoad.glideData)
        .apply { if (defaultSourceToLoad != null) thumbnail(requestManager.load(defaultSourceToLoad)) }
        .apply(options)
        .downsample(DownsampleStrategy.NONE)
        .addListener(GlideRequestListener(expoImageViewWrapper))
        .encodeQuality(100)
        .apply(propOptions)
        .into(object : DrawableImageViewTarget(this) {
          override fun getSize(cb: SizeReadyCallback) {
            cb.onSizeReady(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL)
          }

          override fun setResource(resource: Drawable?) {
            super.setResource(resource)
            if (resource != null) {
              applyTransformationMatrix()
            }
          }
        })
    }
  }

  internal fun onDrop() {
    requestManager.clear(this)
  }
  // endregion

  // region Helper methods

  private fun createPropOptions(): RequestOptions {
    return RequestOptions()
      .apply {
        blurRadius?.let {
          transform(BlurTransformation(min(it, 25), 4))
        }
        fadeDuration?.let {
          alpha = 0f
          animate().alpha(1f).duration = it.toLong()
        }
      }
  }
  // endregion

  // region Drawing overrides
  override fun invalidateDrawable(drawable: Drawable) {
    super.invalidateDrawable(drawable)
    if (borderDrawableLazyHolder.isInitialized() && drawable === borderDrawable) {
      invalidate()
    }
  }

  override fun draw(canvas: Canvas) {
    // When the border-radii are not all the same, a convex-path
    // is used for the Outline. Unfortunately clipping is not supported
    // for convex-paths and we fallback to Canvas clipping.
    outlineProvider.clipCanvasIfNeeded(canvas, this)
    super.draw(canvas)
  }

  public override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    // Draw borders on top of the background and image
    if (borderDrawableLazyHolder.isInitialized()) {
      val layoutDirection = if (I18nUtil.getInstance().isRTL(context)) {
        LAYOUT_DIRECTION_RTL
      } else {
        LAYOUT_DIRECTION_LTR
      }

      borderDrawable.apply {
        resolvedLayoutDirection = layoutDirection
        setBounds(0, 0, width, height)
        draw(canvas)
      }
    }
  }

  // TODO(@lukmccall): Fix `repeat`
//  /**
//   * Called when Glide "injects" drawable into the view.
//   * When `resizeMode = REPEAT`, we need to update
//   * received drawable (unless null) and set correct tiling.
//   */
//  override fun setImageDrawable(drawable: Drawable?) {
//    val maybeUpdatedDrawable = drawable
//      ?.takeIf { resizeMode == ImageResizeMode.REPEAT }
//      ?.toBitmapDrawable(resources)
//      ?.apply {
//        setTileModeXY(Shader.TileMode.REPEAT, Shader.TileMode.REPEAT)
//      }
//    super.setImageDrawable(maybeUpdatedDrawable ?: drawable)
//  }
  // endregion
}
