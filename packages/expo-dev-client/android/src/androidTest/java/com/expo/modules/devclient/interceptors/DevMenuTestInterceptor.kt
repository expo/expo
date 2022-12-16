package com.expo.modules.devclient.interceptors

import expo.interfaces.devmenu.DevMenuPreferencesInterface

internal class DevMenuTestInterceptor(
  private val settingsInterface: DevMenuPreferencesInterface
) : expo.modules.devmenu.tests.DevMenuTestInterceptor {
  override fun overrideSettings(): DevMenuPreferencesInterface = settingsInterface
}
