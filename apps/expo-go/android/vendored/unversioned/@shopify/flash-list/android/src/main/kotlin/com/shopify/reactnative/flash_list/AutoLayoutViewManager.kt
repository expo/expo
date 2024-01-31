package com.shopify.reactnative.flash_list

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.facebook.react.common.MapBuilder
import kotlin.math.roundToInt

/** ViewManager for AutoLayoutView - Container for all RecyclerListView children. Automatically removes all gaps and overlaps for GridLayouts with flexible spans.
 * Note: This cannot work for masonry layouts i.e, pinterest like layout */
@ReactModule(name = AutoLayoutViewManager.REACT_CLASS)
class AutoLayoutViewManager: ReactViewManager() {

    companion object {
        const val REACT_CLASS = "AutoLayoutView"
    }

    override fun getName(): String {
        return REACT_CLASS
    }

    override fun createViewInstance(context: ThemedReactContext): ReactViewGroup {
        return AutoLayoutView(context).also { it.pixelDensity = context.resources.displayMetrics.density.toDouble() }
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return MapBuilder.builder<String, Any>().put(
                "onBlankAreaEvent",
                MapBuilder.of(
                        "registrationName", "onBlankAreaEvent")
        ).build();
    }

    @ReactProp(name = "horizontal")
    fun setHorizontal(view: AutoLayoutView, isHorizontal: Boolean) {
        view.alShadow.horizontal = isHorizontal
    }

    @ReactProp(name = "disableAutoLayout")
    fun setDisableAutoLayout(view: AutoLayoutView, disableAutoLayout: Boolean) {
        view.disableAutoLayout = disableAutoLayout
    }

    @ReactProp(name = "scrollOffset")
    fun setScrollOffset(view: AutoLayoutView, scrollOffset: Double) {
        view.alShadow.scrollOffset = convertToPixelLayout(scrollOffset, view.pixelDensity)
    }

    @ReactProp(name = "windowSize")
    fun setWindowSize(view: AutoLayoutView, windowSize: Double) {
        view.alShadow.windowSize = convertToPixelLayout(windowSize, view.pixelDensity)
    }

    @ReactProp(name = "renderAheadOffset")
    fun setRenderAheadOffset(view: AutoLayoutView, renderOffset: Double) {
        view.alShadow.renderOffset = convertToPixelLayout(renderOffset, view.pixelDensity)
    }

    @ReactProp(name = "enableInstrumentation")
    fun setEnableInstrumentation(view: AutoLayoutView, enableInstrumentation: Boolean) {
        view.enableInstrumentation = enableInstrumentation
    }

    private fun convertToPixelLayout(dp: Double, density: Double): Int {
        return (dp * density).roundToInt()
    }
}
