package expo.modules.ui.menu

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBoxScope
import androidx.compose.runtime.compositionLocalOf

@OptIn(ExperimentalMaterial3Api::class)
val LocalExposedDropdownMenuBoxScope = compositionLocalOf<ExposedDropdownMenuBoxScope?> { null }
