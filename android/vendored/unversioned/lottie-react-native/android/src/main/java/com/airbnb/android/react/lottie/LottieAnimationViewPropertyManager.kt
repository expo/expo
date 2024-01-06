package com.airbnb.android.react.lottie

import android.graphics.ColorFilter
import android.graphics.Typeface
import android.net.Uri
import android.widget.ImageView
import com.airbnb.lottie.LottieAnimationView
import com.airbnb.lottie.LottieDrawable
import com.airbnb.lottie.LottieProperty
import com.airbnb.lottie.RenderMode
import com.airbnb.lottie.SimpleColorFilter
import com.airbnb.lottie.TextDelegate
import com.airbnb.lottie.FontAssetDelegate
import com.airbnb.lottie.model.KeyPath
import com.airbnb.lottie.value.LottieValueCallback
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.views.text.ReactFontManager
import com.facebook.react.views.text.TextAttributeProps.UNSET
import com.facebook.react.util.RNLog
import java.lang.ref.WeakReference
import java.util.regex.Pattern
import java.util.zip.ZipInputStream
import java.io.File
import java.io.FileInputStream

/**
 * Class responsible for applying the properties to the LottieView. The way react-native works makes
 * it impossible to predict in which order properties will be set, also some of the properties of
 * the LottieView needs to be set simultaneously.
 *
 * To solve this, instance of this class accumulates all changes to the view and applies them at the
 * end of react transaction, so it could control how changes are applied.
 */
class LottieAnimationViewPropertyManager(view: LottieAnimationView) {
    private val viewWeakReference: WeakReference<LottieAnimationView>

    /**
     * Should be set to true if one of the animationName related parameters has changed as a result
     * of last reconciliation. We need to update the animation in this case.
     */
    private var animationNameDirty = false

    var animationName: String? = null
        set(value) {
            field = value
            this.animationNameDirty = true
        }
    var scaleType: ImageView.ScaleType? = null
    var imageAssetsFolder: String? = null
    var enableMergePaths: Boolean? = null
    var colorFilters: ReadableArray? = null
    var textFilters: ReadableArray? = null
    var renderMode: RenderMode? = null
    var layerType: Int? = null
    var animationJson: String? = null
    var animationURL: String? = null
    var sourceDotLottie: String? = null
    var progress: Float? = null
    var loop: Boolean? = null
    var autoPlay: Boolean? = null
    var speed: Float? = null

    init {
        viewWeakReference = WeakReference(view)

        view.setFontAssetDelegate(object : FontAssetDelegate() {
            override fun fetchFont(fontFamily: String): Typeface {
                return ReactFontManager.getInstance()
                    .getTypeface(fontFamily, UNSET, UNSET, view.context.assets)
            }
        
            override fun fetchFont(fontFamily: String, fontStyle: String, fontName: String): Typeface {
                val weight = when (fontStyle) {
                    "Thin" -> 100
                    "Light" -> 200
                    "Normal", "Regular" -> 400
                    "Medium" -> 500
                    "Bold" -> 700
                    "Black" -> 900
                    else -> UNSET
                }
                return ReactFontManager.getInstance()
                    .getTypeface(fontName, UNSET, weight, view.context.assets)
            }
        })
    }

    /**
     * Updates the view with changed fields. Majority of the properties here are independent so they
     * are has to be reset to null as soon as view is updated with the value.
     *
     * The only exception from this rule is the group of the properties for the animation. For now
     * this is animationName and cacheStrategy. These two properties are should be set
     * simultaneously if the dirty flag is set.
     */
    fun commitChanges() {
        val view = viewWeakReference.get() ?: return

        textFilters?.let {
            if (it.size() > 0) {
                val textDelegate = TextDelegate(view)
                for (i in 0 until textFilters!!.size()) {
                    val current = textFilters!!.getMap(i)
                    val searchText = current.getString("find")
                    val replacementText = current.getString("replace")
                    textDelegate.setText(searchText, replacementText)
                }
                view.setTextDelegate(textDelegate)
            }
        }

        animationJson?.let {
            view.setAnimationFromJson(it, it.hashCode().toString())
            animationJson = null
        }

        animationURL?.let {
            var file = File(it)
            if (file.exists()) {
                view.setAnimation(FileInputStream(file), it.hashCode().toString())
            } else {
                view.setAnimationFromUrl(it, it.hashCode().toString())
            }
            animationURL = null
        }

        sourceDotLottie?.let { assetName ->
            var file = File(assetName)
            if (file.exists()) {
                view.setAnimation(
                    ZipInputStream(FileInputStream(file)),
                    assetName.hashCode().toString()
                )
                sourceDotLottie = null
                return
            }

            val scheme = runCatching { Uri.parse(assetName).scheme }.getOrNull()
            if (scheme != null) {
                view.setAnimationFromUrl(assetName)
                sourceDotLottie = null
                return
            }

            // resource needs to be loaded in release mode: https://github.com/facebook/react-native/issues/24963#issuecomment-532168307
            val resourceId = view.resources.getIdentifier(
                assetName,
                "raw",
                view.context.packageName
            )

            if (resourceId == 0) {
                RNLog.e("Animation for $assetName was not found in raw resources")
                return
            }

            view.setAnimation(resourceId)
            animationNameDirty = false
            sourceDotLottie = null
        }

        if (animationNameDirty) {
            view.setAnimation(animationName)
            animationNameDirty = false
        }

        progress?.let {
            view.progress = it
            progress = null
        }

        loop?.let {
            view.repeatCount = if (it) LottieDrawable.INFINITE else 0
            loop = null
        }

        autoPlay?.let {
            if (it && !view.isAnimating) {
                view.playAnimation()
            }
        }

        speed?.let {
            view.speed = it
            speed = null
        }

        scaleType?.let {
            view.scaleType = it
            scaleType = null
        }

        renderMode?.let {
            view.renderMode = it
            renderMode = null
        }

        layerType?.let { view.setLayerType(it, null) }

        imageAssetsFolder?.let {
            view.imageAssetsFolder = it
            imageAssetsFolder = null
        }

        enableMergePaths?.let {
            view.enableMergePathsForKitKatAndAbove(it)
            enableMergePaths = null
        }

        colorFilters?.let { colorFilters ->
            if (colorFilters.size() > 0) {
                for (i in 0 until colorFilters.size()) {
                    val current = colorFilters.getMap(i)
                    parseColorFilter(current, view)
                }
            }
        }
    }

    private fun parseColorFilter(
        colorFilter: ReadableMap,
        view: LottieAnimationView
    ) {
        val color: Int = if (colorFilter.getType("color") == ReadableType.Map) {
            ColorPropConverter.getColor(colorFilter.getMap("color"), view.context)
        } else {
            colorFilter.getInt("color")
        }

        val path = colorFilter.getString("keypath")
        val pathGlob = "$path.**"
        val keys = pathGlob.split(Pattern.quote(".").toRegex())
            .dropLastWhile { it.isEmpty() }
            .toTypedArray()
        val keyPath = KeyPath(*keys)

        val filter: ColorFilter = SimpleColorFilter(color)
        val colorFilterCallback = LottieValueCallback(filter)

        view.addValueCallback(keyPath, LottieProperty.COLOR_FILTER, colorFilterCallback)
    }
}
