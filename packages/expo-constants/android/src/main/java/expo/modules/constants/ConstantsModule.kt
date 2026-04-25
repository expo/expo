// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.constants

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ConstantsModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExponentConstants")

    appContext.service<ConstantsService>()?.constants?.forEach { (key, value) ->
      Constant(key) { value }
    }

    AsyncFunction<String?>("getWebViewUserAgentAsync") {
      return@AsyncFunction System.getProperty("http.agent")
    }
  }
}
