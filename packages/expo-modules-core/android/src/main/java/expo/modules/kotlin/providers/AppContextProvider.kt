package expo.modules.kotlin.providers

import expo.modules.kotlin.AppContext

/**
 * Provider that allows us to access [AppContext] and possibly other underlying things like [AppContext.reactContext]
 */
interface AppContextProvider {
  /**
   * Non nullable [AppContext] reference.
   */
  val appContext: AppContext
}
