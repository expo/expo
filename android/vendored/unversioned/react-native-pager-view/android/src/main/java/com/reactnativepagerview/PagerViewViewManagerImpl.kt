package com.reactnativepagerview

import android.view.View
import androidx.viewpager2.widget.ViewPager2
import com.facebook.react.uimanager.PixelUtil

object PagerViewViewManagerImpl {
    const val NAME = "RNCViewPager"

    fun getViewPager(view: NestedScrollableHost): ViewPager2 {
        if (view.getChildAt(0) is ViewPager2) {
            return view.getChildAt(0) as ViewPager2
        } else {
            throw ClassNotFoundException("Could not retrieve ViewPager2 instance")
        }
    }

    fun setCurrentItem(view: ViewPager2, selectedTab: Int, scrollSmooth: Boolean) {
        refreshViewChildrenLayout(view)
        view.setCurrentItem(selectedTab, scrollSmooth)
    }

    fun addView(host: NestedScrollableHost, child: View?, index: Int) {
        if (child == null) {
            return
        }
        val parent = getViewPager(host)

        (parent.adapter as ViewPagerAdapter?)?.addChild(child, index);

        if (parent.currentItem == index) {
            // Solves https://github.com/callstack/react-native-pager-view/issues/219
            // Required so ViewPager actually displays first dynamically added child
            // (otherwise a white screen is shown until the next user interaction).
            // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
            refreshViewChildrenLayout(parent)
        }

        if (!host.didSetInitialIndex && host.initialIndex == index) {
            host.didSetInitialIndex = true
            setCurrentItem(parent, index, false)
        }
    }

    fun getChildCount(parent: NestedScrollableHost) = getViewPager(parent).adapter?.itemCount ?: 0

    fun getChildAt(parent: NestedScrollableHost, index: Int): View {
        val view = getViewPager(parent)
        return (view.adapter as ViewPagerAdapter?)!!.getChildAt(index)
    }

    fun removeView(parent: NestedScrollableHost, view: View) {
        val pager = getViewPager(parent)
        (pager.adapter as ViewPagerAdapter?)?.removeChild(view)

        // Required so ViewPager actually animates the removed view right away (otherwise
        // a white screen is shown until the next user interaction).
        // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
        refreshViewChildrenLayout(pager)
    }

    fun removeAllViews(parent: NestedScrollableHost) {
        val pager = getViewPager(parent)
        pager.isUserInputEnabled = false
        val adapter = pager.adapter as ViewPagerAdapter?
        adapter?.removeAll()
    }

    fun removeViewAt(parent: NestedScrollableHost, index: Int) {
        val pager = getViewPager(parent)
        val adapter = pager.adapter as ViewPagerAdapter?
        adapter?.removeChildAt(index)

        // Required so ViewPager actually animates the removed view right away (otherwise
        // a white screen is shown until the next user interaction).
        // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
        refreshViewChildrenLayout(pager)
    }

    fun needsCustomLayoutForChildren(): Boolean {
        return true
    }

    fun setScrollEnabled(host: NestedScrollableHost, value: Boolean) {
        getViewPager(host).isUserInputEnabled = value
    }

    fun setLayoutDirection(host: NestedScrollableHost, value: String) {
        val view = getViewPager(host)
        when (value) {
            "rtl" -> {
                view.layoutDirection = View.LAYOUT_DIRECTION_RTL
            }
            else -> {
                view.layoutDirection = View.LAYOUT_DIRECTION_LTR
            }
        }
    }

    fun setInitialPage(host: NestedScrollableHost, value: Int) {
        val view = getViewPager(host)
        //https://github.com/callstack/react-native-pager-view/issues/456
        //Initial index should be set only once.
        if (host.initialIndex === null) {
            host.initialIndex = value
            view.post {
                host.didSetInitialIndex = true
            }
        }
    }

    fun setOrientation(host: NestedScrollableHost, value: String) {
        getViewPager(host).orientation = if (value == "vertical") ViewPager2.ORIENTATION_VERTICAL else ViewPager2.ORIENTATION_HORIZONTAL
    }

    fun setOffscreenPageLimit(host: NestedScrollableHost, value: Int) {
        getViewPager(host).offscreenPageLimit = value
    }

    fun setOverScrollMode(host: NestedScrollableHost, value: String) {
        val child = getViewPager(host).getChildAt(0)
        when (value) {
            "never" -> {
                child.overScrollMode = ViewPager2.OVER_SCROLL_NEVER
            }
            "always" -> {
                child.overScrollMode = ViewPager2.OVER_SCROLL_ALWAYS
            }
            else -> {
                child.overScrollMode = ViewPager2.OVER_SCROLL_IF_CONTENT_SCROLLS
            }
        }
    }

    fun setPageMargin(host: NestedScrollableHost, margin: Int) {
        val pager = getViewPager(host)
        val pageMargin = PixelUtil.toPixelFromDIP(margin.toDouble()).toInt()
        /**
         * Don't use MarginPageTransformer to be able to support negative margins
         */
        pager.setPageTransformer { page, position ->
            val offset = pageMargin * position
            if (pager.orientation == ViewPager2.ORIENTATION_HORIZONTAL) {
                val isRTL = pager.layoutDirection == View.LAYOUT_DIRECTION_RTL
                page.translationX = if (isRTL) -offset else offset
            } else {
                page.translationY = offset
            }
        }
    }

    private fun refreshViewChildrenLayout(view: View) {
        view.post {
            view.measure(
                    View.MeasureSpec.makeMeasureSpec(view.width, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(view.height, View.MeasureSpec.EXACTLY))
            view.layout(view.left, view.top, view.right, view.bottom)
        }
    }
}