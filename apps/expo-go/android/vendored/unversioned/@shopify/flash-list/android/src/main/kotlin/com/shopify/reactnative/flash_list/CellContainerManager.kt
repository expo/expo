package com.shopify.reactnative.flash_list

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = AutoLayoutViewManager.REACT_CLASS)
class CellContainerManager: ReactViewManager() {
    companion object {
        const val REACT_CLASS = "CellContainer"
    }

    override fun getName(): String {
        return REACT_CLASS
    }

    override fun createViewInstance(context: ThemedReactContext): ReactViewGroup {
        return CellContainerImpl(context)
    }

    @ReactProp(name = "index")
    fun setIndex(view: CellContainerImpl, index: Int) {
        view.index = index
    }
}
