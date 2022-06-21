package expo.modules.kotlin.providers

import expo.modules.kotlin.AppContext

/**
 * Provider that allows accessing [AppContext] and all it's public parts (e.g. [AppContext.reactContext]).
 */
interface AppContextProvider {
  /**
   * [AppContext] reference. If it's not possible to access the [AppContext], because it's null
   * then it's an invalid situation and should result in throwing descriptive error.
   */
  val appContext: AppContext
}
