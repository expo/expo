package expo.modules.ui.menu

import androidx.compose.material3.DropdownMenuPopup
import androidx.compose.runtime.Composable
import androidx.compose.ui.window.PopupProperties
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.UIComposableScope
import expo.modules.ui.ModifierRegistry

@Composable
fun FunctionalComposableScope.DropdownMenuPopupContent(
  props: DropdownMenuPopupProps,
  onDismissRequest: () -> Unit
) {
  DropdownMenuPopup(
    expanded = props.expanded,
    onDismissRequest = onDismissRequest,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    properties = PopupProperties(
      focusable = props.properties.focusable,
      dismissOnBackPress = props.properties.dismissOnBackPress,
      dismissOnClickOutside = props.properties.dismissOnClickOutside,
      clippingEnabled = props.properties.clippingEnabled
    )
  ) {
    Children(UIComposableScope(columnScope = this))
  }
}
