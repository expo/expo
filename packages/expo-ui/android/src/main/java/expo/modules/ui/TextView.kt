package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp
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

data class TextProps(
  val text: String = "",
  val color: Color? = null,
  val typography: TypographyStyle? = null,
  val fontSize: Float? = null,
  val fontWeight: TextFontWeight? = null,
  val fontStyle: TextFontStyle? = null,
  val textAlign: TextAlignType? = null,
  val textDecoration: TextDecorationType? = null,
  val letterSpacing: Float? = null,
  val lineHeight: Float? = null,
  val overflow: TextOverflowType? = null,
  val softWrap: Boolean? = null,
  val maxLines: Int? = null,
  val minLines: Int? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.TextContent(props: TextProps) {
  // Start with typography style if provided, otherwise use default
  val baseStyle = props.typography?.toTextStyle() ?: TextStyle.Default

  // Merge base style with custom properties
  val mergedStyle = baseStyle.merge(
    TextStyle(
      fontSize = props.fontSize?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified,
      fontWeight = props.fontWeight?.toComposeFontWeight(),
      fontStyle = props.fontStyle?.toComposeFontStyle(),
      textDecoration = props.textDecoration?.toComposeTextDecoration(),
      letterSpacing = props.letterSpacing?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified,
      lineHeight = props.lineHeight?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified
    )
  )

  Text(
    text = props.text,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    color = colorToComposeColor(props.color),
    textAlign = props.textAlign?.toComposeTextAlign(),
    overflow = props.overflow?.toComposeTextOverflow() ?: TextOverflow.Clip,
    softWrap = props.softWrap ?: true,
    maxLines = props.maxLines ?: Int.MAX_VALUE,
    minLines = props.minLines ?: 1,
    style = mergedStyle
  )
}
