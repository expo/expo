package expo.modules.image

import android.annotation.SuppressLint
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.drawable.Drawable
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

@SuppressLint("ViewConstructor")
class ExpoImageView(context: ReactContext, requestManager: RequestManager, progressInterceptor: OkHttpClientProgressInterceptor) : AppCompatImageView(context) {
  private val mProgressInterceptor: OkHttpClientProgressInterceptor
  private val mRequestManager: RequestManager
  private val mEventEmitter: RCTEventEmitter
  private val mOutlineProvider: OutlineProvider
  private var mBorderDrawable: BorderDrawable? = null
  private var mSourceMap: ReadableMap? = null
  private var mLoadedSource: GlideUrl? = null
  protected fun setSource(sourceMap: ReadableMap?) {
    mSourceMap = sourceMap
  }

  protected fun setResizeMode(resizeMode: ImageResizeMode) {
    scaleType = resizeMode.scaleType
    // TODO: repeat mode handling
  }

  protected fun setBorderRadius(position: Int, borderRadius: Float) {
    var borderRadius = borderRadius
    val isInvalidated = mOutlineProvider.setBorderRadius(borderRadius, position)
    if (isInvalidated) {
      invalidateOutline()
      if (!mOutlineProvider.hasEqualCorners()) {
        invalidate()
      }
    }

    // Setting the border-radius doesn't necessarily mean that a border
    // should to be drawn. Only update the border-drawable when needed.
    if (mBorderDrawable != null) {
      borderRadius = if (!YogaConstants.isUndefined(borderRadius)) PixelUtil.toPixelFromDIP(borderRadius) else borderRadius
      if (position == 0) {
        mBorderDrawable!!.setRadius(borderRadius)
      } else {
        mBorderDrawable!!.setRadius(borderRadius, position - 1)
      }
    }
  }

  protected fun setBorderWidth(position: Int, width: Float) {
    orCreateBorderDrawable.setBorderWidth(position, width)
  }

  protected fun setBorderColor(position: Int, rgb: Float, alpha: Float) {
    orCreateBorderDrawable.setBorderColor(position, rgb, alpha)
  }

  protected fun setBorderStyle(style: String?) {
    orCreateBorderDrawable.setBorderStyle(style)
  }

  protected fun setTintColor(color: Int?) {
    if (color == null) {
      clearColorFilter()
    } else {
      setColorFilter(color, PorterDuff.Mode.SRC_IN)
    }
  }

  protected fun onAfterUpdateTransaction() {
    val sourceToLoad = createUrlFromSourceMap(mSourceMap)
    if (sourceToLoad == null) {
      mRequestManager.clear(this)
      setImageDrawable(null)
      mLoadedSource = null
    } else if (sourceToLoad != mLoadedSource) {
      mLoadedSource = sourceToLoad
      val options = createOptionsFromSourceMap(mSourceMap)
      val eventsManager = ImageLoadEventsManager(id, mEventEmitter)
      mProgressInterceptor.registerProgressListener(sourceToLoad.toStringUrl(), eventsManager)
      eventsManager.onLoadStarted()
      mRequestManager
        .load(sourceToLoad)
        .apply(options)
        .listener(eventsManager)
        .into(this)
      mRequestManager
        .`as`(BitmapFactory.Options::class.java)
        .load(sourceToLoad)
        .into(eventsManager)
    }
  }

  protected fun onDrop() {
    mRequestManager.clear(this)
  }

  protected fun createUrlFromSourceMap(sourceMap: ReadableMap?): GlideUrl? {
    return if (sourceMap == null || sourceMap.getString(SOURCE_URI_KEY) == null) {
      null
    } else GlideUrl(sourceMap.getString(SOURCE_URI_KEY))
  }

  protected fun createOptionsFromSourceMap(sourceMap: ReadableMap?): RequestOptions {
    val options = RequestOptions()
    if (sourceMap != null) {

      // Override the size for local assets. This ensures that
      // resizeMode "center" displays the image in the correct size.
      if (sourceMap.hasKey(SOURCE_WIDTH_KEY) && sourceMap.hasKey(SOURCE_HEIGHT_KEY) && sourceMap.hasKey(SOURCE_SCALE_KEY)) {
        val scale = sourceMap.getDouble(SOURCE_SCALE_KEY)
        val width = sourceMap.getInt(SOURCE_WIDTH_KEY)
        val height = sourceMap.getInt(SOURCE_HEIGHT_KEY)
        options.override((width * scale).toInt(), (height * scale).toInt())
      }
    }
    options.fitCenter()
    return options
  }

  private val orCreateBorderDrawable: BorderDrawable
    private get() {
      if (mBorderDrawable == null) {
        mBorderDrawable = BorderDrawable(context)
        mBorderDrawable!!.callback = this
        val borderRadii = mOutlineProvider.borderRadii
        for (i in borderRadii.indices) {
          var borderRadius = borderRadii[i]
          borderRadius = if (!YogaConstants.isUndefined(borderRadius)) PixelUtil.toPixelFromDIP(borderRadius) else borderRadius
          if (i == 0) {
            mBorderDrawable!!.setRadius(borderRadius)
          } else {
            mBorderDrawable!!.setRadius(borderRadius, i - 1)
          }
        }
      }
      return mBorderDrawable!!
    }

  // Drawing overrides
  override fun invalidateDrawable(drawable: Drawable) {
    super.invalidateDrawable(drawable)
    if (drawable === mBorderDrawable) {
      invalidate()
    }
  }

  override fun draw(canvas: Canvas) {

    // When the border-radii are not all the same, a convex-path
    // is used for the Outline. Unfortunately clipping is not supported
    // for convex-paths and we fallback to Canvas clipping.
    mOutlineProvider.clipCanvasIfNeeded(canvas, this)
    super.draw(canvas)
  }

  public override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)

    // Draw borders on top of the background and image
    if (mBorderDrawable != null) {
      val layoutDirection = if (I18nUtil.getInstance().isRTL(context)) LAYOUT_DIRECTION_RTL else LAYOUT_DIRECTION_LTR
      mBorderDrawable!!.resolvedLayoutDirection = layoutDirection
      mBorderDrawable!!.setBounds(0, 0, canvas.width, canvas.height)
      mBorderDrawable!!.draw(canvas)
    }
  }

  companion object {
    private const val SOURCE_URI_KEY = "uri"
    private const val SOURCE_WIDTH_KEY = "width"
    private const val SOURCE_HEIGHT_KEY = "height"
    private const val SOURCE_SCALE_KEY = "scale"
  }

  init {
    mEventEmitter = context.getJSModule(RCTEventEmitter::class.java)
    mRequestManager = requestManager
    mProgressInterceptor = progressInterceptor
    mOutlineProvider = OutlineProvider(context)
    outlineProvider = mOutlineProvider
    clipToOutline = true
    scaleType = ImageResizeMode.COVER.scaleType
  }
}