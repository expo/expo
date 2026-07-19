package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.OutlinedCard
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class CardColors(
  @Field val containerColor: Color? = null,
  @Field val contentColor: Color? = null
) : Record

@OptimizedRecord
data class CardBorder(
  @Field val width: Float = 1f,
  @Field val color: Color? = null
) : Record

// region Card

@OptimizedComposeProps
data class CardProps(
  val colors: CardColors = CardColors(),
  val elevation: Float? = null,
  val border: CardBorder? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.CardContent(props: CardProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val defaults = CardDefaults.cardColors()
  val colors = CardDefaults.cardColors(
    containerColor = props.colors.containerColor.composeOrNull
      ?: defaults.containerColor,
    contentColor = props.colors.contentColor.composeOrNull
      ?: defaults.contentColor
  )

  val elevation = if (props.elevation != null) {
    CardDefaults.cardElevation(defaultElevation = props.elevation.dp)
  } else {
    CardDefaults.cardElevation()
  }

  val border = if (props.border != null) {
    val borderColor = props.border.color.composeOrNull
    if (borderColor != null) {
      BorderStroke(props.border.width.dp, borderColor)
    } else {
      BorderStroke(props.border.width.dp, CardDefaults.outlinedCardBorder().brush)
    }
  } else {
    null
  }

  val content: @Composable ColumnScope.() -> Unit = {
    val scope = UIComposableScope(columnScope = this)
    Children(scope)
  }

  Card(
    modifier = modifier,
    colors = colors,
    elevation = elevation,
    border = border,
    content = content
  )
}

// endregion

// region ElevatedCard

@OptimizedComposeProps
data class ElevatedCardProps(
  val colors: CardColors = CardColors(),
  val elevation: Float? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ElevatedCardContent(props: ElevatedCardProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val defaults = CardDefaults.elevatedCardColors()
  val colors = CardDefaults.elevatedCardColors(
    containerColor = props.colors.containerColor.composeOrNull
      ?: defaults.containerColor,
    contentColor = props.colors.contentColor.composeOrNull
      ?: defaults.contentColor
  )

  val elevation = if (props.elevation != null) {
    CardDefaults.elevatedCardElevation(defaultElevation = props.elevation.dp)
  } else {
    CardDefaults.elevatedCardElevation()
  }

  val content: @Composable ColumnScope.() -> Unit = {
    val scope = UIComposableScope(columnScope = this)
    Children(scope)
  }

  ElevatedCard(
    modifier = modifier,
    colors = colors,
    elevation = elevation,
    content = content
  )
}

// endregion

// region OutlinedCard

@OptimizedComposeProps
data class OutlinedCardProps(
  val colors: CardColors = CardColors(),
  val elevation: Float? = null,
  val border: CardBorder? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.OutlinedCardContent(props: OutlinedCardProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val defaults = CardDefaults.outlinedCardColors()
  val colors = CardDefaults.outlinedCardColors(
    containerColor = props.colors.containerColor.composeOrNull
      ?: defaults.containerColor,
    contentColor = props.colors.contentColor.composeOrNull
      ?: defaults.contentColor
  )

  val elevation = if (props.elevation != null) {
    CardDefaults.outlinedCardElevation(defaultElevation = props.elevation.dp)
  } else {
    CardDefaults.outlinedCardElevation()
  }

  val border = if (props.border != null) {
    val borderColor = props.border.color.composeOrNull
    if (borderColor != null) {
      BorderStroke(props.border.width.dp, borderColor)
    } else {
      BorderStroke(props.border.width.dp, CardDefaults.outlinedCardBorder().brush)
    }
  } else {
    CardDefaults.outlinedCardBorder()
  }

  val content: @Composable ColumnScope.() -> Unit = {
    val scope = UIComposableScope(columnScope = this)
    Children(scope)
  }

  OutlinedCard(
    modifier = modifier,
    colors = colors,
    elevation = elevation,
    border = border,
    content = content
  )
}

// endregion
