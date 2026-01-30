package expo.modules.ui.convertibles

import androidx.compose.ui.Alignment
import expo.modules.kotlin.types.Enumerable

/**
 * Generic alignment type that for modifier.clip()
 */
enum class AlignmentType(val value: String) : Enumerable {
  TOP_START("topStart"),
  TOP_CENTER("topCenter"),
  TOP_END("topEnd"),
  CENTER_START("centerStart"),
  CENTER("center"),
  CENTER_END("centerEnd"),
  BOTTOM_START("bottomStart"),
  BOTTOM_CENTER("bottomCenter"),
  BOTTOM_END("bottomEnd"),
  TOP("top"),
  CENTER_VERTICALLY("centerVertically"),
  BOTTOM("bottom"),
  START("start"),
  CENTER_HORIZONTALLY("centerHorizontally"),
  END("end");

  fun toAlignment(): Alignment? {
    return when (this) {
      TOP_START -> Alignment.TopStart
      TOP_CENTER -> Alignment.TopCenter
      TOP_END -> Alignment.TopEnd
      CENTER_START -> Alignment.CenterStart
      CENTER -> Alignment.Center
      CENTER_END -> Alignment.CenterEnd
      BOTTOM_START -> Alignment.BottomStart
      BOTTOM_CENTER -> Alignment.BottomCenter
      BOTTOM_END -> Alignment.BottomEnd
      else -> null
    }
  }

  fun toVerticalAlignment(): Alignment.Vertical? {
    return when (this) {
      TOP -> Alignment.Top
      CENTER_VERTICALLY -> Alignment.CenterVertically
      BOTTOM -> Alignment.Bottom
      else -> null
    }
  }

  fun toHorizontalAlignment(): Alignment.Horizontal? {
    return when (this) {
      START -> Alignment.Start
      CENTER_HORIZONTALLY -> Alignment.CenterHorizontally
      END -> Alignment.End
      else -> null
    }
  }
}

enum class HorizontalAlignment(val value: String) : Enumerable {
  START("start"),
  END("end"),
  CENTER("center");

  fun toComposeAlignment(): Alignment.Horizontal {
    return when (this) {
      START -> Alignment.Start
      END -> Alignment.End
      CENTER -> Alignment.CenterHorizontally
    }
  }
}

enum class VerticalAlignment(val value: String) : Enumerable {
  TOP("top"),
  BOTTOM("bottom"),
  CENTER("center");

  fun toComposeAlignment(): Alignment.Vertical {
    return when (this) {
      TOP -> Alignment.Top
      BOTTOM -> Alignment.Bottom
      CENTER -> Alignment.CenterVertically
    }
  }
}

enum class ContentAlignment(val value: String) : Enumerable {
  TOP_START("topStart"),
  TOP_CENTER("topCenter"),
  TOP_END("topEnd"),
  CENTER_START("centerStart"),
  CENTER("center"),
  CENTER_END("centerEnd"),
  BOTTOM_START("bottomStart"),
  BOTTOM_CENTER("bottomCenter"),
  BOTTOM_END("bottomEnd");

  fun toComposeAlignment(): Alignment {
    return when (this) {
      TOP_START -> Alignment.TopStart
      TOP_CENTER -> Alignment.TopCenter
      TOP_END -> Alignment.TopEnd
      CENTER_START -> Alignment.CenterStart
      CENTER -> Alignment.Center
      CENTER_END -> Alignment.CenterEnd
      BOTTOM_START -> Alignment.BottomStart
      BOTTOM_CENTER -> Alignment.BottomCenter
      BOTTOM_END -> Alignment.BottomEnd
    }
  }
}
