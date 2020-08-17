package expo.modules.devmenu.interfaces

import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import expo.modules.devmenu.DevMenuHost
import expo.modules.devmenu.DevMenuSession
import expo.modules.devmenu.modules.DevMenuSettings

interface DevMenuManagerInterface {
  /**
   * Opens the dev menu in provided [activity]
   */
  fun openMenu(activity: Activity)

  /**
   * Closes the dev menu.
   * This method will trigger the js code, which should smoothly hide the menu.
   */
  fun closeMenu()

  /**
   * Hides the dev menu.
   * This method will destroyed the current dev menu [Activity].
   */
  fun hideMenu()

  /**
   * Toggles the dev menu in provided [activity]
   */
  fun toggleMenu(activity: Activity)

  /**
   * Handles `onKeyEvent`. It will trigger [expo.modules.devmenu.DevMenuActivity] if [DevMenuSettings.keyCommandsEnabled] is true.
   */
  fun onKeyEvent(keyCode: Int, event: KeyEvent): Boolean

  /**
   * Initializes the dev menu manager to work with provided delegate.
   */
  fun setDelegate(newDelegate: DevMenuDelegateInterface)

  /**
   * Finds and dispatches action with provided [actionId].
   * If such action doesn't exist, ignore it.
   */
  fun dispatchAction(actionId: String)

  /**
   * @return a list of dev menu items serialized to the [Bundle].
   */
  fun serializedItems(): List<Bundle>

  /**
   * @return a instance of [DevMenuSession] that keeps the details of the currently opened dev menu session,
   * or `null` if menu isn't opened.
   */
  fun getSession(): DevMenuSession?

  /**
   * @return a instance of [DevMenuSettings] that keeps all settings for current dev menu delegate,
   * or `null` if delegate wasn't provided.
   */
  fun getSettings(): DevMenuSettings?

  /**
   * @return the dev menu application host.
   */
  fun getMenuHost(): DevMenuHost
}
