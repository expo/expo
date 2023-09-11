package abi49_0_0.com.shopify.reactnative.flash_list

import abi49_0_0.com.facebook.react.module.annotations.ReactModule
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp
import abi49_0_0.com.facebook.react.views.view.ReactViewGroup
import abi49_0_0.com.facebook.react.views.view.ReactViewManager

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
