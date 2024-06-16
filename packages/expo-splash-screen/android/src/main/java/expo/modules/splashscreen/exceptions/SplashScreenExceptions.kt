package expo.modules.splashscreen.exceptions

import expo.modules.kotlin.exception.CodedException

class NoContentViewException :
  CodedException("ContentView is not yet available. Call 'SplashScreen.show(...)' once 'setContentView()' is called.")

class PreventAutoHideException(message: String) :
  CodedException(message)

class HideAsyncException(message: String) :
  CodedException(message)
