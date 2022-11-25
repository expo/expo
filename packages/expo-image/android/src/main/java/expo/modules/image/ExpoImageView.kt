package expo.modules.image

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.Shader
import android.graphics.drawable.Drawable
import androidx.appcompat.widget.AppCompatImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.resource.bitmap.DownsampleStrategy
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.DrawableImageViewTarget
import com.bumptech.glide.request.target.SizeReadyCallback
import com.bumptech.glide.request.target.Target
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.ReactViewBackgroundDrawable
import expo.modules.image.drawing.OutlineProvider
import expo.modules.image.enums.ImageResizeMode
import expo.modules.image.events.ImageLoadEventsManager
import expo.modules.image.okhttp.OkHttpClientProgressInterceptor
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
      ImageLoadEventsManager(
        WeakReference(this)
      )
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
  private val eventsManager: ImageLoadEventsManager
) : AppCompatImageView(context) {
  private val progressInterceptor = OkHttpClientProgressInterceptor

  private val outlineProvider = OutlineProvider(context)

  private var propsChanged = false
  private var loadedSource: GlideUrl? = null

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

  private val borderDrawable
    get() = borderDrawableLazyHolder.value

  init {
    clipToOutline = true
    super.setOutlineProvider(outlineProvider)
  }

  // region Component Props
  internal var sourceMap: SourceMap? = null
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

  internal var resizeMode = ImageResizeMode.COVER.also { scaleType = it.getScaleType() }
    set(value) {
      field = value
      scaleType = value.getScaleType()
      propsChanged = true
    }

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

  internal fun setTintColor(color: Int?) {
    color?.let { setColorFilter(it, PorterDuff.Mode.SRC_IN) } ?: clearColorFilter()
  }
  // endregion

  // region ViewManager Lifecycle methods
  internal fun onAfterUpdateTransaction() {
    val sourceToLoad = sourceMap?.createGlideUrl()
    if (sourceToLoad == null) {
      requestManager.clear(this)
      setImageDrawable(null)
      loadedSource = null
      return
    }

    if (sourceToLoad != loadedSource || propsChanged) {
      propsChanged = false
      loadedSource = sourceToLoad
      val options = sourceMap?.createOptions() ?: RequestOptions()
      val propOptions = createPropOptions()
      progressInterceptor.registerProgressListener(sourceToLoad.toStringUrl(), eventsManager)
      eventsManager.onLoadStarted()

      val defaultSourceToLoad = defaultSourceMap?.createGlideUrl()
      requestManager
        .asDrawable()
        .load(sourceToLoad)
        .apply { if (defaultSourceToLoad != null) thumbnail(requestManager.load(defaultSourceToLoad)) }
        .apply(options)
        .downsample(DownsampleStrategy.NONE)
        .addListener(eventsManager)
        .apply(propOptions)
        .into(object : DrawableImageViewTarget(this) {
          override fun getSize(cb: SizeReadyCallback) {
            cb.onSizeReady(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL)
          }
        })

      requestManager
        .`as`(BitmapFactory.Options::class.java)
        // Remove any default listeners from this request
        // (an example would be an SVGSoftwareLayerSetter
        // added in ExpoImageViewManager).
        // This request won't load the image, only the size.
        .listener(null)
        .load(sourceToLoad)
        .into(eventsManager)
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
          transform(BlurTransformation(it + 1, 4))
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

  /**
   * Called when Glide "injects" drawable into the view.
   * When `resizeMode = REPEAT`, we need to update
   * received drawable (unless null) and set correct tiling.
   */
  override fun setImageDrawable(drawable: Drawable?) {
    val maybeUpdatedDrawable = drawable
      ?.takeIf { resizeMode == ImageResizeMode.REPEAT }
      ?.toBitmapDrawable(resources)
      ?.apply {
        setTileModeXY(Shader.TileMode.REPEAT, Shader.TileMode.REPEAT)
      }
    super.setImageDrawable(maybeUpdatedDrawable ?: drawable)
  }
  // endregion
}
