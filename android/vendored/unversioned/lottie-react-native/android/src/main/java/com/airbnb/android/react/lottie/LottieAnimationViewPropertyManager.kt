package com.airbnb.android.react.lottie

import android.graphics.ColorFilter
import android.util.Log
import android.widget.ImageView
import com.airbnb.lottie.LottieAnimationView
import com.airbnb.lottie.LottieDrawable
import com.airbnb.lottie.LottieProperty
import com.airbnb.lottie.RenderMode
import com.airbnb.lottie.SimpleColorFilter
import com.airbnb.lottie.TextDelegate
import com.airbnb.lottie.model.KeyPath
import com.airbnb.lottie.value.LottieValueCallback
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.util.RNLog
import java.lang.ref.WeakReference
import java.util.regex.Pattern

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
            view.setAnimationFromUrl(it, it.hashCode().toString())
            animationURL = null
        }

        sourceDotLottie?.let {
            view.setAnimationFromUrl(it, it.hashCode().toString())
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
