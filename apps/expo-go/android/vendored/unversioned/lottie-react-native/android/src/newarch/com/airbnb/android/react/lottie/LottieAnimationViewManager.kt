package com.airbnb.android.react.lottie

import android.animation.Animator
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setColorFilters
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setEnableMergePaths
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setHardwareAcceleration
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setImageAssetsFolder
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setLoop
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setProgress
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setRenderMode
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setResizeMode
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setSourceJson
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setSourceName
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setSourceURL
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setSpeed
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setTextFilters
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setAutoPlay
import com.airbnb.android.react.lottie.LottieAnimationViewManagerImpl.setSourceDotLottieURI
import com.airbnb.lottie.LottieAnimationView
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.LottieAnimationViewManagerDelegate
import com.facebook.react.viewmanagers.LottieAnimationViewManagerInterface
import java.util.*

@ReactModule(name = LottieAnimationViewManagerImpl.REACT_CLASS)
class LottieAnimationViewManager :
    SimpleViewManager<LottieAnimationView>(),
    LottieAnimationViewManagerInterface<LottieAnimationView> {
    private val propManagersMap =
        WeakHashMap<LottieAnimationView, LottieAnimationViewPropertyManager>()
    private val delegate: ViewManagerDelegate<LottieAnimationView>

    init {
        delegate = LottieAnimationViewManagerDelegate(this)
    }

    private fun getOrCreatePropertyManager(view: LottieAnimationView): LottieAnimationViewPropertyManager {
        var result = propManagersMap[view]
        if (result == null) {
            result = LottieAnimationViewPropertyManager(view)
            propManagersMap[view] = result
        }
        return result
    }

    override fun getDelegate(): ViewManagerDelegate<LottieAnimationView> {
        return delegate
    }

    override fun getExportedViewConstants(): Map<String, Any> {
        return LottieAnimationViewManagerImpl.exportedViewConstants
    }

    override fun getName(): String {
        return LottieAnimationViewManagerImpl.REACT_CLASS
    }

    public override fun createViewInstance(context: ThemedReactContext): LottieAnimationView {
        val view = LottieAnimationViewManagerImpl.createViewInstance(context)
         view.setFailureListener {
            LottieAnimationViewManagerImpl.sendAnimationFailureEvent(view, it)
        }
        view.addLottieOnCompositionLoadedListener {
            LottieAnimationViewManagerImpl.sendAnimationLoadedEvent(view)
        }
        view.addAnimatorListener(object : Animator.AnimatorListener {
            override fun onAnimationStart(animation: Animator) {
                //do nothing
            }

            override fun onAnimationEnd(animation: Animator) {
                LottieAnimationViewManagerImpl.sendOnAnimationFinishEvent(view, false)
            }

            override fun onAnimationCancel(animation: Animator) {
                LottieAnimationViewManagerImpl.sendOnAnimationFinishEvent(view, true)
            }

            override fun onAnimationRepeat(animation: Animator) {
                //do nothing
            }
        })
        return view
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        return LottieAnimationViewManagerImpl.getExportedCustomDirectEventTypeConstants()
    }

    override fun onAfterUpdateTransaction(view: LottieAnimationView) {
        super.onAfterUpdateTransaction(view)
        getOrCreatePropertyManager(view).commitChanges()
    }

    override fun receiveCommand(
        root: LottieAnimationView,
        commandId: String,
        args: ReadableArray?
    ) {
        delegate.receiveCommand(root, commandId, args)
    }

    override fun play(view: LottieAnimationView, startFrame: Int, endFrame: Int) {
        LottieAnimationViewManagerImpl.play(view, startFrame, endFrame)
    }

    override fun reset(view: LottieAnimationView) {
        LottieAnimationViewManagerImpl.reset(view)
    }

    override fun pause(view: LottieAnimationView) {
        LottieAnimationViewManagerImpl.pause(view)
    }

    override fun resume(view: LottieAnimationView) {
        LottieAnimationViewManagerImpl.resume(view)
    }

    @ReactProp(name = "sourceName")
    override fun setSourceName(view: LottieAnimationView, name: String?) {
        setSourceName(name, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "sourceJson")
    override fun setSourceJson(view: LottieAnimationView, json: String?) {
        setSourceJson(json, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "sourceURL")
    override fun setSourceURL(view: LottieAnimationView, urlString: String?) {
        setSourceURL(urlString, getOrCreatePropertyManager(view))
    }
    
    @ReactProp(name = "sourceDotLottieURI")
    override fun setSourceDotLottieURI(view: LottieAnimationView, urlString: String?) {
        setSourceDotLottieURI(urlString, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "cacheComposition")
    override fun setCacheComposition(view: LottieAnimationView, cacheComposition: Boolean) {
        LottieAnimationViewManagerImpl.setCacheComposition(view, cacheComposition)
    }

    @ReactProp(name = "resizeMode")
    override fun setResizeMode(view: LottieAnimationView, resizeMode: String?) {
        setResizeMode(resizeMode, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "renderMode")
    override fun setRenderMode(view: LottieAnimationView, renderMode: String?) {
        setRenderMode(renderMode, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "progress")
    override fun setProgress(view: LottieAnimationView, progress: Float) {
        setProgress(progress, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "speed")
    override fun setSpeed(view: LottieAnimationView, speed: Double) {
        setSpeed(speed, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "loop")
    override fun setLoop(view: LottieAnimationView, loop: Boolean) {
        setLoop(loop, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "autoPlay")
    override fun setAutoPlay(view: LottieAnimationView, autoPlay: Boolean) {
        setAutoPlay(autoPlay, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "imageAssetsFolder")
    override fun setImageAssetsFolder(view: LottieAnimationView, imageAssetsFolder: String?) {
        setImageAssetsFolder(imageAssetsFolder, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "enableMergePathsAndroidForKitKatAndAbove")
    override fun setEnableMergePathsAndroidForKitKatAndAbove(
        view: LottieAnimationView,
        enableMergePaths: Boolean
    ) {
        setEnableMergePaths(enableMergePaths, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "hardwareAccelerationAndroid")
    override fun setHardwareAccelerationAndroid(
        view: LottieAnimationView,
        hardwareAccelerationAndroid: Boolean
    ) {
        setHardwareAcceleration(hardwareAccelerationAndroid, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "colorFilters")
    override fun setColorFilters(view: LottieAnimationView, colorFilters: ReadableArray?) {
        setColorFilters(colorFilters, getOrCreatePropertyManager(view))
    }

    @ReactProp(name = "textFiltersAndroid")
    override fun setTextFiltersAndroid(view: LottieAnimationView, textFilters: ReadableArray?) {
        setTextFilters(textFilters, getOrCreatePropertyManager(view))
    }

    // this props is not available on Android, however we must override the setter
    override fun setTextFiltersIOS(view: LottieAnimationView?, value: ReadableArray?) {
        //ignore - do nothing here
    }

    // Only here to solve an iOS issue with codegen. Check dummy prop in LottieAnimationViewNativeComponent.ts
    override fun setDummy(view: LottieAnimationView, value: ReadableMap?) {
        //ignore - do nothing here
    }
}
