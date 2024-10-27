package com.helloworld

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun mainComponentName: String {
    return "HelloWorld"
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegate(this, mainComponentName)
  }
}
