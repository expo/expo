package expo.modules.blur

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Path
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.util.Log
import java.lang.reflect.Method

/**
 * Blurs what is drawn behind a view with the platform backdrop API, added in Android 17 QPR
 * (SDK 37.2): `RenderNode.setBackdropRenderEffect` applies a [RenderEffect] to everything already
 * drawn behind the node, on the RenderThread. No snapshot of the view tree is taken and no
 * `BlurTargetView` is needed.
 *
 * The effect lives on a separate, empty [RenderNode] that the view draws first in its own `draw`, so
 * it follows the view's transform and opacity. The method is resolved by reflection so the module
 * compiles against SDKs that don't have it yet.
 */
@SuppressLint("NewApi")
internal class PlatformBackdrop {
  private var node: RenderNode? = null
  private var appliedRadius = -1f
  private val outline = Outline()

  fun draw(canvas: Canvas, width: Int, height: Int, clipPath: Path?, radiusPx: Float) {
    val method = setBackdropRenderEffect ?: return
    if (!canvas.isHardwareAccelerated || width <= 0 || height <= 0 || radiusPx <= 0f) {
      return
    }

    val node = node ?: RenderNode("ExpoBlurBackdrop").also { node = it }
    if (radiusPx != appliedRadius) {
      try {
        method.invoke(node, RenderEffect.createBlurEffect(radiusPx, radiusPx, Shader.TileMode.CLAMP))
      } catch (e: Exception) {
        Log.w(TAG, "setBackdropRenderEffect failed", e)
        return
      }
      appliedRadius = radiusPx
    }

    node.setPosition(0, 0, width, height)
    if (clipPath != null) {
      outline.setPath(clipPath)
    } else {
      outline.setRect(0, 0, width, height)
    }
    node.setOutline(outline)
    node.setClipToOutline(true)

    // An empty node is not drawn. A transparent fill keeps it without adding any pixels on top of
    // the processed backdrop.
    val recording = node.beginRecording(width, height)
    recording.drawColor(Color.TRANSPARENT)
    node.endRecording()
    canvas.drawRenderNode(node)
  }

  fun release() {
    node?.discardDisplayList()
    node = null
    appliedRadius = -1f
  }

  companion object {
    private const val TAG = "ExpoBlurView"

    // Build.VERSION_CODES_FULL value of SDK 37.2 (major * 100000 + minor).
    private const val SDK_37_2 = 3_700_002

    private val setBackdropRenderEffect: Method? by lazy(LazyThreadSafetyMode.NONE) {
      if (Build.VERSION.SDK_INT < 37 || Build.VERSION.SDK_INT_FULL < SDK_37_2) {
        return@lazy null
      }
      try {
        RenderNode::class.java.getMethod("setBackdropRenderEffect", RenderEffect::class.java)
      } catch (e: NoSuchMethodException) {
        Log.w(TAG, "RenderNode.setBackdropRenderEffect is missing on SDK 37.2+", e)
        null
      }
    }

    val isSupported: Boolean
      get() = setBackdropRenderEffect != null
  }
}
