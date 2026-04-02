package expo.modules.ui

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.sp
import com.facebook.react.common.assets.ReactFontManager
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

enum class TextFontWeight(val value: String) : Enumerable {
  NORMAL("normal"),
  BOLD("bold"),
  W100("100"),
  W200("200"),
  W300("300"),
  W400("400"),
  W500("500"),
  W600("600"),
  W700("700"),
  W800("800"),
  W900("900");

  fun toComposeFontWeight(): FontWeight {
    return when (this) {
      NORMAL -> FontWeight.Normal
      BOLD -> FontWeight.Bold
      W100 -> FontWeight.W100
      W200 -> FontWeight.W200
      W300 -> FontWeight.W300
      W400 -> FontWeight.W400
      W500 -> FontWeight.W500
      W600 -> FontWeight.W600
      W700 -> FontWeight.W700
      W800 -> FontWeight.W800
      W900 -> FontWeight.W900
    }
  }
}

enum class TextFontStyle(val value: String) : Enumerable {
  NORMAL("normal"),
  ITALIC("italic");

  fun toComposeFontStyle(): FontStyle {
    return when (this) {
      NORMAL -> FontStyle.Normal
      ITALIC -> FontStyle.Italic
    }
  }
}

enum class TextAlignType(val value: String) : Enumerable {
  LEFT("left"),
  RIGHT("right"),
  CENTER("center"),
  JUSTIFY("justify"),
  START("start"),
  END("end");

  fun toComposeTextAlign(): TextAlign {
    return when (this) {
      LEFT -> TextAlign.Left
      RIGHT -> TextAlign.Right
      CENTER -> TextAlign.Center
      JUSTIFY -> TextAlign.Justify
      START -> TextAlign.Start
      END -> TextAlign.End
    }
  }
}

enum class TextDecorationType(val value: String) : Enumerable {
  NONE("none"),
  UNDERLINE("underline"),
  LINE_THROUGH("lineThrough");

  fun toComposeTextDecoration(): TextDecoration {
    return when (this) {
      NONE -> TextDecoration.None
      UNDERLINE -> TextDecoration.Underline
      LINE_THROUGH -> TextDecoration.LineThrough
    }
  }
}

enum class TextOverflowType(val value: String) : Enumerable {
  CLIP("clip"),
  ELLIPSIS("ellipsis"),
  VISIBLE("visible");

  fun toComposeTextOverflow(): TextOverflow {
    return when (this) {
      CLIP -> TextOverflow.Clip
      ELLIPSIS -> TextOverflow.Ellipsis
      VISIBLE -> TextOverflow.Visible
    }
  }
}

enum class TextLineBreakType(val value: String) : Enumerable {
  SIMPLE("simple"),
  HEADING("heading"),
  PARAGRAPH("paragraph");

  fun toComposeLineBreak(): androidx.compose.ui.text.style.LineBreak {
    return when (this) {
      SIMPLE -> androidx.compose.ui.text.style.LineBreak.Simple
      HEADING -> androidx.compose.ui.text.style.LineBreak.Heading
      PARAGRAPH -> androidx.compose.ui.text.style.LineBreak.Paragraph
    }
  }
}

fun resolveFontFamily(name: String?, context: Context): FontFamily? {
  if (name == null) return null
  return when (name) {
    "default" -> FontFamily.Default
    "sansSerif" -> FontFamily.SansSerif
    "serif" -> FontFamily.Serif
    "monospace" -> FontFamily.Monospace
    "cursive" -> FontFamily.Cursive
    else -> {
      val typeface = ReactFontManager.getInstance().getTypeface(name, Typeface.NORMAL, context.assets)
      FontFamily(typeface)
    }
  }
}

data class TextShadowRecord(
  @Field val color: Color? = null,
  @Field val offsetX: Float? = null,
  @Field val offsetY: Float? = null,
  @Field val blurRadius: Float? = null
) : Record {
  fun toComposeShadow(): Shadow {
    return Shadow(
      color = colorToComposeColorOrNull(color) ?: androidx.compose.ui.graphics.Color.Black,
      offset = Offset(offsetX ?: 0f, offsetY ?: 0f),
      blurRadius = blurRadius ?: 0f
    )
  }
}

enum class TypographyStyle(val value: String) : Enumerable {
  DISPLAY_LARGE("displayLarge"),
  DISPLAY_MEDIUM("displayMedium"),
  DISPLAY_SMALL("displaySmall"),
  HEADLINE_LARGE("headlineLarge"),
  HEADLINE_MEDIUM("headlineMedium"),
  HEADLINE_SMALL("headlineSmall"),
  TITLE_LARGE("titleLarge"),
  TITLE_MEDIUM("titleMedium"),
  TITLE_SMALL("titleSmall"),
  BODY_LARGE("bodyLarge"),
  BODY_MEDIUM("bodyMedium"),
  BODY_SMALL("bodySmall"),
  LABEL_LARGE("labelLarge"),
  LABEL_MEDIUM("labelMedium"),
  LABEL_SMALL("labelSmall");

  @Composable
  fun toTextStyle(): TextStyle {
    val typography = MaterialTheme.typography
    return when (this) {
      DISPLAY_LARGE -> typography.displayLarge
      DISPLAY_MEDIUM -> typography.displayMedium
      DISPLAY_SMALL -> typography.displaySmall
      HEADLINE_LARGE -> typography.headlineLarge
      HEADLINE_MEDIUM -> typography.headlineMedium
      HEADLINE_SMALL -> typography.headlineSmall
      TITLE_LARGE -> typography.titleLarge
      TITLE_MEDIUM -> typography.titleMedium
      TITLE_SMALL -> typography.titleSmall
      BODY_LARGE -> typography.bodyLarge
      BODY_MEDIUM -> typography.bodyMedium
      BODY_SMALL -> typography.bodySmall
      LABEL_LARGE -> typography.labelLarge
      LABEL_MEDIUM -> typography.labelMedium
      LABEL_SMALL -> typography.labelSmall
    }
  }
}

/**
 * Shared text and span-level style properties.
 * Both TextSpanRecord and TextProps implement this to ensure style properties
 * are consistent across parent text and nested spans.
 */
interface TextSpanStyle {
  val text: String
  val color: Color?
  val fontSize: Float?
  val fontWeight: TextFontWeight?
  val fontStyle: TextFontStyle?
  val fontFamily: String?
  val textDecoration: TextDecorationType?
  val letterSpacing: Float?
  val background: Color?
  val shadow: TextShadowRecord?
}

data class TextSpanRecord(
  @Field override val text: String = "",
  @Field val children: List<TextSpanRecord>? = null,
  @Field override val color: Color? = null,
  @Field override val fontSize: Float? = null,
  @Field override val fontWeight: TextFontWeight? = null,
  @Field override val fontStyle: TextFontStyle? = null,
  @Field override val fontFamily: String? = null,
  @Field override val textDecoration: TextDecorationType? = null,
  @Field override val letterSpacing: Float? = null,
  @Field override val background: Color? = null,
  @Field override val shadow: TextShadowRecord? = null
) : Record, TextSpanStyle

data class TextProps(
  override val text: String = "",
  val spans: List<TextSpanRecord>? = null,
  override val color: Color? = null,
  val typography: TypographyStyle? = null,
  override val fontSize: Float? = null,
  override val fontWeight: TextFontWeight? = null,
  override val fontStyle: TextFontStyle? = null,
  override val fontFamily: String? = null,
  val textAlign: TextAlignType? = null,
  override val textDecoration: TextDecorationType? = null,
  override val letterSpacing: Float? = null,
  val lineHeight: Float? = null,
  val lineBreak: TextLineBreakType? = null,
  override val background: Color? = null,
  override val shadow: TextShadowRecord? = null,
  val overflow: TextOverflowType? = null,
  val softWrap: Boolean? = null,
  val maxLines: Int? = null,
  val minLines: Int? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps, TextSpanStyle

private fun AnnotatedString.Builder.appendSpans(spans: List<TextSpanRecord>, context: Context?) {
  for (span in spans) {
    val style = SpanStyle(
      color = colorToComposeColorOrNull(span.color) ?: androidx.compose.ui.graphics.Color.Unspecified,
      fontSize = span.fontSize?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified,
      fontWeight = span.fontWeight?.toComposeFontWeight(),
      fontStyle = span.fontStyle?.toComposeFontStyle(),
      fontFamily = context?.let { resolveFontFamily(span.fontFamily, it) },
      textDecoration = span.textDecoration?.toComposeTextDecoration(),
      letterSpacing = span.letterSpacing?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified,
      background = colorToComposeColorOrNull(span.background) ?: androidx.compose.ui.graphics.Color.Unspecified,
      shadow = span.shadow?.toComposeShadow()
    )
    if (span.children != null) {
      withStyle(style) {
        appendSpans(span.children, context)
      }
    } else {
      withStyle(style) {
        append(span.text)
      }
    }
  }
}

@Composable
fun FunctionalComposableScope.TextContent(props: TextProps) {
  // Start with typography style if provided, otherwise use default
  val baseStyle = props.typography?.toTextStyle() ?: TextStyle.Default

  // Merge base style with custom properties
  val mergedStyle = baseStyle.merge(
    TextStyle(
      color = colorToComposeColor(props.color),
      fontSize = props.fontSize?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified,
      fontWeight = props.fontWeight?.toComposeFontWeight(),
      fontStyle = props.fontStyle?.toComposeFontStyle(),
      fontFamily = appContext.reactContext?.let { resolveFontFamily(props.fontFamily, it) },
      textDecoration = props.textDecoration?.toComposeTextDecoration(),
      letterSpacing = props.letterSpacing?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified,
      lineHeight = props.lineHeight?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified,
      lineBreak = props.lineBreak?.toComposeLineBreak() ?: androidx.compose.ui.text.style.LineBreak.Unspecified,
      background = colorToComposeColorOrNull(props.background) ?: androidx.compose.ui.graphics.Color.Unspecified,
      shadow = props.shadow?.toComposeShadow()
    )
  )

  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val textValue = if (props.spans != null) {
    val context = appContext.reactContext
    buildAnnotatedString {
      appendSpans(props.spans, context)
    }
  } else {
    AnnotatedString(props.text)
  }

  Text(
    text = textValue,
    modifier = modifier,
    textAlign = props.textAlign?.toComposeTextAlign(),
    overflow = props.overflow?.toComposeTextOverflow() ?: TextOverflow.Clip,
    softWrap = props.softWrap ?: true,
    maxLines = props.maxLines ?: Int.MAX_VALUE,
    minLines = props.minLines ?: 1,
    style = mergedStyle
  )
}
