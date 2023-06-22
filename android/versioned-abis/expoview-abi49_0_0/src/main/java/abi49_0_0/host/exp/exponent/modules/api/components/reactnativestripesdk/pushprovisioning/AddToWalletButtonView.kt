package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.graphics.drawable.RippleDrawable
import android.view.MotionEvent
import android.webkit.URLUtil
import androidx.appcompat.widget.AppCompatImageView
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi49_0_0.com.facebook.react.uimanager.UIManagerModule
import abi49_0_0.com.facebook.react.uimanager.events.EventDispatcher
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError


class AddToWalletButtonView(private val context: ThemedReactContext, private val requestManager: RequestManager) : AppCompatImageView(context) {
  private var cardDetails: ReadableMap? = null
  private var ephemeralKey: String? = null
  private var sourceMap: ReadableMap? = null
  private var token: ReadableMap? = null

  private var eventDispatcher: EventDispatcher? = context.getNativeModule(UIManagerModule::class.java)?.eventDispatcher
  private var loadedSource: Any? = null
  private var heightOverride: Int = 0
  private var widthOverride: Int = 0

  override fun performClick(): Boolean {
    super.performClick()

    cardDetails?.getString("description")?.let { cardDescription ->
      ephemeralKey?.let { ephemeralKey ->
        PushProvisioningProxy.invoke(
          context.reactApplicationContext,
          this,
          cardDescription,
          ephemeralKey,
          token)
      } ?: run {
        dispatchEvent(
          createError("Failed", "Missing parameters. `ephemeralKey` must be supplied in the props to <AddToWalletButton />")
        )
      }
    } ?: run {
      dispatchEvent(
        createError("Failed", "Missing parameters. `cardDetails.cardDescription` must be supplied in the props to <AddToWalletButton />")
      )
    }
    return true
  }

  init {
    this.setOnTouchListener { view, event ->
      if (event.action == MotionEvent.ACTION_DOWN) {
        view.performClick()
        return@setOnTouchListener true
      }
      return@setOnTouchListener false
    }
  }

  fun onAfterUpdateTransaction() {
    val sourceToLoad = getUrlOrResourceId(sourceMap)
    if (sourceToLoad == null) {
      requestManager.clear(this)
      setImageDrawable(null)
      loadedSource = null
    } else if (sourceToLoad != loadedSource || (heightOverride > 0 || widthOverride > 0)) {
      loadedSource = sourceToLoad
      val scale = sourceMap?.getDouble("scale") ?: 1.0

      requestManager
        .load(sourceToLoad)
        .addListener(object : RequestListener<Drawable> {
          override fun onLoadFailed(e: GlideException?, model: Any?, target: Target<Drawable>?, isFirstResource: Boolean): Boolean {
            dispatchEvent(
              createError("Failed", "Failed to load the source from $sourceToLoad")
            )
            return true
          }
          override fun onResourceReady(resource: Drawable?, model: Any?, target: Target<Drawable>?, dataSource: DataSource?, isFirstResource: Boolean): Boolean {
            setImageDrawable(
              RippleDrawable(
                ColorStateList.valueOf(Color.parseColor("#e0e0e0")),
                resource,
                null))
            return true
          }
        })
        .centerCrop()
        .override((widthOverride * scale).toInt(), (heightOverride * scale).toInt())
        .into(this)
    }
  }

  private fun getUrlOrResourceId(sourceMap: ReadableMap?): Any? {
    sourceMap?.getString("uri")?.let {
      return if (URLUtil.isValidUrl(it)) {
        // Debug mode, Image.resolveAssetSource resolves to local http:// URL
        GlideUrl(it)
      } else {
        // Release mode, Image.resolveAssetSource resolves to a drawable resource
        context.resources.getIdentifier(it, "drawable", context.packageName)
      }
    }
    return null
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (w > 0 && h > 0) {
      heightOverride = h
      widthOverride = w
      onAfterUpdateTransaction()
      heightOverride = 0
      widthOverride = 0
    }
  }

  fun onDropViewInstance() {
    requestManager.clear(this)
  }

  fun setSourceMap(map: ReadableMap) {
    sourceMap = map
  }

  fun setCardDetails(detailsMap: ReadableMap) {
    cardDetails = detailsMap
  }

  fun setEphemeralKey(map: ReadableMap) {
    ephemeralKey = map.toHashMap().toString()
  }

  fun setToken(map: ReadableMap?) {
    token = map
  }

  fun dispatchEvent(error: WritableMap?) {
    eventDispatcher?.dispatchEvent(
      AddToWalletCompleteEvent(
        id,
        error
      )
    )
  }
}
