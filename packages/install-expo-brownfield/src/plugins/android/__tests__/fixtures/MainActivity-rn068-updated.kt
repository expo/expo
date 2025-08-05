package com.helloworld
import expo.modules.ReactActivityDelegateWrapper

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun mainComponentName: String {
    return "HelloWorld"
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, MainActivityDelegate(this, mainComponentName))
  }

  class MainActivityDelegate(activity: ReactActivity?, mainComponentName: String?)
    : ReactActivityDelegate(activity, mainComponentName) {
    override fun createRootView(): ReactRootView {
      val reactRootView = ReactRootView(context)
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED)
      return reactRootView
    }
  }
}
