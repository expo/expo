package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.enums.FullscreenOrientation
import java.io.Serializable

data class FullscreenOptions(
  @Field val enable: Boolean = true,
  @Field val orientation: FullscreenOrientation = FullscreenOrientation.DEFAULT,
  @Field val autoExitOnRotate: Boolean = false
) : Record, Serializable
