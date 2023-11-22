package com.reactnativepagerview

import android.view.View
import android.view.ViewGroup
import androidx.viewpager2.widget.ViewPager2
import androidx.viewpager2.widget.ViewPager2.OnPageChangeCallback
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.EventDispatcher
import com.reactnativepagerview.event.PageScrollEvent
import com.reactnativepagerview.event.PageScrollStateChangedEvent
import com.reactnativepagerview.event.PageSelectedEvent


class PagerViewViewManager : ViewGroupManager<NestedScrollableHost>() {
    private lateinit var eventDispatcher: EventDispatcher

    override fun getName(): String {
        return PagerViewViewManagerImpl.NAME
    }

    override fun createViewInstance(reactContext: ThemedReactContext): NestedScrollableHost {
        val host = NestedScrollableHost(reactContext)
        host.id = View.generateViewId()
        host.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        host.isSaveEnabled = false
        val vp = ViewPager2(reactContext)
        vp.adapter = ViewPagerAdapter()
        //https://github.com/callstack/react-native-viewpager/issues/183
        vp.isSaveEnabled = false
        eventDispatcher = reactContext.getNativeModule(UIManagerModule::class.java)!!.eventDispatcher

        vp.post {
            vp.registerOnPageChangeCallback(object : OnPageChangeCallback() {
                override fun onPageScrolled(position: Int, positionOffset: Float, positionOffsetPixels: Int) {
                    super.onPageScrolled(position, positionOffset, positionOffsetPixels)
                    eventDispatcher.dispatchEvent(
                            PageScrollEvent(host.id, position, positionOffset))
                }

                override fun onPageSelected(position: Int) {
                    super.onPageSelected(position)
                    eventDispatcher.dispatchEvent(
                            PageSelectedEvent(host.id, position))
                }

                override fun onPageScrollStateChanged(state: Int) {
                    super.onPageScrollStateChanged(state)
                    val pageScrollState: String = when (state) {
                        ViewPager2.SCROLL_STATE_IDLE -> "idle"
                        ViewPager2.SCROLL_STATE_DRAGGING -> "dragging"
                        ViewPager2.SCROLL_STATE_SETTLING -> "settling"
                        else -> throw IllegalStateException("Unsupported pageScrollState")
                    }
                    eventDispatcher.dispatchEvent(
                            PageScrollStateChangedEvent(host.id, pageScrollState))
                }
            })

            eventDispatcher.dispatchEvent(PageSelectedEvent(host.id, vp.currentItem))
        }
        host.addView(vp)
        return host
    }

    override fun addView(host: NestedScrollableHost, child: View?, index: Int) {
        PagerViewViewManagerImpl.addView(host, child, index)
    }

    override fun getChildCount(parent: NestedScrollableHost) = PagerViewViewManagerImpl.getChildCount(parent)

    override fun getChildAt(parent: NestedScrollableHost, index: Int): View {
        return PagerViewViewManagerImpl.getChildAt(parent, index)
    }

    override fun removeView(parent: NestedScrollableHost, view: View) {
        PagerViewViewManagerImpl.removeView(parent, view)
    }

    override fun removeAllViews(parent: NestedScrollableHost) {
        PagerViewViewManagerImpl.removeAllViews(parent)
    }

    override fun removeViewAt(parent: NestedScrollableHost, index: Int) {
        PagerViewViewManagerImpl.removeViewAt(parent, index)
    }

    override fun needsCustomLayoutForChildren(): Boolean {
        return PagerViewViewManagerImpl.needsCustomLayoutForChildren()
    }

    @ReactProp(name = "scrollEnabled", defaultBoolean = true)
    fun setScrollEnabled(host: NestedScrollableHost, value: Boolean) {
        PagerViewViewManagerImpl.setScrollEnabled(host, value)
    }

    @ReactProp(name = "initialPage", defaultInt = 0)
    fun setInitialPage(host: NestedScrollableHost, value: Int) {
        PagerViewViewManagerImpl.setInitialPage(host, value)
    }

    @ReactProp(name = "orientation")
    fun setOrientation(host: NestedScrollableHost, value: String) {
        PagerViewViewManagerImpl.setOrientation(host, value)
    }

    @ReactProp(name = "offscreenPageLimit", defaultInt = ViewPager2.OFFSCREEN_PAGE_LIMIT_DEFAULT)
    operator fun set(host: NestedScrollableHost, value: Int) {
        PagerViewViewManagerImpl.setOffscreenPageLimit(host, value)
    }

    @ReactProp(name = "overScrollMode")
    fun setOverScrollMode(host: NestedScrollableHost, value: String) {
        PagerViewViewManagerImpl.setOverScrollMode(host, value)
    }

    @ReactProp(name = "layoutDirection")
    fun setLayoutDirection(host: NestedScrollableHost, value: String) {
        PagerViewViewManagerImpl.setLayoutDirection(host, value)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Map<String, String>> {
        return MapBuilder.of(
                PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
                PageScrollStateChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScrollStateChanged"),
                PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected"))
    }

    override fun receiveCommand(root: NestedScrollableHost, commandId: String?, args: ReadableArray?) {
        super.receiveCommand(root, commandId, args)
        val view = PagerViewViewManagerImpl.getViewPager(root)
        Assertions.assertNotNull(view)
        Assertions.assertNotNull(args)
        val childCount = view.adapter?.itemCount

        when (commandId) {
            COMMAND_SET_PAGE, COMMAND_SET_PAGE_WITHOUT_ANIMATION -> {
                val pageIndex = args!!.getInt(0)
                val canScroll = childCount != null && childCount > 0 && pageIndex >= 0 && pageIndex < childCount
                if (canScroll) {
                    val scrollWithAnimation = commandId == COMMAND_SET_PAGE
                    PagerViewViewManagerImpl.setCurrentItem(view, pageIndex, scrollWithAnimation)
                }
            }
            COMMAND_SET_SCROLL_ENABLED -> {
                view.isUserInputEnabled = args!!.getBoolean(0)
            }
            else -> throw IllegalArgumentException(String.format(
                    "Unsupported command %d received by %s.",
                    commandId,
                    javaClass.simpleName))
        }
    }

    @ReactProp(name = "pageMargin", defaultInt = 0)
    fun setPageMargin(host: NestedScrollableHost, margin: Int) {
        PagerViewViewManagerImpl.setPageMargin(host, margin)
    }

    companion object {
        private const val COMMAND_SET_PAGE = "setPage"
        private const val COMMAND_SET_PAGE_WITHOUT_ANIMATION = "setPageWithoutAnimation"
        private const val COMMAND_SET_SCROLL_ENABLED = "setScrollEnabledImperatively"
    }
}

