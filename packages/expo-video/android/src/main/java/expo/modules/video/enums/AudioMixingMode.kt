package expo.modules.video.enums

import expo.modules.kotlin.types.Enumerable

enum class AudioMixingMode(val value: String) : Enumerable {
  MIX_WITH_OTHERS("mixWithOthers"),
  DUCK_OTHERS("duckOthers"),
  AUTO("auto"),
  DO_NOT_MIX("doNotMix");

  val priority: Int
    get() {
      return when (this) {
        DO_NOT_MIX -> 3
        AUTO -> 2
        DUCK_OTHERS -> 1
        MIX_WITH_OTHERS -> 0
      }
    }
}
