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

class CardColors : Record {
  @Field val containerColor: Color? = null
  @Field val contentColor: Color? = null
}

data class CardProps(
  val colors: CardColors = CardColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.CardContent(props: CardProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = CardDefaults.cardColors(
    containerColor = props.colors.containerColor.composeOrNull
      ?: CardDefaults.cardColors().containerColor,
    contentColor = props.colors.contentColor.composeOrNull
      ?: CardDefaults.cardColors().contentColor
  )

  val content: @Composable ColumnScope.() -> Unit = {
    val scope = ComposableScope().with(columnScope = this)
    Children(scope)
  }

  Card(
    modifier = modifier,
    colors = colors,
    content = content
  )
}

@Composable
fun FunctionalComposableScope.ElevatedCardContent(props: CardProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = CardDefaults.elevatedCardColors(
    containerColor = props.colors.containerColor.composeOrNull
      ?: CardDefaults.elevatedCardColors().containerColor,
    contentColor = props.colors.contentColor.composeOrNull
      ?: CardDefaults.elevatedCardColors().contentColor
  )

  val content: @Composable ColumnScope.() -> Unit = {
    val scope = ComposableScope().with(columnScope = this)
    Children(scope)
  }

  ElevatedCard(
    modifier = modifier,
    colors = colors,
    content = content
  )
}

@Composable
fun FunctionalComposableScope.OutlinedCardContent(props: CardProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = CardDefaults.outlinedCardColors(
    containerColor = props.colors.containerColor.composeOrNull
      ?: CardDefaults.outlinedCardColors().containerColor,
    contentColor = props.colors.contentColor.composeOrNull
      ?: CardDefaults.outlinedCardColors().contentColor
  )

  val content: @Composable ColumnScope.() -> Unit = {
    val scope = ComposableScope().with(columnScope = this)
    Children(scope)
  }

  OutlinedCard(
    modifier = modifier,
    colors = colors,
    content = content
  )
}
