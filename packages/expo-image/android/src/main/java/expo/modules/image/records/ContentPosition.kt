package expo.modules.image.records

import android.graphics.Matrix
import android.graphics.RectF
import expo.modules.image.calcXTranslation
import expo.modules.image.calcYTranslation
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * Represents a position value that might be either `Double` or `String`.
 * TODO(@lukmccall): Use `Either` instead of `Any`
 */
typealias ContentPositionValue = Any

private typealias CalcAxisOffset = (
  value: Float,
  imageRect: RectF,
  viewRect: RectF,
  isPercentage: Boolean,
  isReverse: Boolean
) -> Float

class ContentPosition : Record {
  @Field
  val top: ContentPositionValue? = null

  @Field
  val bottom: ContentPositionValue? = null

  @Field
  val right: ContentPositionValue? = null

  @Field
  val left: ContentPositionValue? = null

  private fun ContentPositionValue?.calcOffset(
    isReverse: Boolean,
    imageRect: RectF,
    viewRect: RectF,
    calcAxisOffset: CalcAxisOffset
  ): Float? {
    if (this == null) {
      return null
    }

    return if (this is Double) {
      val value = this.toFloat()
      calcAxisOffset(value, imageRect, viewRect, false, isReverse)
    } else {
      val value = this as String

      if (value == "center") {
        calcAxisOffset(50f, imageRect, viewRect, true, isReverse)
      } else {
        calcAxisOffset(value.removeSuffix("%").toFloat(), imageRect, viewRect, true, isReverse)
      }
    }
  }

  private fun offsetX(
    imageRect: RectF,
    viewRect: RectF
  ): Float {
    return left.calcOffset(false, imageRect, viewRect, ::calcXTranslation)
      ?: right.calcOffset(true, imageRect, viewRect, ::calcXTranslation)
      ?: calcXTranslation(50f, imageRect, viewRect, isPercentage = true) // default value
  }

  private fun offsetY(
    imageRect: RectF,
    viewRect: RectF
  ): Float {
    return top.calcOffset(false, imageRect, viewRect, ::calcYTranslation)
      ?: bottom.calcOffset(true, imageRect, viewRect, ::calcYTranslation)
      ?: calcYTranslation(50f, imageRect, viewRect, isPercentage = true) // default value
  }

  internal fun apply(to: Matrix, imageRect: RectF, viewRect: RectF) {
    val xOffset = offsetX(imageRect, viewRect)
    val yOffset = offsetY(imageRect, viewRect)

    to.postTranslate(xOffset, yOffset)
  }

  companion object {
    val center = ContentPosition()
  }
}
