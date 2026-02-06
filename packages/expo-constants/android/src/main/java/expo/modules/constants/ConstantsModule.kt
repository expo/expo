// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.constants

import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ConstantsModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExponentConstants")

    Constants {
      return@Constants appContext.service<ConstantsInterface>()?.constants ?: emptyMap()
    }

    AsyncFunction<String?>("getWebViewUserAgentAsync") {
      return@AsyncFunction System.getProperty("http.agent")
    }
  }
}
