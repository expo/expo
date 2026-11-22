package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.text.TextPaint
import android.view.View
import android.view.ViewGroup
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import org.json.JSONArray
import org.json.JSONObject

/**
 * One node of a snapshot written by [SplashScreenSnapshot]: a view at a fixed frame, with the
 * background React Native would draw for it, and text runs drawn where the original layout put them.
 */
@SuppressLint("ViewConstructor")
internal class SplashScreenSnapshotView private constructor(
  context: Context,
  private val frameLeft: Int,
  private val frameTop: Int,
  private val frameWidth: Int,
  private val frameHeight: Int,
  private val clips: Boolean,
  private val runs: List<TextRun>
) : ViewGroup(context) {
  private class TextRun(val text: String, val x: Float, val y: Float, val paint: TextPaint)

  init {
    clipChildren = false
    clipToPadding = false
    isClickable = false
    isFocusable = false
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    setWillNotDraw(runs.isEmpty())
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    for (index in 0 until childCount) {
      val child = getChildAt(index) as SplashScreenSnapshotView
      child.measure(
        MeasureSpec.makeMeasureSpec(child.frameWidth, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(child.frameHeight, MeasureSpec.EXACTLY)
      )
    }
    setMeasuredDimension(frameWidth, frameHeight)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    for (index in 0 until childCount) {
      val child = getChildAt(index) as SplashScreenSnapshotView
      child.layout(child.frameLeft, child.frameTop, child.frameLeft + child.frameWidth, child.frameTop + child.frameHeight)
    }
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    for (run in runs) {
      canvas.drawText(run.text, run.x, run.y, run.paint)
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (clips) {
      canvas.save()
      canvas.clipRect(0, 0, width, height)
      super.dispatchDraw(canvas)
      canvas.restore()
    } else {
      super.dispatchDraw(canvas)
    }
  }

  override fun hasOverlappingRendering(): Boolean = alpha < 1f

  companion object {
    /** Builds the view tree of a template node. Main thread. */
    fun build(context: Context, node: JSONObject): SplashScreenSnapshotView {
      // `BackgroundStyleApplicator` converts border widths with the display metrics React Native
      // sets up when its instance starts, which is after this runs.
      DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
      val fonts = FontResolver(context)
      return build(context, node, fonts)
    }

    private fun build(context: Context, node: JSONObject, fonts: FontResolver): SplashScreenSnapshotView {
      val props = node.optJSONObject("props") ?: JSONObject()
      val runs = props.optJSONArray("runs")?.let { textRuns(it, fonts) } ?: emptyList()
      val view = SplashScreenSnapshotView(
        context,
        props.optInt("left"),
        props.optInt("top"),
        props.optInt("width"),
        props.optInt("height"),
        props.optString("overflow") == "hidden",
        runs
      )
      if (props.has("opacity")) {
        view.alpha = props.optDouble("opacity", 1.0).toFloat()
      }
      applyBackground(view, props)
      if (props.has("elevation")) {
        view.elevation = props.optDouble("elevation").toFloat()
      }
      val children = node.optJSONArray("children")
      if (children != null) {
        for (index in 0 until children.length()) {
          view.addView(build(context, children.getJSONObject(index), fonts))
        }
      }
      return view
    }

    private fun applyBackground(view: View, props: JSONObject) {
      if (props.has("backgroundColor")) {
        BackgroundStyleApplicator.setBackgroundColor(view, props.getInt("backgroundColor"))
      }
      props.optJSONObject("borderWidth")?.let { widths ->
        for (key in widths.keys()) {
          val edge = enumValueOrNull<LogicalEdge>(key) ?: continue
          BackgroundStyleApplicator.setBorderWidth(view, edge, widths.getDouble(key).toFloat())
        }
      }
      props.optJSONObject("borderColor")?.let { colors ->
        for (key in colors.keys()) {
          val edge = enumValueOrNull<LogicalEdge>(key) ?: continue
          BackgroundStyleApplicator.setBorderColor(view, edge, colors.getInt(key))
        }
      }
      enumValueOrNull<BorderStyle>(props.optString("borderStyle"))?.let {
        BackgroundStyleApplicator.setBorderStyle(view, it)
      }
      props.optJSONObject("borderRadius")?.let { radii ->
        for (key in radii.keys()) {
          val corner = enumValueOrNull<BorderRadiusProp>(key) ?: continue
          val radius = radii.getJSONArray(key)
          val type = enumValueOrNull<LengthPercentageType>(radius.optString(1)) ?: continue
          BackgroundStyleApplicator.setBorderRadius(view, corner, LengthPercentage(radius.getDouble(0).toFloat(), type))
        }
      }
    }

    private fun textRuns(runs: JSONArray, fonts: FontResolver): List<TextRun> {
      val result = ArrayList<TextRun>(runs.length())
      for (index in 0 until runs.length()) {
        val run = runs.getJSONObject(index)
        val weight = run.optInt("fontWeight", 400)
        val italic = run.optString("fontStyle") == "italic"
        val family = run.optString("fontFamily").takeIf { it.isNotEmpty() }
        // A font the app registers from JS (icon fonts, most brand fonts) does not exist yet. Its
        // glyphs in the default font would be wrong, often boxes, so such runs are left out.
        val typeface = fonts.typeface(family, weight, italic) ?: continue
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
          this.typeface = typeface
          textSize = run.optDouble("fontSize", 14.0).toFloat()
          color = run.optInt("color")
          letterSpacing = run.optDouble("letterSpacing", 0.0).toFloat()
          isFakeBoldText = run.optBoolean("fakeBold")
          textSkewX = run.optDouble("skewX", 0.0).toFloat()
          isUnderlineText = run.optBoolean("underline")
          isStrikeThruText = run.optBoolean("strikethrough")
        }
        result.add(TextRun(run.getString("text"), run.optDouble("x").toFloat(), run.optDouble("y").toFloat(), paint))
      }
      return result
    }

    private inline fun <reified T : Enum<T>> enumValueOrNull(name: String?): T? =
      enumValues<T>().firstOrNull { it.name == name }
  }

  /** Typefaces that exist before JS runs: system fonts, fonts in `assets/fonts`, and fonts registered natively. */
  private class FontResolver(private val context: Context) {
    private val assetFonts: Set<String> by lazy {
      context.assets.list("fonts")?.map { it.substringBeforeLast('.') }?.toSet() ?: emptySet()
    }
    private val cache = HashMap<String, Typeface?>()

    fun typeface(family: String?, weight: Int, italic: Boolean): Typeface? {
      val key = "$family $weight $italic"
      return cache.getOrPut(key) {
        if (family == null) {
          defaultTypeface(weight, italic)
        } else if (isAvailable(family)) {
          ReactFontManager.getInstance().getTypeface(family, weight, italic, context.assets)
        } else {
          null
        }
      }
    }

    private fun isAvailable(family: String): Boolean {
      if (ReactFontManager.getInstance().customFontFamilies.contains(family)) {
        return true
      }
      // `ReactFontManager` loads `fonts/<family>{,_bold,_italic,_bold_italic}.{ttf,otf}` from the assets.
      if (assetFonts.any { it == family || it.startsWith("${family}_") }) {
        return true
      }
      // A system family (`sans-serif-medium`, `serif`, ...) resolves to its own typeface.
      return Typeface.create(family, Typeface.NORMAL) != Typeface.DEFAULT || family == "sans-serif"
    }

    private fun defaultTypeface(weight: Int, italic: Boolean): Typeface =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        Typeface.create(Typeface.DEFAULT, weight, italic)
      } else {
        val bold = weight >= 600
        Typeface.defaultFromStyle(
          when {
            bold && italic -> Typeface.BOLD_ITALIC
            bold -> Typeface.BOLD
            italic -> Typeface.ITALIC
            else -> Typeface.NORMAL
          }
        )
      }
  }
}
