package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import java.io.Serializable

open class ChipPressedEvent : Record, Serializable

data class ChipProps(
  val variant: MutableState<String> = mutableStateOf("assist"),
  val label: MutableState<String> = mutableStateOf(""),
  val leadingIcon: MutableState<String?> = mutableStateOf(null),
  val trailingIcon: MutableState<String?> = mutableStateOf(null),
  val iconSize: MutableState<Int> = mutableIntStateOf(18),
  val textStyle: MutableState<String> = mutableStateOf("labelSmall"),
  val enabled: MutableState<Boolean> = mutableStateOf(true),
  val selected: MutableState<Boolean> = mutableStateOf(false)
) : ComposeProps

class ChipView(context: Context, appContext: AppContext) :
  ExpoComposeView<ChipProps>(context, appContext, withHostingView = true) {

  override val props = ChipProps()

  private val onPress by EventDispatcher<ChipPressedEvent>()
  private val onDismiss by EventDispatcher<ChipPressedEvent>()

  @OptIn(ExperimentalMaterial3Api::class)
  @Composable
  override fun Content(modifier: Modifier) {
    val variant by props.variant
    val label by props.label
    val leadingIcon by props.leadingIcon
    val trailingIcon by props.trailingIcon
    val iconSize by props.iconSize
    val textStyle by props.textStyle
    val enabled by props.enabled
    val selected by props.selected

    val chipModifier = modifier
      .padding(4.dp)
      .wrapContentSize(Alignment.Center)

    @Composable
    fun AssistChipComposable() {
      AssistChip(
        onClick = { onPress.invoke(ChipPressedEvent()) },
        label = { ChipText(label = label, textStyle = textStyle) },
        leadingIcon = {
          leadingIcon?.let {
            ChipIcon(iconName = it, iconSize = iconSize)
          }
        },
        trailingIcon = {
          trailingIcon?.let {
            ChipIcon(iconName = it, iconSize = iconSize)
          }
        },
        enabled = enabled,
        colors = AssistChipDefaults.assistChipColors(),
        border = AssistChipDefaults.assistChipBorder(enabled = enabled),
        modifier = chipModifier
      )
    }

    @Composable
    fun FilterChipComposable() {
      FilterChip(
        onClick = { onPress.invoke(ChipPressedEvent()) },
        label = { ChipText(label = label, textStyle = textStyle) },
        selected = selected,
        leadingIcon = if (selected) {
          {
            ChipIcon(iconName = "filled.Done", iconSize = iconSize)
          }
        } else {
          null
        },
        trailingIcon = {
          trailingIcon?.let {
            ChipIcon(iconName = it, iconSize = iconSize)
          }
        },
        enabled = enabled,
        colors = FilterChipDefaults.filterChipColors(),
        border = FilterChipDefaults.filterChipBorder(enabled = enabled, selected = selected),
        modifier = chipModifier
      )
    }

    @Composable
    fun InputChipComposable() {
      if (!enabled) return
      InputChip(
        onClick = { onDismiss.invoke(ChipPressedEvent()) },
        label = { ChipText(label = label, textStyle = textStyle) },
        enabled = enabled,
        selected = selected,
        avatar = {
          leadingIcon?.let {
            ChipIcon(iconName = it, iconSize = iconSize)
          }
        },
        trailingIcon = {
          ChipIcon(
            iconName = trailingIcon ?: "filled.Close",
            iconSize = iconSize
          )
        },
        modifier = chipModifier
      )
    }

    @Composable
    fun SuggestionChipComposable() {
      SuggestionChip(
        onClick = { onPress.invoke(ChipPressedEvent()) },
        label = { ChipText(label = label, textStyle = textStyle) },
        icon = {
          leadingIcon?.let {
            ChipIcon(iconName = it, iconSize = iconSize)
          }
        },
        modifier = chipModifier
      )
    }

    when (variant.lowercase()) {
      "assist" -> AssistChipComposable()
      "filter" -> FilterChipComposable()
      "input" -> InputChipComposable()
      "suggestion" -> SuggestionChipComposable()
      else -> AssistChipComposable()
    }
  }
}

@Composable
private fun ChipText(label: String, textStyle: String = "labelSmall") {
  Box(
    contentAlignment = Alignment.Center,
    modifier = Modifier.fillMaxSize()
  ) {
    Text(
      text = label,
      style = when (textStyle) {
        "labelSmall" -> MaterialTheme.typography.labelSmall
        "labelMedium" -> MaterialTheme.typography.labelMedium
        "labelLarge" -> MaterialTheme.typography.labelLarge
        "bodySmall" -> MaterialTheme.typography.bodySmall
        "bodyMedium" -> MaterialTheme.typography.bodyMedium
        "bodyLarge" -> MaterialTheme.typography.bodyLarge
        else -> MaterialTheme.typography.labelSmall
      },
      textAlign = TextAlign.Center
    )
  }
}

@Composable
private fun ChipIcon(
  iconName: String,
  iconSize: Int = 18,
  tint: Color = MaterialTheme.colorScheme.primary,
  modifier: Modifier = Modifier
) {
  getImageVector(iconName)?.let { imageVector ->
    Icon(
      imageVector = imageVector,
      contentDescription = iconName,
      tint = tint,
      modifier = modifier
        .size(iconSize.dp)
        .padding(end = 4.dp)
    )
  }
}
