package com.reactnativepagerview

import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import androidx.recyclerview.widget.RecyclerView.ViewHolder


class ViewPagerViewHolder private constructor(container: FrameLayout) : ViewHolder(container) {
    val container: FrameLayout
        get() = itemView as FrameLayout

    companion object {
        fun create(parent: ViewGroup): ViewPagerViewHolder {
            val container = FrameLayout(parent.context)
            container.layoutParams = ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT)
            container.isSaveEnabled = false
            return ViewPagerViewHolder(container)
        }
    }
}
