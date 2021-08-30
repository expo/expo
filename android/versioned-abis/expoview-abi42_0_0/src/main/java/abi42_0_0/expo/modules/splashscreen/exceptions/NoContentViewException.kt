package abi42_0_0.expo.modules.splashscreen.exceptions

import abi42_0_0.org.unimodules.core.errors.CodedException

class NoContentViewException : CodedException("ContentView is not yet available. Call 'SplashScreen.show(...)' once 'setContentView()' is called.") {
  override fun getCode(): String {
    return "ERR_NO_CONTENT_VIEW_FOUND"
  }
}
