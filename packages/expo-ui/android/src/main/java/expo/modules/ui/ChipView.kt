package expo.modules.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.InputChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class ChipPressedEvent : Record, Serializable

data class ChipProps(
  val variant: String = "assist",
  val label: String = "",
  val leadingIcon: String? = null,
  val trailingIcon: String? = null,
  val iconSize: Int = 18,
  val textStyle: String = "labelSmall",
  val enabled: Boolean = true,
  val selected: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.ChipContent(
  props: ChipProps,
  onPress: (ChipPressedEvent) -> Unit,
  onDismiss: (ChipPressedEvent) -> Unit
) {
  val chipModifier = Modifier
    .padding(4.dp)
    .wrapContentSize(Alignment.Center)

  @Composable
  fun AssistChipComposable() {
    AssistChip(
      onClick = { onPress(ChipPressedEvent()) },
      label = { ChipText(label = props.label, textStyle = props.textStyle) },
      leadingIcon = {
        props.leadingIcon?.let {
          ChipIcon(iconName = it, iconSize = props.iconSize)
        }
      },
      trailingIcon = {
        props.trailingIcon?.let {
          ChipIcon(iconName = it, iconSize = props.iconSize)
        }
      },
      enabled = props.enabled,
      colors = AssistChipDefaults.assistChipColors(),
      border = AssistChipDefaults.assistChipBorder(enabled = props.enabled),
      modifier = chipModifier
    )
  }

  @Composable
  fun FilterChipComposable() {
    FilterChip(
      onClick = { onPress(ChipPressedEvent()) },
      label = { ChipText(label = props.label, textStyle = props.textStyle) },
      selected = props.selected,
      leadingIcon = if (props.selected) {
        {
          ChipIcon(iconName = "filled.Done", iconSize = props.iconSize)
        }
      } else {
        null
      },
      trailingIcon = {
        props.trailingIcon?.let {
          ChipIcon(iconName = it, iconSize = props.iconSize)
        }
      },
      enabled = props.enabled,
      colors = FilterChipDefaults.filterChipColors(),
      border = FilterChipDefaults.filterChipBorder(enabled = props.enabled, selected = props.selected),
      modifier = chipModifier
    )
  }

  @Composable
  fun InputChipComposable() {
    if (!props.enabled) return
    InputChip(
      onClick = { onDismiss(ChipPressedEvent()) },
      label = { ChipText(label = props.label, textStyle = props.textStyle) },
      enabled = props.enabled,
      selected = props.selected,
      avatar = {
        props.leadingIcon?.let {
          ChipIcon(iconName = it, iconSize = props.iconSize)
        }
      },
      trailingIcon = {
        ChipIcon(
          iconName = props.trailingIcon ?: "filled.Close",
          iconSize = props.iconSize
        )
      },
      modifier = chipModifier
    )
  }

  @Composable
  fun SuggestionChipComposable() {
    SuggestionChip(
      onClick = { onPress(ChipPressedEvent()) },
      label = { ChipText(label = props.label, textStyle = props.textStyle) },
      icon = {
        props.leadingIcon?.let {
          ChipIcon(iconName = it, iconSize = props.iconSize)
        }
      },
      modifier = chipModifier
    )
  }

  when (props.variant.lowercase()) {
    "assist" -> AssistChipComposable()
    "filter" -> FilterChipComposable()
    "input" -> InputChipComposable()
    "suggestion" -> SuggestionChipComposable()
    else -> AssistChipComposable()
  }
}

@Composable
private fun ChipText(label: String, textStyle: String = "labelSmall") {
  Box(
    contentAlignment = Alignment.Center
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
