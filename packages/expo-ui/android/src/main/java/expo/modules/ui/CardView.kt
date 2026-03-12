package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.OutlinedCard
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.with

data class CardElementColors(
  @Field val containerColor: Color? = null,
  @Field val contentColor: Color? = null
) : Record

data class CardProps(
  val variant: String = "default",
  val color: Color? = null,
  val elementColors: CardElementColors? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.CardContent(props: CardProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = when {
    props.elementColors != null -> CardDefaults.cardColors(
      containerColor = props.elementColors.containerColor?.compose ?: androidx.compose.ui.graphics.Color.Unspecified,
      contentColor = props.elementColors.contentColor?.compose ?: androidx.compose.ui.graphics.Color.Unspecified
    )
    props.color != null -> CardDefaults.cardColors(
      containerColor = props.color.compose
    )
    else -> CardDefaults.cardColors()
  }

  val content: @Composable ColumnScope.() -> Unit = {
    val scope = ComposableScope().with(columnScope = this)
    Children(scope)
  }

  when (props.variant) {
    "elevated" -> {
      ElevatedCard(
        modifier = modifier,
        colors = colors,
        content = content
      )
    }
    "outlined" -> {
      OutlinedCard(
        modifier = modifier,
        colors = colors,
        content = content
      )
    }
    else -> {
      Card(
        modifier = modifier,
        colors = colors,
        content = content
      )
    }
  }
}
