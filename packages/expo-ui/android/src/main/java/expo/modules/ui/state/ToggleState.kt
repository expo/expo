// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.ui.state

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * Observable state for toggle-like components (Switch, Checkbox, ToggleButton),
 * created from JavaScript and observed by Compose views.
 *
 * Uses Compose's `mutableStateOf` so that any composable reading [isOn]
 * automatically recomposes when the value changes -- whether the change
 * originates from JavaScript or from native UI interaction.
 */
class ToggleState : ObservableState() {
  var isOn by mutableStateOf(false)
}
