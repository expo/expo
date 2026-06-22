package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import expo.modules.ui.LayoutProps
import expo.modules.ui.convertibles.HorizontalAlignment
import expo.modules.ui.convertibles.HorizontalArrangementDefault
import expo.modules.ui.convertibles.VerticalAlignment
import expo.modules.ui.convertibles.VerticalArrangementDefault

@Composable
fun RowView(
  props: LayoutProps,
  content: @Composable () -> Unit = {}
) {
  Row(
    modifier = props.modifiers.toGlanceModifier(),
    horizontalAlignment = props.toGlanceHorizontalAlignment(),
    verticalAlignment = props.toGlanceVerticalAlignment()
  ) {
    content()
  }
}

private fun LayoutProps.toGlanceHorizontalAlignment(): Alignment.Horizontal {
  horizontalAlignment?.let {
    return it.toGlanceHorizontalAlignment()
  }

  val arrangement = horizontalArrangement
  return if (arrangement?.`is`(HorizontalArrangementDefault::class) == true) {
    when (arrangement.first()) {
      HorizontalArrangementDefault.START -> Alignment.Start
      HorizontalArrangementDefault.CENTER -> Alignment.CenterHorizontally
      HorizontalArrangementDefault.END -> Alignment.End
      else -> Alignment.Start
    }
  } else {
    Alignment.Start
  }
}

private fun LayoutProps.toGlanceVerticalAlignment(): Alignment.Vertical {
  verticalAlignment?.let {
    return it.toGlanceVerticalAlignment()
  }

  val arrangement = verticalArrangement
  return if (arrangement?.`is`(VerticalArrangementDefault::class) == true) {
    when (arrangement.first()) {
      VerticalArrangementDefault.TOP -> Alignment.Top
      VerticalArrangementDefault.CENTER -> Alignment.CenterVertically
      VerticalArrangementDefault.BOTTOM -> Alignment.Bottom
      else -> Alignment.Top
    }
  } else {
    Alignment.Top
  }
}

private fun HorizontalAlignment.toGlanceHorizontalAlignment(): Alignment.Horizontal {
  return when (this) {
    HorizontalAlignment.START -> Alignment.Start
    HorizontalAlignment.CENTER -> Alignment.CenterHorizontally
    HorizontalAlignment.END -> Alignment.End
  }
}

private fun VerticalAlignment.toGlanceVerticalAlignment(): Alignment.Vertical {
  return when (this) {
    VerticalAlignment.TOP -> Alignment.Top
    VerticalAlignment.CENTER -> Alignment.CenterVertically
    VerticalAlignment.BOTTOM -> Alignment.Bottom
  }
}
