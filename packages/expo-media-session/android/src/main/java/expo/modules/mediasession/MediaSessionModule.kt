package expo.modules.mediasession

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MediaSessionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMediaSession")
  }
}
