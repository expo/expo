package devmenu.com.th3rdwave.safeareacontext

import com.facebook.react.uimanager.PixelUtil
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class InsetsChangeEvent(
  insets: EdgeInsets,
  frame: Rect
) : Record {
  @Field("insets")
  val parsedInsets = EdgeInsets(
    PixelUtil.toDIPFromPixel(insets.top),
    PixelUtil.toDIPFromPixel(insets.right),
    PixelUtil.toDIPFromPixel(insets.bottom),
    PixelUtil.toDIPFromPixel(insets.left)
  )

  @Field("frame")
  val parsedFrame = Rect(
    PixelUtil.toDIPFromPixel(frame.x),
    PixelUtil.toDIPFromPixel(frame.y),
    PixelUtil.toDIPFromPixel(frame.width),
    PixelUtil.toDIPFromPixel(frame.height)
  )
}
