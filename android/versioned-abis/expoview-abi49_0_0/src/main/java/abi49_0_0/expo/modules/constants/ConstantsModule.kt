// Copyright 2015-present 650 Industries. All rights reserved.
package abi49_0_0.expo.modules.constants

import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition

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
