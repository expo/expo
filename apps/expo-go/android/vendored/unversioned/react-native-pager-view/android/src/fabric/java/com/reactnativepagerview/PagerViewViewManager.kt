package com.reactnativepagerview

import android.view.View
import android.view.ViewGroup
import androidx.viewpager2.widget.ViewPager2
import androidx.viewpager2.widget.ViewPager2.OnPageChangeCallback
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.*
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.RNCViewPagerManagerDelegate
import com.facebook.react.viewmanagers.RNCViewPagerManagerInterface
import com.facebook.soloader.SoLoader
import com.reactnativepagerview.event.PageScrollEvent
import com.reactnativepagerview.event.PageScrollStateChangedEvent
import com.reactnativepagerview.event.PageSelectedEvent


@ReactModule(name = PagerViewViewManagerImpl.NAME)
class PagerViewViewManager : ViewGroupManager<NestedScrollableHost>(), RNCViewPagerManagerInterface<NestedScrollableHost> {
    companion object {
        init {
            if (BuildConfig.CODEGEN_MODULE_REGISTRATION != null) {
                SoLoader.loadLibrary(BuildConfig.CODEGEN_MODULE_REGISTRATION)
            }
        }
    }

    private val mDelegate: ViewManagerDelegate<NestedScrollableHost> = RNCViewPagerManagerDelegate(this)

    override fun getDelegate() = mDelegate

    override fun getName(): String {
        return PagerViewViewManagerImpl.NAME
    }

    override fun receiveCommand(root: NestedScrollableHost, commandId: String?, args: ReadableArray?) {
        mDelegate.receiveCommand(root, commandId, args)
    }

    public override fun createViewInstance(reactContext: ThemedReactContext): NestedScrollableHost {
        val host = NestedScrollableHost(reactContext)
        host.id = View.generateViewId()
        host.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        host.isSaveEnabled = false
        val vp = ViewPager2(reactContext)
        vp.adapter = ViewPagerAdapter()
        //https://github.com/callstack/react-native-viewpager/issues/183
        vp.isSaveEnabled = false

        vp.post {
            vp.registerOnPageChangeCallback(object : OnPageChangeCallback() {
                override fun onPageScrolled(position: Int, positionOffset: Float, positionOffsetPixels: Int) {
                    super.onPageScrolled(position, positionOffset, positionOffsetPixels)
                    UIManagerHelper.getEventDispatcherForReactTag(reactContext, host.id)?.dispatchEvent(
                            PageScrollEvent(host.id, position, positionOffset)
                    )
                }

                override fun onPageSelected(position: Int) {
                    super.onPageSelected(position)
                    UIManagerHelper.getEventDispatcherForReactTag(reactContext, host.id)?.dispatchEvent(
                            PageSelectedEvent(host.id, position)
                    )
                }

                override fun onPageScrollStateChanged(state: Int) {
                    super.onPageScrollStateChanged(state)
                    val pageScrollState: String = when (state) {
                        ViewPager2.SCROLL_STATE_IDLE -> "idle"
                        ViewPager2.SCROLL_STATE_DRAGGING -> "dragging"
                        ViewPager2.SCROLL_STATE_SETTLING -> "settling"
                        else -> throw IllegalStateException("Unsupported pageScrollState")
                    }
                    UIManagerHelper.getEventDispatcherForReactTag(reactContext, host.id)?.dispatchEvent(
                            PageScrollStateChangedEvent(host.id, pageScrollState)
                    )
                }
            })
            UIManagerHelper.getEventDispatcherForReactTag(reactContext, host.id)?.dispatchEvent(
                    PageSelectedEvent(host.id, vp.currentItem)
            )
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
    override fun setScrollEnabled(view: NestedScrollableHost?, value: Boolean) {
        if (view != null) {
            PagerViewViewManagerImpl.setScrollEnabled(view, value)
        }
    }

    @ReactProp(name = "layoutDirection")
    override fun setLayoutDirection(view: NestedScrollableHost?, value: String?) {
        if (view != null && value != null) {
            PagerViewViewManagerImpl.setLayoutDirection(view, value)
        }
    }

    @ReactProp(name = "initialPage", defaultInt = 0)
    override fun setInitialPage(view: NestedScrollableHost?, value: Int) {
        if (view != null) {
            PagerViewViewManagerImpl.setInitialPage(view, value)
        }
    }

    @ReactProp(name = "orientation")
    override fun setOrientation(view: NestedScrollableHost?, value: String?) {
        if (view != null && value != null) {
            PagerViewViewManagerImpl.setOrientation(view, value)
        }
    }

    @ReactProp(name = "offscreenPageLimit", defaultInt = ViewPager2.OFFSCREEN_PAGE_LIMIT_DEFAULT)
    override fun setOffscreenPageLimit(view: NestedScrollableHost?, value: Int) {
        if (view != null) {
            PagerViewViewManagerImpl.setOffscreenPageLimit(view, value)
        }
    }

    @ReactProp(name = "pageMargin", defaultInt = 0)
    override fun setPageMargin(view: NestedScrollableHost?, value: Int) {
        if (view != null) {
            PagerViewViewManagerImpl.setPageMargin(view, value)
        }
    }

    @ReactProp(name = "overScrollMode")
    override fun setOverScrollMode(view: NestedScrollableHost?, value: String?) {
        if (view != null && value != null) {
            PagerViewViewManagerImpl.setOverScrollMode(view, value)
        }
    }

    @ReactProp(name = "overdrag")
    override fun setOverdrag(view: NestedScrollableHost?, value: Boolean) {
        return
    }

    @ReactProp(name = "keyboardDismissMode")
    override fun setKeyboardDismissMode(view: NestedScrollableHost?, value: String?) {
        return
    }

    fun goTo(root: NestedScrollableHost?, selectedPage: Int, scrollWithAnimation: Boolean) {
        if (root == null) {
            return
        }
        val view = PagerViewViewManagerImpl.getViewPager(root)
        Assertions.assertNotNull(view)
        val childCount = view.adapter?.itemCount
        val canScroll = childCount != null && childCount > 0 && selectedPage >= 0 && selectedPage < childCount
        if (canScroll) {
            PagerViewViewManagerImpl.setCurrentItem(view, selectedPage, scrollWithAnimation)
        }
    }

    override fun setPage(view: NestedScrollableHost?, selectedPage: Int) {
        goTo(view, selectedPage, true)
    }

    override fun setPageWithoutAnimation(view: NestedScrollableHost?, selectedPage: Int) {
        goTo(view, selectedPage, false)
    }

    override fun setScrollEnabledImperatively(view: NestedScrollableHost?, scrollEnabled: Boolean) {
        if (view != null) {
            PagerViewViewManagerImpl.setScrollEnabled(view, scrollEnabled)
        }
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Map<String, String>> {
        return MapBuilder.of(
                PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
                PageScrollStateChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScrollStateChanged"),
                PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected"))
    }
}