package expo.modules.image

import android.annotation.SuppressLint
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.drawable.Drawable
import android.util.Log
import androidx.appcompat.widget.AppCompatImageView
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.request.RequestOptions
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.yoga.YogaConstants
import expo.modules.image.drawing.BorderDrawable
import expo.modules.image.drawing.OutlineProvider
import expo.modules.image.enums.ImageResizeMode
import expo.modules.image.events.ImageLoadEventsManager
import expo.modules.image.okhttp.OkHttpClientProgressInterceptor

private const val SOURCE_URI_KEY = "uri"
private const val SOURCE_WIDTH_KEY = "width"
private const val SOURCE_HEIGHT_KEY = "height"
private const val SOURCE_SCALE_KEY = "scale"

@SuppressLint("ViewConstructor")
class ExpoImageView(context: ReactContext, private val requestManager: RequestManager, private val progressInterceptor: OkHttpClientProgressInterceptor) : AppCompatImageView(context) {
  private val eventEmitter = context.getJSModule(RCTEventEmitter::class.java)
  private val outlineProvider = OutlineProvider(context)
  private var borderDrawable: BorderDrawable? = null
  private var loadedSource: GlideUrl? = null
  internal var sourceMap: ReadableMap? = null

  init {
    clipToOutline = true
    scaleType = ImageResizeMode.COVER.scaleType
    super.setOutlineProvider(outlineProvider)
  }

  internal fun setResizeMode(resizeMode: ImageResizeMode) {
    scaleType = resizeMode.scaleType
    // TODO: repeat mode handling
  }

  internal fun setBorderRadius(position: Int, borderRadius: Float) {
    var radius = borderRadius
    val isInvalidated = outlineProvider.setBorderRadius(radius, position)
    if (isInvalidated) {
      invalidateOutline()
      if (!outlineProvider.hasEqualCorners()) {
        invalidate()
      }
    }

    // Setting the border-radius doesn't necessarily mean that a border
    // should to be drawn. Only update the border-drawable when needed.
    if (borderDrawable != null) {
      radius = if (!YogaConstants.isUndefined(radius)) PixelUtil.toPixelFromDIP(radius) else radius
      if (position == 0) {
        borderDrawable!!.setRadius(radius)
      } else {
        borderDrawable!!.setRadius(radius, position - 1)
      }
    }
  }

  internal fun setBorderWidth(position: Int, width: Float) {
    getOrCreateBorderDrawable().setBorderWidth(position, width)
  }

  internal fun setBorderColor(position: Int, rgb: Float, alpha: Float) {
    getOrCreateBorderDrawable().setBorderColor(position, rgb, alpha)
  }

  internal fun setBorderStyle(style: String?) {
    getOrCreateBorderDrawable().setBorderStyle(style)
  }

  internal fun setTintColor(color: Int?) {
    if (color == null) {
      clearColorFilter()
    } else {
      setColorFilter(color, PorterDuff.Mode.SRC_IN)
    }
  }

  internal fun onAfterUpdateTransaction() {
    val sourceToLoad = createUrlFromSourceMap(sourceMap)
    if (sourceToLoad == null) {
      requestManager.clear(this)
      setImageDrawable(null)
      loadedSource = null
    } else if (sourceToLoad != loadedSource) {
      loadedSource = sourceToLoad
      val options = createOptionsFromSourceMap(sourceMap)
      val eventsManager = ImageLoadEventsManager(id, eventEmitter)
      progressInterceptor.registerProgressListener(sourceToLoad.toStringUrl(), eventsManager)
      eventsManager.onLoadStarted()
      requestManager
        .load(sourceToLoad)
        .apply(options)
        .listener(eventsManager)
        .into(this)
      requestManager
        .`as`(BitmapFactory.Options::class.java)
        .load(sourceToLoad)
        .into(eventsManager)
    }
  }

  internal fun onDrop() {
    requestManager.clear(this)
  }

  private fun createUrlFromSourceMap(sourceMap: ReadableMap?): GlideUrl? {
    val uriKey = sourceMap?.getString(SOURCE_URI_KEY)
    return uriKey?.let { GlideUrl(uriKey) }
  }

  private fun createOptionsFromSourceMap(sourceMap: ReadableMap?): RequestOptions {
    return RequestOptions()
      .fitCenter()
      .apply {
        // Override the size for local assets. This ensures that
        // resizeMode "center" displays the image in the correct size.
        if (sourceMap != null
          && sourceMap.hasKey(SOURCE_WIDTH_KEY)
          && sourceMap.hasKey(SOURCE_HEIGHT_KEY)
          && sourceMap.hasKey(SOURCE_SCALE_KEY)) {

          val scale = sourceMap.getDouble(SOURCE_SCALE_KEY)
          val width = sourceMap.getInt(SOURCE_WIDTH_KEY)
          val height = sourceMap.getInt(SOURCE_HEIGHT_KEY)
          override((width * scale).toInt(), (height * scale).toInt())
        }
      }
  }

  private fun getOrCreateBorderDrawable(): BorderDrawable {
    if (borderDrawable == null) {
      borderDrawable = BorderDrawable(context)
      borderDrawable!!.callback = this
      val borderRadii = outlineProvider.borderRadiiConfig
      for (i in borderRadii.indices) {
        var borderRadius = borderRadii[i]
        borderRadius = if (!YogaConstants.isUndefined(borderRadius)) PixelUtil.toPixelFromDIP(borderRadius) else borderRadius
        if (i == 0) {
          borderDrawable!!.setRadius(borderRadius)
        } else {
          borderDrawable!!.setRadius(borderRadius, i - 1)
        }
      }
    }
    return borderDrawable!!
  }

  // Drawing overrides
  override fun invalidateDrawable(drawable: Drawable) {
    super.invalidateDrawable(drawable)
    if (drawable === borderDrawable) {
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
    if (borderDrawable != null) {
      val layoutDirection = if (I18nUtil.getInstance().isRTL(context)) LAYOUT_DIRECTION_RTL else LAYOUT_DIRECTION_LTR
      borderDrawable!!.setResolvedLayoutDirection(layoutDirection)
      borderDrawable!!.setBounds(0, 0, width, height)
      borderDrawable!!.draw(canvas)
    }
  }
}