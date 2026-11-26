package expo.modules.splashscreen

import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.views.view.ReactViewGroup
import org.json.JSONArray
import org.json.JSONObject

/**
 * Serializes what is on screen in `root` into a Fabric template node
 * `{ "name": "View" | "Paragraph" | "Text" | "RawText", "props": {...}, "children": [...] }`.
 *
 * Only views that are attached and visible are serialized, at the frames Android resolved (scroll
 * offsets, insets and translations included), as absolutely positioned nodes in dp. React Native
 * views contribute their props from the app's shadow tree (`nodes`, by tag, as
 * [SplashScreenPrerenderNative.captureProps] returns them): the visual props of views, and the text
 * props and text children of paragraphs, which Fabric then lays out the way it did for the app.
 * Other views (the window background, native bars) contribute their color background and their
 * text. Images and text inputs are left out.
 */
internal class SplashScreenSnapshot(
  private val root: View,
  private val exclude: View?,
  private val nodes: JSONObject,
  private val debug: Boolean
) {
  private var budget = MAX_VIEWS
  private val density = root.resources.displayMetrics.density
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
    val template = serializeView(root, Rect(0, 0, 0, 0), JSONObject(), 0) ?: return null
    val props = template.getJSONObject("props")
    props.remove("position")
    props.remove("left")
    props.remove("top")
    return template
  }

  private fun serializeView(view: View, parentFrame: Rect, parentProps: JSONObject, depth: Int): JSONObject? {
    if (view.visibility != View.VISIBLE || view.alpha <= 0.01f || view === exclude || depth > 80 || --budget < 0) {
      return null
    }
    if (view is ImageView || view is EditText) {
      // Nothing to draw without an image loader, and no typed text in the snapshot.
      return null
    }
    view.getLocationInWindow(location)
    val left = location[0] - rootLocation[0]
    val top = location[1] - rootLocation[1]
    val frame = Rect(left, top, left + view.width, top + view.height)
    val clips = clipsChildren(view)
    val viewGroup = view as? ViewGroup
    if (!Rect.intersects(frame, rootBounds) && (clips || viewGroup == null || viewGroup.childCount == 0)) {
      return null
    }

    val props = JSONObject()
    if (debug) {
      props.put("_class", view.javaClass.name)
    }
    // Absolute insets start at the parent's padding box, inside its border.
    props.put("position", "absolute")
    props.put("left", dp(frame.left - parentFrame.left) - borderWidth(parentProps, "Left", "Start"))
    props.put("top", dp(frame.top - parentFrame.top) - borderWidth(parentProps, "Top", null))
    props.put("width", dp(frame.width()))
    props.put("height", dp(frame.height()))
    if (view.alpha < 1f) {
      props.put("opacity", view.alpha.toDouble())
    }
    if (clips) {
      props.put("overflow", "hidden")
    }

    val node = if (view.id > 0 && isReactView(view)) nodes.optJSONObject(view.id.toString()) else null
    if (node?.optString("name") == "Paragraph") {
      return serializeParagraph(node, props)
    }
    if (node != null) {
      copyProps(node.optJSONObject("props"), props) { isVisualViewProp(it) }
    } else {
      serializeNativeBackground(view, props)
      if (view is TextView) {
        return serializeTextView(view, props)
      }
    }

    val children = JSONArray()
    if (viewGroup != null) {
      for (child in childrenInDrawingOrder(viewGroup)) {
        serializeView(child, frame, props, depth + 1)?.let { children.put(it) }
      }
    }
    return node("View", props, children)
  }

  private fun node(name: String, props: JSONObject, children: JSONArray) =
    JSONObject().put("name", name).put("props", props).put("children", children)

  private fun dp(px: Int): Double = (px / density).toDouble()

  private fun borderWidth(props: JSONObject, edge: String, logicalEdge: String?): Double {
    props.optDouble("border${edge}Width").takeIf { !it.isNaN() }?.let { return it }
    if (logicalEdge != null) {
      props.optDouble("border${logicalEdge}Width").takeIf { !it.isNaN() }?.let { return it }
    }
    return props.optDouble("borderWidth").takeIf { !it.isNaN() } ?: 0.0
  }

  private fun isReactView(view: View): Boolean =
    view is ReactViewGroup || view.javaClass.name.startsWith("com.facebook.react.")

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

  private fun copyProps(source: JSONObject?, target: JSONObject, include: (String) -> Boolean) {
    source ?: return
    for (key in source.keys()) {
      if (include(key) && !target.has(key)) {
        target.put(key, source.get(key))
      }
    }
  }

  // region Paragraphs

  /** A React Native paragraph: its text props and text children, laid out again by Fabric. */
  private fun serializeParagraph(node: JSONObject, props: JSONObject): JSONObject? {
    copyProps(node.optJSONObject("props"), props) { !EXCLUDED_PARAGRAPH_PROPS.contains(it) && !it.startsWith("accessibility") }
    node.optJSONArray("padding")?.let { padding ->
      PADDING_PROPS.forEachIndexed { index, key ->
        val value = padding.optDouble(index)
        if (value > 0) {
          props.put(key, value)
        }
      }
    }
    val children = node.optJSONArray("children") ?: JSONArray()
    if (children.length() == 0) {
      return null
    }
    return node("Paragraph", props, children)
  }

  /** A native text view (bar titles, tab labels), as a paragraph with one text run. */
  private fun serializeTextView(view: TextView, props: JSONObject): JSONObject? {
    val text = view.layout?.text?.toString() ?: view.text?.toString()
    if (text.isNullOrEmpty()) {
      return null
    }
    props.put("allowFontScaling", false)
    props.put("includeFontPadding", view.includeFontPadding)
    props.put("fontSize", (view.textSize / density).toDouble())
    props.put("color", view.currentTextColor)
    view.typeface?.let { typeface ->
      val weight = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) typeface.weight else if (typeface.isBold) 700 else 400
      props.put("fontWeight", weight.toString())
      if (typeface.isItalic) {
        props.put("fontStyle", "italic")
      }
    }
    if (view.letterSpacing != 0f) {
      props.put("letterSpacing", (view.letterSpacing * view.textSize / density).toDouble())
    }
    // The text is laid out again in a frame that fits it exactly; any rounding must not wrap it.
    val lineCount = view.layout?.lineCount ?: 0
    if (lineCount > 0) {
      props.put("numberOfLines", lineCount)
      props.put("ellipsizeMode", "clip")
    } else if (view.maxLines in 1 until Int.MAX_VALUE) {
      props.put("numberOfLines", view.maxLines)
    }
    // A native text view is exactly as wide as its text, and Fabric can measure the same text a
    // fraction wider. The frame grows away from the text's alignment edge, so the text stays where it
    // was and does not wrap.
    val slack = (props.getDouble("width") * 0.25).coerceAtLeast(8.0)
    props.put("width", props.getDouble("width") + slack)
    when (Gravity.getAbsoluteGravity(view.gravity, view.layoutDirection) and Gravity.HORIZONTAL_GRAVITY_MASK) {
      Gravity.CENTER_HORIZONTAL -> {
        props.put("textAlign", "center")
        props.put("left", props.getDouble("left") - slack / 2)
      }
      Gravity.RIGHT -> {
        props.put("textAlign", "right")
        props.put("left", props.getDouble("left") - slack)
      }
    }
    props.put("paddingLeft", dp(view.totalPaddingLeft))
    props.put("paddingTop", dp(view.totalPaddingTop))
    props.put("paddingRight", dp(view.totalPaddingRight))
    props.put("paddingBottom", dp(view.totalPaddingBottom))
    val rawText = node("RawText", JSONObject().put("text", text), JSONArray())
    return node("Paragraph", props, JSONArray().put(rawText))
  }

  // endregion

  private fun serializeNativeBackground(view: View, props: JSONObject) {
    val backgroundColor = BackgroundStyleApplicator.getBackgroundColor(view)
      ?: (view.background as? ColorDrawable)?.takeIf { it.alpha > 0 }?.color
    if (backgroundColor != null && Color.alpha(backgroundColor) > 0) {
      props.put("backgroundColor", backgroundColor)
    }
  }

  companion object {
    private const val MAX_VIEWS = 5000

    private val PADDING_PROPS = listOf("paddingLeft", "paddingTop", "paddingRight", "paddingBottom")

    /** View props that only change how the view draws. Layout comes from the frames. */
    private fun isVisualViewProp(key: String): Boolean =
      key.startsWith("border") ||
        key.startsWith("background") ||
        key.startsWith("outline") ||
        key.startsWith("shadow") ||
        key == "boxShadow" ||
        key == "elevation" ||
        key == "filter" ||
        key == "mixBlendMode"

    /** Paragraph props that are layout (the frame replaces them), interaction or accessibility. */
    private val EXCLUDED_PARAGRAPH_PROPS = setOf(
      "top", "left", "right", "bottom", "position", "transform", "transformOrigin", "opacity", "overflow",
      "zIndex", "onLayout", "onTextLayout", "pointerEvents", "collapsable", "collapsableChildren", "testID",
      "nativeID", "accessible", "importantForAccessibility", "focusable", "hitSlop", "selectable", "disabled",
      "role", "isPressable", "isHighlighted", "dataDetectorType", "selectionColor"
    )

    /**
     * Fonts the app registers from JS (icon fonts, most brand fonts) do not exist before JS runs.
     * Text in those fonts would draw in the default font, often as boxes, so it is left out: a
     * paragraph whose own family is missing, or a text run whose family is missing.
     */
    fun removeUnavailableFonts(context: Context, node: JSONObject): JSONObject? =
      removeUnavailableFonts(node, FontAvailability(context))

    private fun removeUnavailableFonts(node: JSONObject, fonts: FontAvailability): JSONObject? {
      val name = node.optString("name")
      val family = node.optJSONObject("props")?.optString("fontFamily")?.takeIf { it.isNotEmpty() }
      if ((name == "Paragraph" || name == "Text") && family != null && !fonts.isAvailable(family)) {
        return null
      }
      val children = node.optJSONArray("children") ?: return node
      val kept = JSONArray()
      for (index in 0 until children.length()) {
        removeUnavailableFonts(children.getJSONObject(index), fonts)?.let { kept.put(it) }
      }
      if (name == "Paragraph" && kept.length() == 0) {
        return null
      }
      return node.put("children", kept)
    }
  }

  /** Font families that exist before JS runs: system fonts, fonts in `assets/fonts`, and fonts registered natively. */
  private class FontAvailability(private val context: Context) {
    private val assetFonts: Set<String> by lazy {
      context.assets.list("fonts")?.map { it.substringBeforeLast('.') }?.toSet() ?: emptySet()
    }
    private val cache = HashMap<String, Boolean>()

    fun isAvailable(family: String): Boolean = cache.getOrPut(family) {
      ReactFontManager.getInstance().customFontFamilies.contains(family) ||
        // `ReactFontManager` loads `fonts/<family>{,_bold,_italic,_bold_italic}.{ttf,otf}` from the assets.
        assetFonts.any { it == family || it.startsWith("${family}_") } ||
        // A system family (`sans-serif-medium`, `serif`, ...) resolves to its own typeface.
        Typeface.create(family, Typeface.NORMAL) != Typeface.DEFAULT ||
        family == "sans-serif"
    }
  }
}
