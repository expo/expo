package abi47_0_0.host.exp.exponent.modules.api.components.pagerview

import android.view.View
import android.view.ViewGroup
import androidx.viewpager2.widget.ViewPager2
import androidx.viewpager2.widget.ViewPager2.OnPageChangeCallback
import com.facebook.infer.annotation.Assertions
import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.com.facebook.react.common.MapBuilder
import abi47_0_0.com.facebook.react.uimanager.PixelUtil
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi47_0_0.com.facebook.react.uimanager.UIManagerModule
import abi47_0_0.com.facebook.react.uimanager.ViewGroupManager
import abi47_0_0.com.facebook.react.uimanager.annotations.ReactProp
import abi47_0_0.com.facebook.react.uimanager.events.EventDispatcher
import abi47_0_0.host.exp.exponent.modules.api.components.pagerview.event.PageScrollEvent
import abi47_0_0.host.exp.exponent.modules.api.components.pagerview.event.PageScrollStateChangedEvent
import abi47_0_0.host.exp.exponent.modules.api.components.pagerview.event.PageSelectedEvent

class PagerViewViewManager : ViewGroupManager<NestedScrollableHost>() {
  private lateinit var eventDispatcher: EventDispatcher

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(reactContext: ThemedReactContext): NestedScrollableHost {
    val host = NestedScrollableHost(reactContext)
    host.id = View.generateViewId()
    host.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    host.isSaveEnabled = false
    val vp = ViewPager2(reactContext)
    vp.adapter = ViewPagerAdapter()
    // https://github.com/callstack/react-native-viewpager/issues/183
    vp.isSaveEnabled = false
    eventDispatcher = reactContext.getNativeModule(UIManagerModule::class.java)!!.eventDispatcher

    vp.post {
      vp.registerOnPageChangeCallback(object : OnPageChangeCallback() {
        override fun onPageScrolled(position: Int, positionOffset: Float, positionOffsetPixels: Int) {
          super.onPageScrolled(position, positionOffset, positionOffsetPixels)
          eventDispatcher.dispatchEvent(
            PageScrollEvent(host.id, position, positionOffset)
          )
        }

        override fun onPageSelected(position: Int) {
          super.onPageSelected(position)
          eventDispatcher.dispatchEvent(
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
          eventDispatcher.dispatchEvent(
            PageScrollStateChangedEvent(host.id, pageScrollState)
          )
        }
      })

      eventDispatcher.dispatchEvent(PageSelectedEvent(host.id, vp.currentItem))
    }
    host.addView(vp)
    return host
  }

  private fun getViewPager(view: NestedScrollableHost): ViewPager2 {
    if (view.getChildAt(0) is ViewPager2) {
      return view.getChildAt(0) as ViewPager2
    } else {
      throw ClassNotFoundException("Could not retrieve ViewPager2 instance")
    }
  }

  private fun setCurrentItem(view: ViewPager2, selectedTab: Int, scrollSmooth: Boolean) {
    refreshViewChildrenLayout(view)
    view.setCurrentItem(selectedTab, scrollSmooth)
  }

  override fun addView(host: NestedScrollableHost, child: View?, index: Int) {
    if (child == null) {
      return
    }
    val parent = getViewPager(host)

    (parent.adapter as ViewPagerAdapter?)?.addChild(child, index)

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

  override fun getChildCount(parent: NestedScrollableHost) = getViewPager(parent).adapter?.itemCount ?: 0

  override fun getChildAt(parent: NestedScrollableHost, index: Int): View {
    val view = getViewPager(parent)
    return (view.adapter as ViewPagerAdapter?)!!.getChildAt(index)
  }

  override fun removeView(parent: NestedScrollableHost, view: View) {
    val pager = getViewPager(parent)
    (pager.adapter as ViewPagerAdapter?)?.removeChild(view)

    // Required so ViewPager actually animates the removed view right away (otherwise
    // a white screen is shown until the next user interaction).
    // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
    refreshViewChildrenLayout(pager)
  }

  override fun removeAllViews(parent: NestedScrollableHost) {
    val pager = getViewPager(parent)
    pager.isUserInputEnabled = false
    val adapter = pager.adapter as ViewPagerAdapter?
    adapter?.removeAll()
  }

  override fun removeViewAt(parent: NestedScrollableHost, index: Int) {
    val pager = getViewPager(parent)
    val adapter = pager.adapter as ViewPagerAdapter?
    adapter?.removeChildAt(index)

    // Required so ViewPager actually animates the removed view right away (otherwise
    // a white screen is shown until the next user interaction).
    // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
    refreshViewChildrenLayout(pager)
  }

  override fun needsCustomLayoutForChildren(): Boolean {
    return true
  }

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  fun setScrollEnabled(host: NestedScrollableHost, value: Boolean) {
    getViewPager(host).isUserInputEnabled = value
  }

  @ReactProp(name = "initialPage", defaultInt = 0)
  fun setInitialPage(host: NestedScrollableHost, value: Int) {
    val view = getViewPager(host)
    // https://github.com/callstack/react-native-pager-view/issues/456
    // Initial index should be set only once.
    if (host.initialIndex === null) {
      host.initialIndex = value
      view.post {
        host.didSetInitialIndex = true
      }
    }
  }

  @ReactProp(name = "orientation")
  fun setOrientation(host: NestedScrollableHost, value: String) {
    getViewPager(host).orientation = if (value == "vertical") ViewPager2.ORIENTATION_VERTICAL else ViewPager2.ORIENTATION_HORIZONTAL
  }

  @ReactProp(name = "offscreenPageLimit", defaultInt = ViewPager2.OFFSCREEN_PAGE_LIMIT_DEFAULT)
  operator fun set(host: NestedScrollableHost, value: Int) {
    getViewPager(host).offscreenPageLimit = value
  }

  @ReactProp(name = "overScrollMode")
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

  @ReactProp(name = "layoutDirection")
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

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Map<String, String>> {
    return MapBuilder.of(
      PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
      PageScrollStateChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScrollStateChanged"),
      PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected")
    )
  }

  override fun getCommandsMap(): Map<String, Int>? {
    return MapBuilder.of(
      "setPage",
      COMMAND_SET_PAGE,
      "setPageWithoutAnimation",
      COMMAND_SET_PAGE_WITHOUT_ANIMATION,
      "setScrollEnabled",
      COMMAND_SET_SCROLL_ENABLED
    )
  }

  override fun receiveCommand(root: NestedScrollableHost, commandId: Int, args: ReadableArray?) {
    super.receiveCommand(root, commandId, args)
    val view = getViewPager(root)
    Assertions.assertNotNull(view)
    Assertions.assertNotNull(args)
    val childCount = view.adapter?.itemCount

    when (commandId) {
      COMMAND_SET_PAGE, COMMAND_SET_PAGE_WITHOUT_ANIMATION -> {
        val pageIndex = args!!.getInt(0)
        val canScroll = childCount != null && childCount > 0 && pageIndex >= 0 && pageIndex < childCount
        if (canScroll) {
          val scrollWithAnimation = commandId == COMMAND_SET_PAGE
          setCurrentItem(view, pageIndex, scrollWithAnimation)
          eventDispatcher.dispatchEvent(PageSelectedEvent(root.id, pageIndex))
        }
      }
      COMMAND_SET_SCROLL_ENABLED -> {
        view.isUserInputEnabled = args!!.getBoolean(0)
      }
      else -> throw IllegalArgumentException(
        String.format(
          "Unsupported command %d received by %s.",
          commandId,
          javaClass.simpleName
        )
      )
    }
  }

  @ReactProp(name = "pageMargin", defaultFloat = 0F)
  fun setPageMargin(host: NestedScrollableHost, margin: Float) {
    val pager = getViewPager(host)
    val pageMargin = PixelUtil.toPixelFromDIP(margin).toInt()
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
        View.MeasureSpec.makeMeasureSpec(view.height, View.MeasureSpec.EXACTLY)
      )
      view.layout(view.left, view.top, view.right, view.bottom)
    }
  }

  companion object {
    private const val REACT_CLASS = "RNCViewPager"
    private const val COMMAND_SET_PAGE = 1
    private const val COMMAND_SET_PAGE_WITHOUT_ANIMATION = 2
    private const val COMMAND_SET_SCROLL_ENABLED = 3
  }
}
