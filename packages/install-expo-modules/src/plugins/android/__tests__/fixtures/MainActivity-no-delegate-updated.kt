package com.helloworld
import expo.modules.ReactActivityDelegateWrapper
import com.facebook.react.ReactActivityDelegate

import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun mainComponentName: String {
    return "HelloWorld"
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(this,
      ReactActivityDelegate(this, getMainComponentName())
    );
  }
}
