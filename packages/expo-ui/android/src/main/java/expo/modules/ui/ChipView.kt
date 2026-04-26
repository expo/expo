package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.InputChip
import androidx.compose.material3.InputChipDefaults
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.SuggestionChipDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
open class ChipPressedEvent : Record, Serializable

@OptimizedRecord
class AssistChipColors : Record {
  @Field val containerColor: Color? = null
  @Field val labelColor: Color? = null
  @Field val leadingIconContentColor: Color? = null
  @Field val trailingIconContentColor: Color? = null
}

@OptimizedRecord
class FilterChipColors : Record {
  @Field val containerColor: Color? = null
  @Field val labelColor: Color? = null
  @Field val iconColor: Color? = null
  @Field val selectedContainerColor: Color? = null
  @Field val selectedLabelColor: Color? = null
  @Field val selectedLeadingIconColor: Color? = null
  @Field val selectedTrailingIconColor: Color? = null
}

@OptimizedRecord
class InputChipColors : Record {
  @Field val containerColor: Color? = null
  @Field val labelColor: Color? = null
  @Field val leadingIconColor: Color? = null
  @Field val trailingIconColor: Color? = null
  @Field val selectedContainerColor: Color? = null
  @Field val selectedLabelColor: Color? = null
  @Field val selectedLeadingIconColor: Color? = null
  @Field val selectedTrailingIconColor: Color? = null
}

@OptimizedRecord
class SuggestionChipColors : Record {
  @Field val containerColor: Color? = null
  @Field val labelColor: Color? = null
  @Field val iconContentColor: Color? = null
}

@OptimizedRecord
class ChipBorder : Record {
  @Field val width: Float = 1f
  @Field val color: Color? = null
}

private fun FunctionalComposableScope.slotContent(slotName: String): (@Composable () -> Unit)? {
  return findChildSlotView(view, slotName)?.let { slotView ->
    {
      with(UIComposableScope()) {
        with(slotView) {
          Content()
        }
      }
    }
  }
}

// region AssistChip

@OptimizedComposeProps
data class AssistChipProps(
  val enabled: Boolean = true,
  val colors: AssistChipColors = AssistChipColors(),
  val elevation: Float? = null,
  val border: ChipBorder? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.AssistChipContent(
  props: AssistChipProps,
  onPress: (ChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = AssistChipDefaults.assistChipColors(
    containerColor = props.colors.containerColor.composeOrNull ?: ComposeColor.Unspecified,
    labelColor = props.colors.labelColor.composeOrNull ?: ComposeColor.Unspecified,
    leadingIconContentColor = props.colors.leadingIconContentColor.composeOrNull ?: ComposeColor.Unspecified,
    trailingIconContentColor = props.colors.trailingIconContentColor.composeOrNull ?: ComposeColor.Unspecified
  )

  val elevation = if (props.elevation != null) {
    AssistChipDefaults.assistChipElevation(elevation = props.elevation.dp)
  } else {
    AssistChipDefaults.assistChipElevation()
  }

  val border = if (props.border != null) {
    val borderColor = props.border.color.composeOrNull
    if (borderColor != null) {
      BorderStroke(props.border.width.dp, borderColor)
    } else {
      AssistChipDefaults.assistChipBorder(enabled = props.enabled, borderWidth = props.border.width.dp)
    }
  } else {
    AssistChipDefaults.assistChipBorder(enabled = props.enabled)
  }

  AssistChip(
    onClick = { onPress(ChipPressedEvent()) },
    label = slotContent("label") ?: {},
    leadingIcon = slotContent("leadingIcon"),
    trailingIcon = slotContent("trailingIcon"),
    enabled = props.enabled,
    colors = colors,
    elevation = elevation,
    border = border,
    modifier = modifier
  )
}

// endregion

// region FilterChip

@OptimizedComposeProps
data class FilterChipProps(
  val selected: Boolean = false,
  val enabled: Boolean = true,
  val colors: FilterChipColors = FilterChipColors(),
  val elevation: Float? = null,
  val border: ChipBorder? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.FilterChipContent(
  props: FilterChipProps,
  onPress: (ChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = FilterChipDefaults.filterChipColors(
    containerColor = props.colors.containerColor.composeOrNull ?: ComposeColor.Unspecified,
    labelColor = props.colors.labelColor.composeOrNull ?: ComposeColor.Unspecified,
    iconColor = props.colors.iconColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedContainerColor = props.colors.selectedContainerColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedLabelColor = props.colors.selectedLabelColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedLeadingIconColor = props.colors.selectedLeadingIconColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedTrailingIconColor = props.colors.selectedTrailingIconColor.composeOrNull ?: ComposeColor.Unspecified
  )

  val elevation = if (props.elevation != null) {
    FilterChipDefaults.filterChipElevation(elevation = props.elevation.dp)
  } else {
    FilterChipDefaults.filterChipElevation()
  }

  val border = if (props.border != null) {
    val borderColor = props.border.color.composeOrNull
    if (borderColor != null) {
      BorderStroke(props.border.width.dp, borderColor)
    } else {
      FilterChipDefaults.filterChipBorder(enabled = props.enabled, selected = props.selected, borderWidth = props.border.width.dp)
    }
  } else {
    FilterChipDefaults.filterChipBorder(enabled = props.enabled, selected = props.selected)
  }

  FilterChip(
    selected = props.selected,
    onClick = { onPress(ChipPressedEvent()) },
    label = slotContent("label") ?: {},
    leadingIcon = slotContent("leadingIcon"),
    trailingIcon = slotContent("trailingIcon"),
    enabled = props.enabled,
    colors = colors,
    elevation = elevation,
    border = border,
    modifier = modifier
  )
}

// endregion

// region InputChip

@OptimizedComposeProps
data class InputChipProps(
  val enabled: Boolean = true,
  val selected: Boolean = false,
  val colors: InputChipColors = InputChipColors(),
  val elevation: Float? = null,
  val border: ChipBorder? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.InputChipContent(
  props: InputChipProps,
  onPress: (ChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = InputChipDefaults.inputChipColors(
    containerColor = props.colors.containerColor.composeOrNull ?: ComposeColor.Unspecified,
    labelColor = props.colors.labelColor.composeOrNull ?: ComposeColor.Unspecified,
    leadingIconColor = props.colors.leadingIconColor.composeOrNull ?: ComposeColor.Unspecified,
    trailingIconColor = props.colors.trailingIconColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedContainerColor = props.colors.selectedContainerColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedLabelColor = props.colors.selectedLabelColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedLeadingIconColor = props.colors.selectedLeadingIconColor.composeOrNull ?: ComposeColor.Unspecified,
    selectedTrailingIconColor = props.colors.selectedTrailingIconColor.composeOrNull ?: ComposeColor.Unspecified
  )

  val elevation = if (props.elevation != null) {
    InputChipDefaults.inputChipElevation(elevation = props.elevation.dp)
  } else {
    InputChipDefaults.inputChipElevation()
  }

  val border = if (props.border != null) {
    val borderColor = props.border.color.composeOrNull
    if (borderColor != null) {
      BorderStroke(props.border.width.dp, borderColor)
    } else {
      InputChipDefaults.inputChipBorder(enabled = props.enabled, selected = props.selected, borderWidth = props.border.width.dp)
    }
  } else {
    InputChipDefaults.inputChipBorder(enabled = props.enabled, selected = props.selected)
  }

  InputChip(
    onClick = { onPress(ChipPressedEvent()) },
    label = slotContent("label") ?: {},
    enabled = props.enabled,
    selected = props.selected,
    avatar = slotContent("avatar"),
    trailingIcon = slotContent("trailingIcon"),
    colors = colors,
    elevation = elevation,
    border = border,
    modifier = modifier
  )
}

// endregion

// region SuggestionChip

@OptimizedComposeProps
data class SuggestionChipProps(
  val enabled: Boolean = true,
  val colors: SuggestionChipColors = SuggestionChipColors(),
  val elevation: Float? = null,
  val border: ChipBorder? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SuggestionChipContent(
  props: SuggestionChipProps,
  onPress: (ChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val colors = SuggestionChipDefaults.suggestionChipColors(
    containerColor = props.colors.containerColor.composeOrNull ?: ComposeColor.Unspecified,
    labelColor = props.colors.labelColor.composeOrNull ?: ComposeColor.Unspecified,
    iconContentColor = props.colors.iconContentColor.composeOrNull ?: ComposeColor.Unspecified
  )

  val elevation = if (props.elevation != null) {
    SuggestionChipDefaults.suggestionChipElevation(elevation = props.elevation.dp)
  } else {
    SuggestionChipDefaults.suggestionChipElevation()
  }

  val border = if (props.border != null) {
    val borderColor = props.border.color.composeOrNull
    if (borderColor != null) {
      BorderStroke(props.border.width.dp, borderColor)
    } else {
      SuggestionChipDefaults.suggestionChipBorder(enabled = props.enabled, borderWidth = props.border.width.dp)
    }
  } else {
    SuggestionChipDefaults.suggestionChipBorder(enabled = props.enabled)
  }

  SuggestionChip(
    onClick = { onPress(ChipPressedEvent()) },
    label = slotContent("label") ?: {},
    icon = slotContent("icon"),
    enabled = props.enabled,
    colors = colors,
    elevation = elevation,
    border = border,
    modifier = modifier
  )
}

// endregion
