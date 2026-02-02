package expo.modules.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.with
import android.graphics.Color as AndroidColor

enum class HorizontalArrangement(val value: String) : Enumerable {
  START("start"),
  END("end"),
  CENTER("center"),
  SPACE_BETWEEN("spaceBetween"),
  SPACE_AROUND("spaceAround"),
  SPACE_EVENLY("spaceEvenly");

  fun toComposeArrangement(): Arrangement.Horizontal {
    return when (this) {
      START -> Arrangement.Start
      END -> Arrangement.End
      CENTER -> Arrangement.Center
      SPACE_BETWEEN -> Arrangement.SpaceBetween
      SPACE_AROUND -> Arrangement.SpaceAround
      SPACE_EVENLY -> Arrangement.SpaceEvenly
    }
  }
}

enum class VerticalArrangement(val value: String) : Enumerable {
  TOP("top"),
  BOTTOM("bottom"),
  CENTER("center"),
  SPACE_BETWEEN("spaceBetween"),
  SPACE_AROUND("spaceAround"),
  SPACE_EVENLY("spaceEvenly");

  fun toComposeArrangement(): Arrangement.Vertical {
    return when (this) {
      TOP -> Arrangement.Top
      BOTTOM -> Arrangement.Bottom
      CENTER -> Arrangement.Center
      SPACE_BETWEEN -> Arrangement.SpaceBetween
      SPACE_AROUND -> Arrangement.SpaceAround
      SPACE_EVENLY -> Arrangement.SpaceEvenly
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

data class LayoutProps(
  val horizontalArrangement: HorizontalArrangement = HorizontalArrangement.START,
  val verticalArrangement: VerticalArrangement = VerticalArrangement.TOP,
  val horizontalAlignment: HorizontalAlignment = HorizontalAlignment.START,
  val verticalAlignment: VerticalAlignment = VerticalAlignment.TOP,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
internal fun FunctionalComposableScope.RowContent(props: LayoutProps) {
  Row(
    horizontalArrangement = props.horizontalArrangement.toComposeArrangement(),
    verticalAlignment = props.verticalAlignment.toComposeAlignment(),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
  ) {
    Children(ComposableScope().with(rowScope = this@Row))
  }
}

@Composable
internal fun FunctionalComposableScope.ColumnContent(props: LayoutProps) {
  Column(
    verticalArrangement = props.verticalArrangement.toComposeArrangement(),
    horizontalAlignment = props.horizontalAlignment.toComposeAlignment(),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
  ) {
    Children(ComposableScope().with(columnScope = this@Column))
  }
}

@Composable
fun FunctionalComposableScope.BoxContent(props: LayoutProps) {
  Box(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
  ) {
    Children(ComposableScope().with(boxScope = this@Box))
  }
}

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

data class TextProps(
  val text: String = "",
  val color: AndroidColor? = null,
  val fontSize: Float = 16f,
  val fontWeight: TextFontWeight = TextFontWeight.NORMAL,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.TextContent(props: TextProps) {
  Text(
    text = props.text,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope),
    color = colorToComposeColor(props.color),
    style = TextStyle(
      fontSize = props.fontSize.sp,
      fontWeight = props.fontWeight.toComposeFontWeight()
    )
  )
}
