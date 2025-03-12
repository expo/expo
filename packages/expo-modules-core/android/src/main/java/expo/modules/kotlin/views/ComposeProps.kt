package expo.modules.kotlin.views

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf

/**
 * A marker interface for props classes that are used to pass data to Compose views.
 * Needed for the R8 to not remove needed  signatures that are used to receive prop types.
 */
open class ComposeProps {
  var _children: MutableState<List<ComposableChild>> = mutableStateOf(emptyList())
}
