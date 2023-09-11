// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.expo.modules.constants

import abi48_0_0.expo.modules.kotlin.modules.Module
import abi48_0_0.expo.modules.kotlin.modules.ModuleDefinition

class ConstantsModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExponentConstants")

    Constants {
      return@Constants appContext.constants?.constants ?: emptyMap()
    }

    AsyncFunction("getWebViewUserAgentAsync") {
      return@AsyncFunction System.getProperty("http.agent")
    }
  }
}
