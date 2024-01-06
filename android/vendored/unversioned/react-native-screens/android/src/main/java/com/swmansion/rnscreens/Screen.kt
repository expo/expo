package com.swmansion.rnscreens

import android.annotation.SuppressLint
import android.content.pm.ActivityInfo
import android.graphics.Paint
import android.os.Parcelable
import android.util.SparseArray
import android.util.TypedValue
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebView
import androidx.core.view.children
import androidx.fragment.app.Fragment
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerModule
import com.swmansion.rnscreens.events.HeaderHeightChangeEvent

@SuppressLint("ViewConstructor")
class Screen constructor(context: ReactContext?) : FabricEnabledViewGroup(context) {
    val fragment: Fragment?
        get() = fragmentWrapper?.fragment

    var fragmentWrapper: ScreenFragmentWrapper? = null
    var container: ScreenContainer? = null
    var activityState: ActivityState? = null
        private set
    private var mTransitioning = false
    var stackPresentation = StackPresentation.PUSH
    var replaceAnimation = ReplaceAnimation.POP
    var stackAnimation = StackAnimation.DEFAULT
    var isGestureEnabled = true
    var screenOrientation: Int? = null
        private set
    private var mStatusBarStyle: String? = null
    private var mStatusBarHidden: Boolean? = null
    private var mStatusBarTranslucent: Boolean? = null
    private var mStatusBarColor: Int? = null
    private var mNavigationBarColor: Int? = null
    private var mNavigationBarHidden: Boolean? = null
    var isStatusBarAnimated: Boolean? = null
    private var mNativeBackButtonDismissalEnabled = true

    init {
        // we set layout params as WindowManager.LayoutParams to workaround the issue with TextInputs
        // not displaying modal menus (e.g., copy/paste or selection). The missing menus are due to the
        // fact that TextView implementation is expected to be attached to window when layout happens.
        // Then, at the moment of layout it checks whether window type is in a reasonable range to tell
        // whether it should enable selection controls (see Editor.java#prepareCursorControllers).
        // With screens, however, the text input component can be laid out before it is attached, in
        // that case TextView tries to get window type property from the oldest existing parent, which
        // in this case is a Screen class, as it is the root of the screen that is about to be attached.
        // Setting params this way is not the most elegant way to solve this problem but workarounds it
        // for the time being
        layoutParams = WindowManager.LayoutParams(WindowManager.LayoutParams.TYPE_APPLICATION)
    }

    override fun dispatchSaveInstanceState(container: SparseArray<Parcelable>) {
        // do nothing, react native will keep the view hierarchy so no need to serialize/deserialize
        // view's states. The side effect of restoring is that TextInput components would trigger
        // set-text events which may confuse text input handling.
    }

    override fun dispatchRestoreInstanceState(container: SparseArray<Parcelable>) {
        // ignore restoring instance state too as we are not saving anything anyways.
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        if (changed) {
            val width = r - l
            val height = b - t

            calculateHeaderHeight()
            if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
                updateScreenSizeFabric(width, height)
            } else {
                updateScreenSizePaper(width, height)
            }
        }
    }

    private fun updateScreenSizePaper(width: Int, height: Int) {
        val reactContext = context as ReactContext
        reactContext.runOnNativeModulesQueueThread(
            object : GuardedRunnable(reactContext) {
                override fun runGuarded() {
                    reactContext
                        .getNativeModule(UIManagerModule::class.java)
                        ?.updateNodeSize(id, width, height)
                }
            })
    }

    val headerConfig: ScreenStackHeaderConfig?
        get() = children.find { it is ScreenStackHeaderConfig } as? ScreenStackHeaderConfig

    /**
     * While transitioning this property allows to optimize rendering behavior on Android and provide
     * a correct blending options for the animated screen. It is turned on automatically by the
     * container when transitioning is detected and turned off immediately after
     */
    fun setTransitioning(transitioning: Boolean) {
        if (mTransitioning == transitioning) {
            return
        }
        mTransitioning = transitioning
        val isWebViewInScreen = hasWebView(this)
        if (isWebViewInScreen && layerType != LAYER_TYPE_HARDWARE) {
            return
        }
        super.setLayerType(
            if (transitioning && !isWebViewInScreen) LAYER_TYPE_HARDWARE else LAYER_TYPE_NONE,
            null
        )
    }

    private fun hasWebView(viewGroup: ViewGroup): Boolean {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)
            if (child is WebView) {
                return true
            } else if (child is ViewGroup) {
                if (hasWebView(child)) {
                    return true
                }
            }
        }
        return false
    }

    override fun setLayerType(layerType: Int, paint: Paint?) {
        // ignore - layer type is controlled by `transitioning` prop
    }

    fun setActivityState(activityState: ActivityState) {
        if (activityState == this.activityState) {
            return
        }
        this.activityState = activityState
        container?.notifyChildUpdate()
    }

    fun setScreenOrientation(screenOrientation: String?) {
        if (screenOrientation == null) {
            this.screenOrientation = null
            return
        }
        ScreenWindowTraits.applyDidSetOrientation()
        this.screenOrientation = when (screenOrientation) {
            "all" -> ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR
            "portrait" -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
            "portrait_up" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            "portrait_down" -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
            "landscape" -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            "landscape_left" -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
            "landscape_right" -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            else -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }

        fragmentWrapper?.let { ScreenWindowTraits.setOrientation(this, it.tryGetActivity()) }
    }

    // Accepts one of 4 accessibility flags
    // developer.android.com/reference/android/view/View#attr_android:importantForAccessibility
    fun changeAccessibilityMode(mode: Int) {
        this.importantForAccessibility = mode
        this.headerConfig?.toolbar?.importantForAccessibility = mode
    }

    var statusBarStyle: String?
        get() = mStatusBarStyle
        set(statusBarStyle) {
            if (statusBarStyle != null) {
                ScreenWindowTraits.applyDidSetStatusBarAppearance()
            }
            mStatusBarStyle = statusBarStyle
            fragmentWrapper?.let { ScreenWindowTraits.setStyle(this, it.tryGetActivity(), it.tryGetContext()) }
        }

    var isStatusBarHidden: Boolean?
        get() = mStatusBarHidden
        set(statusBarHidden) {
            if (statusBarHidden != null) {
                ScreenWindowTraits.applyDidSetStatusBarAppearance()
            }
            mStatusBarHidden = statusBarHidden
            fragmentWrapper?.let { ScreenWindowTraits.setHidden(this, it.tryGetActivity()) }
        }

    var isStatusBarTranslucent: Boolean?
        get() = mStatusBarTranslucent
        set(statusBarTranslucent) {
            if (statusBarTranslucent != null) {
                ScreenWindowTraits.applyDidSetStatusBarAppearance()
            }
            mStatusBarTranslucent = statusBarTranslucent
            fragmentWrapper?.let {
                ScreenWindowTraits.setTranslucent(
                    this,
                    it.tryGetActivity(),
                    it.tryGetContext()
                )
            }
        }

    var statusBarColor: Int?
        get() = mStatusBarColor
        set(statusBarColor) {
            if (statusBarColor != null) {
                ScreenWindowTraits.applyDidSetStatusBarAppearance()
            }
            mStatusBarColor = statusBarColor
            fragmentWrapper?.let { ScreenWindowTraits.setColor(this, it.tryGetActivity(), it.tryGetContext()) }
        }

    var navigationBarColor: Int?
        get() = mNavigationBarColor
        set(navigationBarColor) {
            if (navigationBarColor != null) {
                ScreenWindowTraits.applyDidSetNavigationBarAppearance()
            }
            mNavigationBarColor = navigationBarColor
            fragmentWrapper?.let { ScreenWindowTraits.setNavigationBarColor(this, it.tryGetActivity()) }
        }

    var isNavigationBarHidden: Boolean?
        get() = mNavigationBarHidden
        set(navigationBarHidden) {
            if (navigationBarHidden != null) {
                ScreenWindowTraits.applyDidSetNavigationBarAppearance()
            }
            mNavigationBarHidden = navigationBarHidden
            fragmentWrapper?.let {
                ScreenWindowTraits.setNavigationBarHidden(
                    this,
                    it.tryGetActivity(),
                )
            }
        }

    var nativeBackButtonDismissalEnabled: Boolean
        get() = mNativeBackButtonDismissalEnabled
        set(enableNativeBackButtonDismissal) {
            mNativeBackButtonDismissalEnabled = enableNativeBackButtonDismissal
        }

    private fun calculateHeaderHeight() {
        val actionBarTv = TypedValue()
        val resolvedActionBarSize = context.theme.resolveAttribute(android.R.attr.actionBarSize, actionBarTv, true)

        // Check if it's possible to get an attribute from theme context and assign a value from it.
        // Otherwise, the default value will be returned.
        val actionBarHeight = TypedValue.complexToDimensionPixelSize(actionBarTv.data, resources.displayMetrics)
            .takeIf { resolvedActionBarSize && headerConfig?.mIsHidden != true }
            ?.let { PixelUtil.toDIPFromPixel(it.toFloat()).toDouble() } ?: 0.0

        val statusBarHeight = context.resources.getIdentifier("status_bar_height", "dimen", "android")
            .takeIf { it > 0 && isStatusBarHidden != true }
            ?.let { (context.resources::getDimensionPixelSize)(it) }
            ?.let { PixelUtil.toDIPFromPixel(it.toFloat()).toDouble() }
            ?: 0.0

        val totalHeight = actionBarHeight + statusBarHeight
        UIManagerHelper.getEventDispatcherForReactTag(context as ReactContext, id)
            ?.dispatchEvent(HeaderHeightChangeEvent(id, totalHeight))
    }

    enum class StackPresentation {
        PUSH, MODAL, TRANSPARENT_MODAL
    }

    enum class StackAnimation {
        DEFAULT, NONE, FADE, SLIDE_FROM_BOTTOM, SLIDE_FROM_RIGHT, SLIDE_FROM_LEFT, FADE_FROM_BOTTOM, IOS
    }

    enum class ReplaceAnimation {
        PUSH, POP
    }

    enum class ActivityState {
        INACTIVE, TRANSITIONING_OR_BELOW_TOP, ON_TOP
    }

    enum class WindowTraits {
        ORIENTATION, COLOR, STYLE, TRANSLUCENT, HIDDEN, ANIMATED, NAVIGATION_BAR_COLOR, NAVIGATION_BAR_HIDDEN
    }
}
