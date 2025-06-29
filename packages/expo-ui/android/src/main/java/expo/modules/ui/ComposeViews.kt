package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.text.TextStyleRecord
import expo.modules.ui.text.toComposeTextStyle

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
  val modifier: MutableState<Modifier> = mutableStateOf(Modifier)
) : ComposeProps

class RowView(context: Context, appContext: AppContext) : ExpoComposeView<LayoutProps>(context, appContext) {
  override val props = LayoutProps()

  @Composable
  override fun Content() {
    Row(
      horizontalArrangement = props.horizontalArrangement.value.toComposeArrangement(),
      verticalAlignment = props.verticalAlignment.value.toComposeAlignment(),
      modifier = props.modifier.value
    ) {
      Children()
    }
  }
}

class ColumnView(context: Context, appContext: AppContext) : ExpoComposeView<LayoutProps>(context, appContext) {
  override val props = LayoutProps()

  @Composable
  override fun Content() {
    Column(
      verticalArrangement = props.verticalArrangement.value.toComposeArrangement(),
      horizontalAlignment = props.horizontalAlignment.value.toComposeAlignment(),
      modifier = props.modifier.value
    ) {
      Children()
    }
  }
}

data class TextProps(
  val text: MutableState<String> = mutableStateOf(""),
  val modifier: MutableState<Modifier> = mutableStateOf(Modifier),
  val style: MutableState<TextStyleRecord> = mutableStateOf(TextStyleRecord())
) : ComposeProps

class TextView(context: Context, appContext: AppContext) : ExpoComposeView<TextProps>(context, appContext) {
  override val props = TextProps()

  @Composable
  override fun Content() {
    Text(
      text = props.text.value,
      style = props.style.value.toComposeTextStyle(),
      modifier = props.modifier.value
    )
  }
}

class ContainerView(context: Context, appContext: AppContext) :
  ExpoComposeView<ComposeProps>(context, appContext, withHostingView = true) {
  @Composable
  override fun Content() {
    for (index in 0..<this.size) {
      val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
      child.Content()
    }
  }
}
