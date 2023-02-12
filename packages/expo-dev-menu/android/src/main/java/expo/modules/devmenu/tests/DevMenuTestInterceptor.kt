package expo.modules.devmenu.tests

import expo.interfaces.devmenu.DevMenuPreferencesInterface

interface DevMenuTestInterceptor {
  fun overrideSettings(): DevMenuPreferencesInterface?
}
