package com.swmansion.rnscreens

import android.content.Context
import android.graphics.PorterDuff
import android.os.Build
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View.OnClickListener
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.fragment.app.Fragment
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.views.text.ReactTypefaceUtils
import com.swmansion.rnscreens.events.HeaderAttachedEvent
import com.swmansion.rnscreens.events.HeaderDetachedEvent

class ScreenStackHeaderConfig(context: Context) : ViewGroup(context) {
    private val mConfigSubviews = ArrayList<ScreenStackHeaderSubview>(3)
    val toolbar: CustomToolbar
    var mIsHidden = false
    private var headerTopInset: Int? = null
    private var mTitle: String? = null
    private var mTitleColor = 0
    private var mTitleFontFamily: String? = null
    private var mDirection: String? = null
    private var mTitleFontSize = 0f
    private var mTitleFontWeight = 0
    private var mBackgroundColor: Int? = null
    private var mIsBackButtonHidden = false
    private var mIsShadowHidden = false
    private var mDestroyed = false
    private var mBackButtonInCustomView = false
    private var mIsTopInsetEnabled = true
    private var mIsTranslucent = false
    private var mTintColor = 0
    private var mIsAttachedToWindow = false
    private val mDefaultStartInset: Int
    private val mDefaultStartInsetWithNavigation: Int
    private val mBackClickListener = OnClickListener {
        screenFragment?.let {
            val stack = screenStack
            if (stack != null && stack.rootScreen == it.screen) {
                val parentFragment = it.parentFragment
                if (parentFragment is ScreenStackFragment) {
                    if (parentFragment.screen.nativeBackButtonDismissalEnabled) {
                        parentFragment.dismiss()
                    } else {
                        parentFragment.dispatchHeaderBackButtonClickedEvent()
                    }
                }
            } else {
                if (it.screen.nativeBackButtonDismissalEnabled) {
                    it.dismiss()
                } else {
                    it.dispatchHeaderBackButtonClickedEvent()
                }
            }
        }
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        // no-op
    }

    fun destroy() {
        mDestroyed = true
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        mIsAttachedToWindow = true
        val surfaceId = UIManagerHelper.getSurfaceId(this)
        UIManagerHelper.getEventDispatcherForReactTag(context as ReactContext, id)
            ?.dispatchEvent(HeaderAttachedEvent(surfaceId, id))
        // we want to save the top inset before the status bar can be hidden, which would resolve in
        // inset being 0
        if (headerTopInset == null) {
            headerTopInset = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                rootWindowInsets.systemWindowInsetTop
            else
            // Hacky fallback for old android. Before Marshmallow, the status bar height was always 25
                (25 * resources.displayMetrics.density).toInt()
        }
        onUpdate()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        mIsAttachedToWindow = false
        val surfaceId = UIManagerHelper.getSurfaceId(this)
        UIManagerHelper.getEventDispatcherForReactTag(context as ReactContext, id)
            ?.dispatchEvent(HeaderDetachedEvent(surfaceId, id))
    }

    private val screen: Screen?
        get() = parent as? Screen
    private val screenStack: ScreenStack?
        get() = screen?.container as? ScreenStack
    val screenFragment: ScreenStackFragment?
        get() {
            val screen = parent
            if (screen is Screen) {
                val fragment: Fragment? = screen.fragment
                if (fragment is ScreenStackFragment) {
                    return fragment
                }
            }
            return null
        }

    fun onUpdate() {
        val stack = screenStack
        val isTop = stack == null || stack.topScreen == parent

        if (!mIsAttachedToWindow || !isTop || mDestroyed) {
            return
        }

        val activity = screenFragment?.activity as AppCompatActivity? ?: return
        if (mDirection != null) {
            if (mDirection == "rtl") {
                toolbar.layoutDirection = LAYOUT_DIRECTION_RTL
            } else if (mDirection == "ltr") {
                toolbar.layoutDirection = LAYOUT_DIRECTION_LTR
            }
        }

        // orientation and status bar management
        screen?.let {
            // we set the traits here too, not only when the prop for Screen is passed
            // because sometimes we don't have the Fragment and Activity available then yet, e.g. on the
            // first setting of props. Similar thing is done for Screens of ScreenContainers, but in
            // `onContainerUpdate` of their Fragment
            val reactContext = if (context is ReactContext) {
                context as ReactContext
            } else {
                it.fragmentWrapper?.tryGetContext()
            }
            ScreenWindowTraits.trySetWindowTraits(it, activity, reactContext)
        }

        if (mIsHidden) {
            if (toolbar.parent != null) {
                screenFragment?.removeToolbar()
            }
            return
        }

        if (toolbar.parent == null) {
            screenFragment?.setToolbar(toolbar)
        }

        if (mIsTopInsetEnabled) {
            headerTopInset.let {
                toolbar.setPadding(0, it ?: 0, 0, 0)
            }
        } else {
            if (toolbar.paddingTop > 0) {
                toolbar.setPadding(0, 0, 0, 0)
            }
        }

        activity.setSupportActionBar(toolbar)
        // non-null toolbar is set in the line above and it is used here
        val actionBar = requireNotNull(activity.supportActionBar)

        // Reset toolbar insets. By default we set symmetric inset for start and end to match iOS
        // implementation where both right and left icons are offset from the edge by default. We also
        // reset startWithNavigation inset which corresponds to the distance between navigation icon and
        // title. If title isn't set we clear that value few lines below to give more space to custom
        // center-mounted views.
        toolbar.contentInsetStartWithNavigation = mDefaultStartInsetWithNavigation
        toolbar.setContentInsetsRelative(mDefaultStartInset, mDefaultStartInset)

        // hide back button
        actionBar.setDisplayHomeAsUpEnabled(
            screenFragment?.canNavigateBack() == true && !mIsBackButtonHidden
        )

        // when setSupportActionBar is called a toolbar wrapper gets initialized that overwrites
        // navigation click listener. The default behavior set in the wrapper is to call into
        // menu options handlers, but we prefer the back handling logic to stay here instead.
        toolbar.setNavigationOnClickListener(mBackClickListener)

        // shadow
        screenFragment?.setToolbarShadowHidden(mIsShadowHidden)

        // translucent
        screenFragment?.setToolbarTranslucent(mIsTranslucent)

        // title
        actionBar.title = mTitle
        if (TextUtils.isEmpty(mTitle)) {
            // if title is empty we set start  navigation inset to 0 to give more space to custom rendered
            // views. When it is set to default it'd take up additional distance from the back button
            // which would impact the position of custom header views rendered at the center.
            toolbar.contentInsetStartWithNavigation = 0
        }

        val titleTextView = titleTextView
        if (mTitleColor != 0) {
            toolbar.setTitleTextColor(mTitleColor)
        }

        if (titleTextView != null) {
            if (mTitleFontFamily != null || mTitleFontWeight > 0) {
                val titleTypeface = ReactTypefaceUtils.applyStyles(
                    null, 0, mTitleFontWeight, mTitleFontFamily, context.assets
                )
                titleTextView.typeface = titleTypeface
            }
            if (mTitleFontSize > 0) {
                titleTextView.textSize = mTitleFontSize
            }
        }

        // background
        mBackgroundColor?.let { toolbar.setBackgroundColor(it) }

        // color
        if (mTintColor != 0) {
            toolbar.navigationIcon?.setColorFilter(mTintColor, PorterDuff.Mode.SRC_ATOP)
        }

        // subviews
        for (i in toolbar.childCount - 1 downTo 0) {
            if (toolbar.getChildAt(i) is ScreenStackHeaderSubview) {
                toolbar.removeViewAt(i)
            }
        }

        var i = 0
        val size = mConfigSubviews.size
        while (i < size) {
            val view = mConfigSubviews[i]
            val type = view.type
            if (type === ScreenStackHeaderSubview.Type.BACK) {
                // we special case BACK button header config type as we don't add it as a view into toolbar
                // but instead just copy the drawable from imageview that's added as a first child to it.
                val firstChild = view.getChildAt(0) as? ImageView
                    ?: throw JSApplicationIllegalArgumentException(
                        "Back button header config view should have Image as first child"
                    )
                actionBar.setHomeAsUpIndicator(firstChild.drawable)
                i++
                continue
            }
            val params = Toolbar.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT)
            when (type) {
                ScreenStackHeaderSubview.Type.LEFT -> {
                    // when there is a left item we need to disable navigation icon by default
                    // we also hide title as there is no other way to display left side items
                    if (!mBackButtonInCustomView) {
                        toolbar.navigationIcon = null
                    }
                    toolbar.title = null
                    params.gravity = Gravity.START
                }
                ScreenStackHeaderSubview.Type.RIGHT -> params.gravity = Gravity.END
                ScreenStackHeaderSubview.Type.CENTER -> {
                    params.width = LayoutParams.MATCH_PARENT
                    params.gravity = Gravity.CENTER_HORIZONTAL
                    toolbar.title = null
                }
                else -> {}
            }
            view.layoutParams = params
            toolbar.addView(view)
            i++
        }
    }

    private fun maybeUpdate() {
        if (parent != null && !mDestroyed) {
            onUpdate()
        }
    }

    fun getConfigSubview(index: Int): ScreenStackHeaderSubview = mConfigSubviews[index]

    val configSubviewsCount: Int
        get() = mConfigSubviews.size

    fun removeConfigSubview(index: Int) {
        mConfigSubviews.removeAt(index)
        maybeUpdate()
    }

    fun removeAllConfigSubviews() {
        mConfigSubviews.clear()
        maybeUpdate()
    }

    fun addConfigSubview(child: ScreenStackHeaderSubview, index: Int) {
        mConfigSubviews.add(index, child)
        maybeUpdate()
    }

    private val titleTextView: TextView?
        get() {
            for (i in 0 until toolbar.childCount) {
                val view = toolbar.getChildAt(i)
                if (view is TextView) {
                    if (view.text == toolbar.title) {
                        return view
                    }
                }
            }
            return null
        }

    fun setTitle(title: String?) {
        mTitle = title
    }

    fun setTitleFontFamily(titleFontFamily: String?) {
        mTitleFontFamily = titleFontFamily
    }

    fun setTitleFontWeight(fontWeightString: String?) {
        mTitleFontWeight = ReactTypefaceUtils.parseFontWeight(fontWeightString)
    }

    fun setTitleFontSize(titleFontSize: Float) {
        mTitleFontSize = titleFontSize
    }

    fun setTitleColor(color: Int) {
        mTitleColor = color
    }

    fun setTintColor(color: Int) {
        mTintColor = color
    }

    fun setTopInsetEnabled(topInsetEnabled: Boolean) {
        mIsTopInsetEnabled = topInsetEnabled
    }

    fun setBackgroundColor(color: Int?) {
        mBackgroundColor = color
    }

    fun setHideShadow(hideShadow: Boolean) {
        mIsShadowHidden = hideShadow
    }

    fun setHideBackButton(hideBackButton: Boolean) {
        mIsBackButtonHidden = hideBackButton
    }

    fun setHidden(hidden: Boolean) {
        mIsHidden = hidden
    }

    fun setTranslucent(translucent: Boolean) {
        mIsTranslucent = translucent
    }

    fun setBackButtonInCustomView(backButtonInCustomView: Boolean) {
        mBackButtonInCustomView = backButtonInCustomView
    }

    fun setDirection(direction: String?) {
        mDirection = direction
    }

    private class DebugMenuToolbar(context: Context, config: ScreenStackHeaderConfig) : CustomToolbar(context, config) {
        override fun showOverflowMenu(): Boolean {
            (context.applicationContext as ReactApplication)
                .reactNativeHost
                .reactInstanceManager
                .showDevOptionsDialog()
            return true
        }
    }

    init {
        visibility = GONE
        toolbar = if (BuildConfig.DEBUG) DebugMenuToolbar(context, this) else CustomToolbar(context, this)
        mDefaultStartInset = toolbar.contentInsetStart
        mDefaultStartInsetWithNavigation = toolbar.contentInsetStartWithNavigation

        // set primary color as background by default
        val tv = TypedValue()
        if (context.theme.resolveAttribute(android.R.attr.colorPrimary, tv, true)) {
            toolbar.setBackgroundColor(tv.data)
        }
        toolbar.clipChildren = false
    }
}
