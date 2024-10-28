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
        DO_NOT_MIX -> 0
        AUTO -> 1
        DUCK_OTHERS -> 2
        MIX_WITH_OTHERS -> 3
      }
    }
}
