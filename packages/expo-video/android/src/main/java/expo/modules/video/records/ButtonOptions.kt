package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class ButtonOptions(
  @Field val showNext: Boolean = false,
  @Field val showPrevious: Boolean = false,
  @Field val showSeekForward: Boolean = true,
  @Field val showSeekBackward: Boolean = true,
  @Field val showSubtitles: Boolean? = null,
  @Field val showSettings: Boolean = true,
  @Field val showPlayPause: Boolean = true,
  @Field val showBottomBar: Boolean = true
) : Record
