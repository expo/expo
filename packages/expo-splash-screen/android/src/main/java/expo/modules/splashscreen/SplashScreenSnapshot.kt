package expo.modules.splashscreen

import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.text.Layout
import android.text.Spanned
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.ReplacementSpan
import android.text.style.TypefaceSpan
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.view.ReactViewGroup
import org.json.JSONArray
import org.json.JSONObject
import java.lang.reflect.Method

/**
 * Serializes what is on screen in `root` into a template node
 * `{ "name": "View" | "Text", "props": {...}, "children": [...] }`.
 *
 * Only views that are attached and visible are serialized, at the frames Android resolved (scroll
 * offsets, insets and translations included), in pixels relative to the parent node. React Native
 * views contribute their background, borders and radii as `BackgroundStyleApplicator` stores them;
 * other views their color background. Text views contribute their text as styled runs at the
 * positions their layout resolved, so the replay draws them without laying text out again. Images
 * and text inputs become their frame only.
 */
internal class SplashScreenSnapshot(
  private val root: View,
  private val exclude: View?,
  private val debug: Boolean
) {
  private var budget = MAX_VIEWS
  private val rootLocation = IntArray(2)
  private val location = IntArray(2)
  private val rootBounds = Rect()

  /** The number of views visited by the last `serialize`. */
  val viewCount: Int
    get() = MAX_VIEWS - budget

  /** Returns null when the root is not visible. */
  fun serialize(): JSONObject? {
    budget = MAX_VIEWS
    root.getLocationInWindow(rootLocation)
    rootBounds.set(0, 0, root.width, root.height)
    return serializeView(root, Rect(0, 0, 0, 0), 0)
  }

  private fun serializeView(view: View, parentFrame: Rect, depth: Int): JSONObject? {
    if (view.visibility != View.VISIBLE || view.alpha <= 0.01f || view === exclude || depth > 80 || --budget < 0) {
      return null
    }
    view.getLocationInWindow(location)
    val left = location[0] - rootLocation[0]
    val top = location[1] - rootLocation[1]
    val frame = Rect(left, top, left + view.width, top + view.height)
    val clips = clipsChildren(view)
    val viewGroup = view as? ViewGroup
    val onScreen = Rect.intersects(frame, rootBounds)
    if (!onScreen && (clips || viewGroup == null || viewGroup.childCount == 0)) {
      return null
    }

    val props = JSONObject()
    if (debug) {
      props.put("_class", view.javaClass.name)
    }
    props.put("left", frame.left - parentFrame.left)
    props.put("top", frame.top - parentFrame.top)
    props.put("width", frame.width())
    props.put("height", frame.height())
    if (view.alpha < 1f) {
      props.put("opacity", view.alpha.toDouble())
    }
    if (clips) {
      props.put("overflow", "hidden")
    }
    if (view.elevation > 0f) {
      props.put("elevation", view.elevation.toDouble())
    }
    serializeBackground(view, props)

    if (view is ImageView) {
      // Nothing to draw without an image loader; the frame stays blank.
      return null
    }
    if (view !is EditText) {
      val text = textLayoutOf(view)
      if (text != null) {
        val runs = serializeRuns(text)
        if (runs.length() == 0) {
          return if (props.has("backgroundColor") || props.has("borderWidth")) node("View", props, JSONArray()) else null
        }
        props.put("runs", runs)
        return node("Text", props, JSONArray())
      }
    }

    val children = JSONArray()
    if (viewGroup != null) {
      for (child in childrenInDrawingOrder(viewGroup)) {
        serializeView(child, frame, depth + 1)?.let { children.put(it) }
      }
    }
    return node("View", props, children)
  }

  private fun node(name: String, props: JSONObject, children: JSONArray) =
    JSONObject().put("name", name).put("props", props).put("children", children)

  /** React Native views clip with `overflow`; other view groups with `clipChildren`. */
  private fun clipsChildren(view: View): Boolean = when (view) {
    is ReactViewGroup -> view.overflow != null && view.overflow != "visible"
    is ViewGroup -> view.clipChildren
    else -> false
  }

  /**
   * Children draw in z order: `elevation` and `translationZ` reorder them on top of the index order.
   * `sortedBy` is stable, so views with the same z keep their index order.
   */
  private fun childrenInDrawingOrder(viewGroup: ViewGroup): List<View> =
    (0 until viewGroup.childCount).map { viewGroup.getChildAt(it) }.sortedBy { it.z }

  // region Background

  private fun serializeBackground(view: View, props: JSONObject) {
    val backgroundColor = BackgroundStyleApplicator.getBackgroundColor(view)
      ?: (view.background as? ColorDrawable)?.takeIf { it.alpha > 0 }?.color
    if (backgroundColor != null && Color.alpha(backgroundColor) > 0) {
      props.put("backgroundColor", backgroundColor)
    }
    val widths = JSONObject()
    val colors = JSONObject()
    for (edge in LogicalEdge.entries) {
      BackgroundStyleApplicator.getBorderWidth(view, edge)?.takeIf { it > 0f }?.let { widths.put(edge.name, it.toDouble()) }
      BackgroundStyleApplicator.getBorderColor(view, edge)?.let { colors.put(edge.name, it) }
    }
    if (widths.length() > 0) {
      props.put("borderWidth", widths)
      // The getter returns black for an edge without a color of its own, which would override `ALL`
      // in the replay. An edge that is explicitly black under a colored `ALL` is lost this way.
      val allColor = colors.opt(LogicalEdge.ALL.name)
      if (allColor != null) {
        for (edge in LogicalEdge.entries) {
          if (edge != LogicalEdge.ALL && colors.opt(edge.name) == Color.BLACK && allColor != Color.BLACK) {
            colors.remove(edge.name)
          }
        }
      }
      if (colors.length() > 0) {
        props.put("borderColor", colors)
      }
      BackgroundStyleApplicator.getBorderStyle(view)?.let { props.put("borderStyle", it.name) }
    }
    val radii = JSONObject()
    for (corner in BorderRadiusProp.entries) {
      val radius = BackgroundStyleApplicator.getBorderRadius(view, corner) ?: continue
      // `resolve(100)` is the value for both types: points, or the percentage.
      val value = radius.resolve(100f)
      if (value > 0f) {
        radii.put(corner.name, JSONArray().put(value.toDouble()).put(radius.type.name))
      }
    }
    if (radii.length() > 0) {
      props.put("borderRadius", radii)
    }
  }

  // endregion

  // region Text

  private class TextLayout(val layout: Layout, val left: Float, val top: Float)

  private fun textLayoutOf(view: View): TextLayout? {
    if (view is TextView) {
      val layout = view.layout ?: return null
      return TextLayout(
        layout,
        (view.totalPaddingLeft - view.scrollX).toFloat(),
        (view.totalPaddingTop - view.scrollY).toFloat()
      )
    }
    if (view.javaClass.name != PREPARED_LAYOUT_TEXT_VIEW) {
      return null
    }
    // React Native's text view is internal. It draws its prepared layout at the padding plus the
    // vertical offset of the layout.
    return try {
      val preparedLayout = preparedLayoutGetter(view.javaClass).invoke(view) ?: return null
      val preparedLayoutClass = preparedLayout.javaClass
      val layout = preparedLayoutClass.getMethod("getLayout").invoke(preparedLayout) as Layout
      val verticalOffset = preparedLayoutClass.getMethod("getVerticalOffset").invoke(preparedLayout) as Float
      TextLayout(layout, view.paddingLeft.toFloat(), view.paddingTop + verticalOffset)
    } catch (e: ReflectiveOperationException) {
      null
    }
  }

  /** One run per line and style, at the position the layout drew it. */
  private fun serializeRuns(text: TextLayout): JSONArray {
    val layout = text.layout
    val source = layout.text
    val spanned = source as? Spanned
    val runs = JSONArray()
    for (line in 0 until layout.lineCount) {
      val lineStart = layout.getLineStart(line)
      val ellipsisCount = layout.getEllipsisCount(line)
      val visibleEnd = if (ellipsisCount > 0) lineStart + layout.getEllipsisStart(line) else layout.getLineEnd(line)
      val baseline = layout.getLineBaseline(line).toFloat()
      var start = lineStart
      var lastPaint: TextPaint? = null
      while (start < visibleEnd) {
        val end = spanned?.nextSpanTransition(start, visibleEnd, CharacterStyle::class.java) ?: visibleEnd
        val segment = source.subSequence(start, end).toString().trimEnd('\n', '\r')
        val spans = spanned?.getSpans(start, end, CharacterStyle::class.java) ?: emptyArray()
        // Inline views draw themselves; their placeholder has no text.
        if (segment.isNotBlank() && spans.none { it is ReplacementSpan }) {
          val paint = TextPaint(layout.paint)
          spans.forEach { it.updateDrawState(paint) }
          val x = text.left + layout.getPrimaryHorizontal(start)
          runs.put(serializeRun(segment, x, text.top + baseline, paint, spans))
          lastPaint = paint
        }
        start = end
      }
      if (ellipsisCount > 0 && lastPaint != null) {
        val x = text.left + layout.getPrimaryHorizontal(visibleEnd.coerceAtMost(layout.getLineEnd(line)))
        runs.put(serializeRun(ELLIPSIS, x, text.top + baseline, lastPaint, emptyArray()))
      }
    }
    return runs
  }

  private fun serializeRun(text: String, x: Float, baseline: Float, paint: TextPaint, spans: Array<CharacterStyle>): JSONObject {
    val run = JSONObject()
      .put("text", text)
      .put("x", x.toDouble())
      .put("y", baseline.toDouble())
      .put("fontSize", paint.textSize.toDouble())
      .put("color", paint.color)
    val typeface = paint.typeface
    if (typeface != null) {
      val weight = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) typeface.weight else if (typeface.isBold) 700 else 400
      run.put("fontWeight", weight)
      if (typeface.isItalic) {
        run.put("fontStyle", "italic")
      }
    }
    spans.firstNotNullOfOrNull { fontFamilyOf(it) }?.let { run.put("fontFamily", it) }
    if (paint.letterSpacing != 0f) {
      run.put("letterSpacing", paint.letterSpacing.toDouble())
    }
    if (paint.isFakeBoldText) {
      run.put("fakeBold", true)
    }
    if (paint.textSkewX != 0f) {
      run.put("skewX", paint.textSkewX.toDouble())
    }
    if (paint.isUnderlineText) {
      run.put("underline", true)
    }
    if (paint.isStrikeThruText) {
      run.put("strikethrough", true)
    }
    return run
  }

  /** React Native's `CustomStyleSpan` is internal; its `fontFamily` getter is read through reflection. */
  private fun fontFamilyOf(span: CharacterStyle): String? {
    if (span is TypefaceSpan) {
      return span.family
    }
    if (span.javaClass.name != CUSTOM_STYLE_SPAN) {
      return null
    }
    return try {
      span.javaClass.getMethod("getFontFamily").invoke(span) as? String
    } catch (e: ReflectiveOperationException) {
      null
    }
  }

  // endregion

  companion object {
    private const val MAX_VIEWS = 5000
    private const val ELLIPSIS = "…"
    private const val PREPARED_LAYOUT_TEXT_VIEW = "com.facebook.react.views.text.PreparedLayoutTextView"
    private const val CUSTOM_STYLE_SPAN = "com.facebook.react.views.text.internal.span.CustomStyleSpan"

    private var preparedLayoutGetter: Method? = null

    private fun preparedLayoutGetter(viewClass: Class<*>): Method =
      preparedLayoutGetter ?: viewClass.getMethod("getPreparedLayout").also { preparedLayoutGetter = it }
  }
}
