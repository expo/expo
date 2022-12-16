package expo.modules.devmenu.tests

import expo.interfaces.devmenu.DevMenuPreferencesInterface

class DevMenuDisabledTestInterceptor : DevMenuTestInterceptor {
  override fun overrideSettings(): DevMenuPreferencesInterface? = null
}
