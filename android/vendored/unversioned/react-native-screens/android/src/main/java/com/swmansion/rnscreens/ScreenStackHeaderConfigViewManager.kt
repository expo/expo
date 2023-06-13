package com.swmansion.rnscreens

import android.util.Log
import android.view.View
import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.RNSScreenStackHeaderConfigManagerDelegate
import com.facebook.react.viewmanagers.RNSScreenStackHeaderConfigManagerInterface
import javax.annotation.Nonnull

@ReactModule(name = ScreenStackHeaderConfigViewManager.REACT_CLASS)
class ScreenStackHeaderConfigViewManager : ViewGroupManager<ScreenStackHeaderConfig>(), RNSScreenStackHeaderConfigManagerInterface<ScreenStackHeaderConfig> {
    private val mDelegate: ViewManagerDelegate<ScreenStackHeaderConfig>

    init {
        mDelegate = RNSScreenStackHeaderConfigManagerDelegate<ScreenStackHeaderConfig, ScreenStackHeaderConfigViewManager>(this)
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext) = ScreenStackHeaderConfig(reactContext)

    override fun addView(parent: ScreenStackHeaderConfig, child: View, index: Int) {
        if (child !is ScreenStackHeaderSubview) {
            throw JSApplicationCausedNativeException(
                "Config children should be of type " + ScreenStackHeaderSubviewManager.REACT_CLASS
            )
        }
        parent.addConfigSubview(child, index)
    }

    override fun onDropViewInstance(@Nonnull view: ScreenStackHeaderConfig) {
        view.destroy()
    }

    override fun removeAllViews(parent: ScreenStackHeaderConfig) {
        parent.removeAllConfigSubviews()
    }

    override fun removeViewAt(parent: ScreenStackHeaderConfig, index: Int) {
        parent.removeConfigSubview(index)
    }

    override fun getChildCount(parent: ScreenStackHeaderConfig): Int = parent.configSubviewsCount

    override fun getChildAt(parent: ScreenStackHeaderConfig, index: Int): View = parent.getConfigSubview(index)

    override fun needsCustomLayoutForChildren() = true

    override fun onAfterUpdateTransaction(parent: ScreenStackHeaderConfig) {
        super.onAfterUpdateTransaction(parent)
        parent.onUpdate()
    }

    @ReactProp(name = "title")
    override fun setTitle(config: ScreenStackHeaderConfig, title: String?) {
        config.setTitle(title)
    }

    @ReactProp(name = "titleFontFamily")
    override fun setTitleFontFamily(config: ScreenStackHeaderConfig, titleFontFamily: String?) {
        config.setTitleFontFamily(titleFontFamily)
    }

    @ReactProp(name = "titleFontSize")
    override fun setTitleFontSize(config: ScreenStackHeaderConfig, titleFontSize: Int) {
        config.setTitleFontSize(titleFontSize.toFloat())
    }

    @ReactProp(name = "titleFontWeight")
    override fun setTitleFontWeight(config: ScreenStackHeaderConfig, titleFontWeight: String?) {
        config.setTitleFontWeight(titleFontWeight)
    }

    @ReactProp(name = "titleColor", customType = "Color")
    override fun setTitleColor(config: ScreenStackHeaderConfig, titleColor: Int?) {
        if (titleColor != null) {
            config.setTitleColor(titleColor)
        }
    }

    @ReactProp(name = "backgroundColor", customType = "Color")
    override fun setBackgroundColor(config: ScreenStackHeaderConfig, backgroundColor: Int?) {
        config.setBackgroundColor(backgroundColor)
    }

    @ReactProp(name = "hideShadow")
    override fun setHideShadow(config: ScreenStackHeaderConfig, hideShadow: Boolean) {
        config.setHideShadow(hideShadow)
    }

    @ReactProp(name = "hideBackButton")
    override fun setHideBackButton(config: ScreenStackHeaderConfig, hideBackButton: Boolean) {
        config.setHideBackButton(hideBackButton)
    }

    @ReactProp(name = "topInsetEnabled")
    override fun setTopInsetEnabled(config: ScreenStackHeaderConfig, topInsetEnabled: Boolean) {
        config.setTopInsetEnabled(topInsetEnabled)
    }

    @ReactProp(name = "color", customType = "Color")
    override fun setColor(config: ScreenStackHeaderConfig, color: Int?) {
        config.setTintColor(color ?: 0)
    }

    @ReactProp(name = "hidden")
    override fun setHidden(config: ScreenStackHeaderConfig, hidden: Boolean) {
        config.setHidden(hidden)
    }

    @ReactProp(name = "translucent")
    override fun setTranslucent(config: ScreenStackHeaderConfig, translucent: Boolean) {
        config.setTranslucent(translucent)
    }

    @ReactProp(name = "backButtonInCustomView")
    override fun setBackButtonInCustomView(
        config: ScreenStackHeaderConfig,
        backButtonInCustomView: Boolean
    ) {
        config.setBackButtonInCustomView(backButtonInCustomView)
    }

    @ReactProp(name = "direction")
    override fun setDirection(config: ScreenStackHeaderConfig, direction: String?) {
        config.setDirection(direction)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
        return MapBuilder.builder<String, Any>()
            .put("onAttached", MapBuilder.of("registrationName", "onAttached"))
            .put("onDetached", MapBuilder.of("registrationName", "onDetached"))
            .build()
    }

    protected override fun getDelegate(): ViewManagerDelegate<ScreenStackHeaderConfig> = mDelegate

    companion object {
        const val REACT_CLASS = "RNSScreenStackHeaderConfig"
    }

    // TODO: Find better way to handle platform specific props
    private fun logNotAvailable(propName: String) {
        Log.w("RN SCREENS", "$propName prop is not available on Android")
    }

    override fun setBackTitle(view: ScreenStackHeaderConfig?, value: String?) {
        logNotAvailable("backTitle")
    }

    override fun setBackTitleFontFamily(view: ScreenStackHeaderConfig?, value: String?) {
        logNotAvailable("backTitleFontFamily")
    }

    override fun setBackTitleFontSize(view: ScreenStackHeaderConfig?, value: Int) {
        logNotAvailable("backTitleFontSize")
    }

    override fun setLargeTitle(view: ScreenStackHeaderConfig?, value: Boolean) {
        logNotAvailable("largeTitle")
    }

    override fun setLargeTitleFontFamily(view: ScreenStackHeaderConfig?, value: String?) {
        logNotAvailable("largeTitleFontFamily")
    }

    override fun setLargeTitleFontSize(view: ScreenStackHeaderConfig?, value: Int) {
        logNotAvailable("largeTitleFontSize")
    }

    override fun setLargeTitleFontWeight(view: ScreenStackHeaderConfig?, value: String?) {
        logNotAvailable("largeTitleFontWeight")
    }

    override fun setLargeTitleBackgroundColor(view: ScreenStackHeaderConfig?, value: Int?) {
        logNotAvailable("largeTitleBackgroundColor")
    }

    override fun setLargeTitleHideShadow(view: ScreenStackHeaderConfig?, value: Boolean) {
        logNotAvailable("largeTitleHideShadow")
    }

    override fun setLargeTitleColor(view: ScreenStackHeaderConfig?, value: Int?) {
        logNotAvailable("largeTitleColor")
    }

    override fun setDisableBackButtonMenu(view: ScreenStackHeaderConfig?, value: Boolean) {
        logNotAvailable("disableBackButtonMenu")
    }
}
