package expo.modules.video.enums

import expo.modules.kotlin.types.Enumerable

enum class PlayerStatus(val value: String) : Enumerable {
  IDLE("idle"),
  LOADING("loading"),
  READY_TO_PLAY("readyToPlay"),
  ERROR("error")
}
