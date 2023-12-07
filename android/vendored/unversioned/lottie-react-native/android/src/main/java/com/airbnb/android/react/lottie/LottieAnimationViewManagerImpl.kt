package com.airbnb.android.react.lottie

import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.View.OnAttachStateChangeListener
import android.widget.ImageView
import androidx.core.view.ViewCompat
import com.airbnb.lottie.LottieAnimationView
import com.airbnb.lottie.RenderMode
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper

internal object LottieAnimationViewManagerImpl {
    const val REACT_CLASS = "LottieAnimationView"

    @JvmStatic
    val exportedViewConstants: Map<String, Any>
        get() = MapBuilder.builder<String, Any>()
            .put("VERSION", 1)
            .build()

    @JvmStatic
    fun createViewInstance(context: ThemedReactContext): LottieAnimationView {
        return LottieAnimationView(context).apply {
            scaleType = ImageView.ScaleType.CENTER_INSIDE
        }
    }

    @JvmStatic
    fun sendOnAnimationFinishEvent(view: LottieAnimationView, isCancelled: Boolean) {
        val screenContext = view.context as ThemedReactContext
        val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(screenContext, view.id)
        eventDispatcher?.dispatchEvent(
            OnAnimationFinishEvent(
                screenContext.surfaceId,
                view.id,
                isCancelled
            )
        )
    }

    @JvmStatic
    fun sendAnimationFailureEvent(view: LottieAnimationView, error: Throwable) {
        val screenContext = view.context as ThemedReactContext
        val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(screenContext, view.id)
        eventDispatcher?.dispatchEvent(
            OnAnimationFailureEvent(
                screenContext.surfaceId,
                view.id,
                error
            )
        )
    }

    @JvmStatic
    fun sendAnimationLoadedEvent(view: LottieAnimationView) {
        val screenContext = view.context as ThemedReactContext
        val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(screenContext, view.id)
        eventDispatcher?.dispatchEvent(
            OnAnimationLoadedEvent(
                screenContext.surfaceId,
                view.id,
            )
        )
    }

    @JvmStatic
    fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return MapBuilder.of(
            OnAnimationFinishEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onAnimationFinish"),
            OnAnimationFailureEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onAnimationFailure"),
            OnAnimationLoadedEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onAnimationLoaded"),
        )
    }

    @JvmStatic
    fun play(view: LottieAnimationView, startFrame: Int, endFrame: Int) {
        Handler(Looper.getMainLooper()).post {
            if (startFrame != -1 && endFrame != -1) {
                if (startFrame > endFrame) {
                    view.setMinAndMaxFrame(endFrame, startFrame)
                    if (view.speed > 0) {
                        view.reverseAnimationSpeed()
                    }
                } else {
                    view.setMinAndMaxFrame(startFrame, endFrame)
                    if (view.speed < 0) {
                        view.reverseAnimationSpeed()
                    }
                }
            }
            if (ViewCompat.isAttachedToWindow(view)) {
                view.progress = 0f
                view.playAnimation()
            } else {
                view.addOnAttachStateChangeListener(object : OnAttachStateChangeListener {
                    override fun onViewAttachedToWindow(v: View) {
                        val listenerView = v as LottieAnimationView
                        listenerView.progress = 0f
                        listenerView.playAnimation()
                        listenerView.removeOnAttachStateChangeListener(this)
                    }

                    override fun onViewDetachedFromWindow(v: View) {
                        val listenerView = v as LottieAnimationView
                        listenerView.removeOnAttachStateChangeListener(this)
                    }
                })
            }
        }
    }

    @JvmStatic
    fun reset(view: LottieAnimationView) {
        Handler(Looper.getMainLooper()).post {
            if (ViewCompat.isAttachedToWindow(view)) {
                view.cancelAnimation()
                view.progress = 0f
            }
        }
    }

    @JvmStatic
    fun pause(view: LottieAnimationView) {
        Handler(Looper.getMainLooper()).post {
            if (ViewCompat.isAttachedToWindow(view)) {
                view.pauseAnimation()
            }
        }
    }

    @JvmStatic
    fun resume(view: LottieAnimationView) {
        Handler(Looper.getMainLooper()).post {
            if (ViewCompat.isAttachedToWindow(view)) {
                view.resumeAnimation()
            }
        }
    }

    @JvmStatic
    fun setSourceName(
        name: String?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        // To match the behaviour on iOS we expect the source name to be
        // extensionless. This means "myAnimation" corresponds to a file
        // named `myAnimation.json` in `main/assets`. To maintain backwards
        // compatibility we only add the .json extension if no extension is
        // passed.
        var resultSourceName = name
        if (resultSourceName?.contains(".") == false) {
            resultSourceName = "$resultSourceName.json"
        }
        viewManager.animationName = resultSourceName
        viewManager.commitChanges()
    }

    @JvmStatic
    fun setSourceJson(
        json: String?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.animationJson = json
        viewManager.commitChanges()
    }

    @JvmStatic
    fun setSourceURL(
        urlString: String?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.animationURL = urlString
        viewManager.commitChanges()
    }

    @JvmStatic
    fun setSourceDotLottieURI(
        uri: String?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.sourceDotLottie = uri
        viewManager.commitChanges()
    }

    @JvmStatic
    fun setCacheComposition(view: LottieAnimationView, cacheComposition: Boolean) {
        view.setCacheComposition(cacheComposition)
    }

    @JvmStatic
    fun setResizeMode(
        resizeMode: String?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        var mode: ImageView.ScaleType? = null
        when (resizeMode) {
            "cover" -> {
                mode = ImageView.ScaleType.CENTER_CROP
            }

            "contain" -> {
                mode = ImageView.ScaleType.FIT_CENTER
            }

            "center" -> {
                mode = ImageView.ScaleType.CENTER_INSIDE
            }
        }
        viewManager.scaleType = mode
    }

    @JvmStatic
    fun setRenderMode(
        renderMode: String?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        var mode: RenderMode? = null
        when (renderMode) {
            "AUTOMATIC" -> {
                mode = RenderMode.AUTOMATIC
            }

            "HARDWARE" -> {
                mode = RenderMode.HARDWARE
            }

            "SOFTWARE" -> {
                mode = RenderMode.SOFTWARE
            }
        }
        viewManager.renderMode = mode
    }

    @JvmStatic
    fun setHardwareAcceleration(
        hardwareAccelerationAndroid: Boolean,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        var layerType: Int? = View.LAYER_TYPE_SOFTWARE
        if (hardwareAccelerationAndroid) {
            layerType = View.LAYER_TYPE_HARDWARE
        }
        viewManager.layerType = layerType
    }

    @JvmStatic
    fun setProgress(
        progress: Float,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.progress = progress
    }

    @JvmStatic
    fun setSpeed(
        speed: Double,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.speed = speed.toFloat()
    }

    @JvmStatic
    fun setLoop(
        loop: Boolean,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.loop = loop
    }

    @JvmStatic
    fun setAutoPlay(
        autoPlay: Boolean,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.autoPlay = autoPlay
    }

    @JvmStatic
    fun setEnableMergePaths(
        enableMergePaths: Boolean,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.enableMergePaths = enableMergePaths
    }

    @JvmStatic
    fun setImageAssetsFolder(
        imageAssetsFolder: String?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.imageAssetsFolder = imageAssetsFolder
    }

    @JvmStatic
    fun setColorFilters(
        colorFilters: ReadableArray?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.colorFilters = colorFilters
    }

    @JvmStatic
    fun setTextFilters(
        textFilters: ReadableArray?,
        viewManager: LottieAnimationViewPropertyManager
    ) {
        viewManager.textFilters = textFilters
    }
}