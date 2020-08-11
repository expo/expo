package expo.modules.devmenu.protocoles

import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import expo.modules.devmenu.DevMenuHost
import expo.modules.devmenu.DevMenuSession
import expo.modules.devmenu.modules.DevMenuSettings

interface DevMenuManagerProtocol {
  fun openMenu(activity: Activity)
  fun closeMenu()
  fun hideMenu()
  fun toggleMenu(activity: Activity)
  fun onKeyEvent(keyCode: Int, event: KeyEvent): Boolean
  fun setDelegate(newDelegate: DevMenuDelegateProtocol)
  fun dispatchAction(actionId: String)
  fun serializedItems(): List<Bundle>
  fun getSession(): DevMenuSession?
  fun getSettings(): DevMenuSettings?
  fun getMenuHost(): DevMenuHost
}
