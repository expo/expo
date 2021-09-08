package versioned.host.exp.exponent.modules.api.components.pagerview

import android.view.View
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
import versioned.host.exp.exponent.modules.api.components.pagerview.event.PageScrollEvent
import versioned.host.exp.exponent.modules.api.components.pagerview.event.PageScrollStateChangedEvent
import versioned.host.exp.exponent.modules.api.components.pagerview.event.PageSelectedEvent


class PagerViewViewManager : ViewGroupManager<ViewPager2>() {
  private lateinit var eventDispatcher: EventDispatcher

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(reactContext: ThemedReactContext): ViewPager2 {
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
                  PageScrollEvent(vp.id, position, positionOffset))
        }

        override fun onPageSelected(position: Int) {
          super.onPageSelected(position)
          eventDispatcher.dispatchEvent(
                  PageSelectedEvent(vp.id, position))
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
                  PageScrollStateChangedEvent(vp.id, pageScrollState))
        }
      })

      eventDispatcher.dispatchEvent(PageSelectedEvent(vp.id, vp.currentItem))
    }

    return vp
  }

  private fun setCurrentItem(view: ViewPager2, selectedTab: Int, scrollSmooth: Boolean) {
    refreshViewChildrenLayout(view)
    view.setCurrentItem(selectedTab, scrollSmooth)
  }

  override fun addView(parent: ViewPager2, child: View?, index: Int) {
    if (child == null) {
      return
    }

    (parent.adapter as ViewPagerAdapter?)?.addChild(child, index);

    if (parent.currentItem == index) {
      // Solves https://github.com/callstack/react-native-pager-view/issues/219
      // Required so ViewPager actually displays first dynamically added child
      // (otherwise a white screen is shown until the next user interaction).
      // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
      refreshViewChildrenLayout(parent)
    }
  }

  override fun getChildCount(parent: ViewPager2): Int {
    return parent.adapter?.itemCount ?: 0;
  }

  override fun getChildAt(parent: ViewPager2, index: Int): View {
    return (parent.adapter as ViewPagerAdapter?)!!.getChildAt(index)
  }

  override fun removeView(parent: ViewPager2, view: View) {
    (parent.adapter as ViewPagerAdapter?)?.removeChild(view)

    // Required so ViewPager actually animates the removed view right away (otherwise 
    // a white screen is shown until the next user interaction).
    // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
    refreshViewChildrenLayout(parent)
  }

  override fun removeAllViews(parent: ViewPager2) {
    parent.isUserInputEnabled = false
    val adapter = parent.adapter as ViewPagerAdapter?
    adapter?.removeAll()
  }

  override fun removeViewAt(parent: ViewPager2, index: Int) {
    val adapter = parent.adapter as ViewPagerAdapter?
    adapter?.removeChildAt(index)

    // Required so ViewPager actually animates the removed view right away (otherwise 
    // a white screen is shown until the next user interaction).
    // https://github.com/facebook/react-native/issues/17968#issuecomment-697136929
    refreshViewChildrenLayout(parent)
  }

  override fun needsCustomLayoutForChildren(): Boolean {
    return true
  }

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  fun setScrollEnabled(viewPager: ViewPager2, value: Boolean) {
    viewPager.isUserInputEnabled = value
  }

  @ReactProp(name = "initialPage", defaultInt = 0)
  fun setInitialPage(viewPager: ViewPager2, value: Int) {
    viewPager.post {
      setCurrentItem(viewPager, value, false)
    }
  }

  @ReactProp(name = "orientation")
  fun setOrientation(viewPager: ViewPager2, value: String) {
    viewPager.orientation = if (value == "vertical") ViewPager2.ORIENTATION_VERTICAL else ViewPager2.ORIENTATION_HORIZONTAL
  }

  @ReactProp(name = "offscreenPageLimit", defaultInt = ViewPager2.OFFSCREEN_PAGE_LIMIT_DEFAULT)
  operator fun set(viewPager: ViewPager2, value: Int) {
    viewPager.offscreenPageLimit = value
  }

  @ReactProp(name = "overScrollMode")
  fun setOverScrollMode(viewPager: ViewPager2, value: String) {
    val child = viewPager.getChildAt(0)
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
  fun setLayoutDirection(viewPager: ViewPager2, value: String) {
    when (value) {
      "rtl" -> {
        viewPager.layoutDirection = View.LAYOUT_DIRECTION_RTL
      }
      else -> {
        viewPager.layoutDirection = View.LAYOUT_DIRECTION_LTR
      }
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Map<String, String>> {
    return MapBuilder.of(
      PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
      PageScrollStateChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScrollStateChanged"),
      PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected"))
  }

  override fun getCommandsMap(): Map<String, Int>? {
    return MapBuilder.of(
      "setPage",
      COMMAND_SET_PAGE,
      "setPageWithoutAnimation",
      COMMAND_SET_PAGE_WITHOUT_ANIMATION,
      "setScrollEnabled",
      COMMAND_SET_SCROLL_ENABLED)
  }

  override fun receiveCommand(root: ViewPager2, commandId: Int, args: ReadableArray?) {
    super.receiveCommand(root, commandId, args)
    Assertions.assertNotNull(root)
    Assertions.assertNotNull(args)
    val childCount = root.adapter?.itemCount

    when (commandId) {
      COMMAND_SET_PAGE, COMMAND_SET_PAGE_WITHOUT_ANIMATION -> {
        val pageIndex = args!!.getInt(0)
        val canScroll = childCount != null && childCount > 0 && pageIndex >= 0 && pageIndex < childCount
        if (canScroll) {
          val scrollWithAnimation = commandId == COMMAND_SET_PAGE
          setCurrentItem(root, pageIndex, scrollWithAnimation)
          eventDispatcher.dispatchEvent(PageSelectedEvent(root.id, pageIndex))
        }
      }
      COMMAND_SET_SCROLL_ENABLED -> {
        root.isUserInputEnabled = args!!.getBoolean(0)
      }
      else -> throw IllegalArgumentException(String.format(
        "Unsupported command %d received by %s.",
        commandId,
        javaClass.simpleName))
    }
  }

  @ReactProp(name = "pageMargin", defaultFloat = 0F)
  fun setPageMargin(pager: ViewPager2, margin: Float) {
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
              View.MeasureSpec.makeMeasureSpec(view.height, View.MeasureSpec.EXACTLY))
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

