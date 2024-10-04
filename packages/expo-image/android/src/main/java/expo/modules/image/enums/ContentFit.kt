package expo.modules.image.enums

import android.graphics.Matrix
import android.graphics.RectF
import expo.modules.kotlin.types.Enumerable
import kotlin.math.max

/**
 * Describes how the image should be resized to fit its container.
 * - Note: It mirrors the CSS [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) property.
 */
enum class ContentFit(val value: String) : Enumerable {
  /**
   * The image is scaled to maintain its aspect ratio while fitting within the container's box.
   * The entire image is made to fill the box, while preserving its aspect ratio,
   * so the image will be "letterboxed" if its aspect ratio does not match the aspect ratio of the box.
   */
  Contain("contain"),

  /**
   * The image is sized to maintain its aspect ratio while filling the element's entire content box.
   * If the image's aspect ratio does not match the aspect ratio of its box, then the object will be clipped to fit.
   */
  Cover("cover"),

  /**
   * The image is sized to fill the element's content box. The entire object will completely fill the box.
   * If the image's aspect ratio does not match the aspect ratio of its box, then the image will be stretched to fit.
   */
  Fill("fill"),

  /**
   * The image is not resized and is centered by default.
   * When specified, the exact position can be controlled with `ContentPosition`.
   */
  None("none"),

  /**
   * The image is sized as if `none` or `contain` were specified,
   * whichever would result in a smaller concrete image size.
   */
  ScaleDown("scale-down");

  internal fun toMatrix(imageRect: RectF, viewRect: RectF) = Matrix().apply {
    when (this@ContentFit) {
      Contain -> setRectToRect(imageRect, viewRect, Matrix.ScaleToFit.START)
      Cover -> {
        val imageWidth = imageRect.width()
        val imageHeight = imageRect.height()

        val reactWidth = viewRect.width()
        val reactHeight = viewRect.height()

        val scale = max(reactWidth / imageWidth, reactHeight / imageHeight)

        setScale(scale, scale)
      }
      Fill -> setRectToRect(imageRect, viewRect, Matrix.ScaleToFit.FILL)
      None -> {
        // we don't need to do anything
      }
      ScaleDown -> {
        if (imageRect.width() >= viewRect.width() || imageRect.height() >= viewRect.height()) {
          setRectToRect(imageRect, viewRect, Matrix.ScaleToFit.START)
        }
      }
    }
  }
}
