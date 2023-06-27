package abi49_0_0.com.shopify.reactnative.flash_list

import android.content.Context
import abi49_0_0.com.facebook.react.views.view.ReactViewGroup

class CellContainerImpl(context: Context) : ReactViewGroup(context), CellContainer {
    private var index = -1
    override fun setIndex(value: Int) {
        index = value
    }

    override fun getIndex(): Int {
        return index
    }

}
