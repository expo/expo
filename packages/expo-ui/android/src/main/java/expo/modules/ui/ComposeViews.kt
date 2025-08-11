package expo.modules.ui

import android.content.Context
import android.graphics.Color as AndroidColor
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

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
  val horizontalArrangement: MutableState<HorizontalArrangement> = mutableStateOf(HorizontalArrangement.START),
  val verticalArrangement: MutableState<VerticalArrangement> = mutableStateOf(VerticalArrangement.TOP),
  val horizontalAlignment: MutableState<HorizontalAlignment> = mutableStateOf(HorizontalAlignment.START),
  val verticalAlignment: MutableState<VerticalAlignment> = mutableStateOf(VerticalAlignment.TOP),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class RowView(context: Context, appContext: AppContext) : ExpoComposeView<LayoutProps>(context, appContext) {
  override val props = LayoutProps()

  @Composable
  override fun Content(modifier: Modifier) {
    Row(
      horizontalArrangement = props.horizontalArrangement.value.toComposeArrangement(),
      verticalAlignment = props.verticalAlignment.value.toComposeAlignment(),
      modifier = modifier.then(Modifier.fromExpoModifiers(props.modifiers.value))
    ) {
      Children()
    }
  }
}

class ColumnView(context: Context, appContext: AppContext) : ExpoComposeView<LayoutProps>(context, appContext) {
  override val props = LayoutProps()

  @Composable
  override fun Content(modifier: Modifier) {
    Column(
      verticalArrangement = props.verticalArrangement.value.toComposeArrangement(),
      horizontalAlignment = props.horizontalAlignment.value.toComposeAlignment(),
      modifier = modifier.then(Modifier.fromExpoModifiers(props.modifiers.value))
    ) {
      Children()
    }
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
  val text: MutableState<String> = mutableStateOf(""),
  val color: MutableState<AndroidColor?> = mutableStateOf(null),
  val fontSize: MutableState<Float> = mutableFloatStateOf(16f),
  val fontWeight: MutableState<TextFontWeight> = mutableStateOf(TextFontWeight.NORMAL),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class TextView(context: Context, appContext: AppContext) : ExpoComposeView<TextProps>(context, appContext) {
  override val props = TextProps()

  @Composable
  override fun Content(modifier: Modifier) {
    Text(
      text = props.text.value,
      modifier = modifier.then(Modifier.fromExpoModifiers(props.modifiers.value)),
      color = colorToComposeColor(props.color.value),
      style = TextStyle(
        fontSize = props.fontSize.value.sp,
        fontWeight = props.fontWeight.value.toComposeFontWeight()
      )
    )
  }
}

class ContainerView(context: Context, appContext: AppContext) :
  ExpoComposeView<ComposeProps>(context, appContext, withHostingView = true) {
  @Composable
  override fun Content(modifier: Modifier) {
    for (index in 0..<this.size) {
      val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
      child.Content(modifier = modifier)
    }
  }
}
