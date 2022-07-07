package com.shopify.reactnative.flash_list.models

import com.shopify.reactnative.flash_list.CellContainer

class Rect (h: Int? = 0, w: Int? = 0): CellContainer {
    private var left = 0
    private var right = 0
    private var top = 0
    private var bottom = 0
    private var height = 0
    private var width = 0

    override fun setIndex(value: Int) {
    }

    override fun getIndex(): Int {
        return 0
    }

    override fun setLeft(value: Int) {
        left = value
    }

    override fun getLeft(): Int {
        return left
    }

    override fun setTop(value: Int) {
        top = value
    }

    override fun getTop(): Int {
        return top
    }

    override fun setRight(value: Int) {
        right = value
    }

    override fun getRight(): Int {
        return right
    }

    override fun setBottom(value: Int) {
        bottom = value
    }

    override fun getBottom(): Int {
        return bottom
    }

    override fun getHeight(): Int {
        return height
    }

    override fun getWidth(): Int {
        return width
    }
}
