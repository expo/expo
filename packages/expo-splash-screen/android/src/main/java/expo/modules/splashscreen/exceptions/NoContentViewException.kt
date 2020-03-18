package expo.modules.splashscreen.exceptions

import org.unimodules.core.errors.CodedException

class NoContentViewException : CodedException("ContentView is not yet available. Call 'SplashScreen.show(...)' once 'setContentView()' is called.")
