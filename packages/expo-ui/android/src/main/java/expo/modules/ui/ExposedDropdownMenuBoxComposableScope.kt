package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBoxScope
import expo.modules.kotlin.views.ComposableScope

@OptIn(ExperimentalMaterial3Api::class)
data class ExposedDropdownMenuBoxComposableScope(
  val exposedDropdownMenuBoxScope: ExposedDropdownMenuBoxScope
) : ComposableScope

@OptIn(ExperimentalMaterial3Api::class)
val ComposableScope.exposedDropdownMenuBoxScope: ExposedDropdownMenuBoxScope?
  get() = (this as? ExposedDropdownMenuBoxComposableScope)?.exposedDropdownMenuBoxScope
