package expo.modules.video.records

import androidx.media3.session.CommandButton
import expo.modules.kotlin.types.Enumerable

enum class NowPlayingActionSlot(val value: String) : Enumerable {
  SLOT_CENTRAL("SLOT_CENTRAL"),
  SLOT_BACK("SLOT_BACK"),
  SLOT_FORWARD("SLOT_FORWARD"),
  SLOT_BACK_SECONDARY("SLOT_BACK_SECONDARY"),
  SLOT_FORWARD_SECONDARY("SLOT_FORWARD_SECONDARY"),
  SLOT_OVERFLOW("SLOT_OVERFLOW");

  fun toCommandButtonSlot(): Int {
    return when (this) {
      SLOT_CENTRAL -> CommandButton.SLOT_CENTRAL
      SLOT_BACK -> CommandButton.SLOT_BACK
      SLOT_FORWARD -> CommandButton.SLOT_FORWARD
      SLOT_BACK_SECONDARY -> CommandButton.SLOT_BACK_SECONDARY
      SLOT_FORWARD_SECONDARY -> CommandButton.SLOT_FORWARD_SECONDARY
      SLOT_OVERFLOW -> CommandButton.SLOT_OVERFLOW
    }
  }
}

