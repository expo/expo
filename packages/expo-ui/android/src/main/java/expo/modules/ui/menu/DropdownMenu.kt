package expo.modules.ui.menu

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuPopup
import androidx.compose.material3.MenuAnchorPosition
import androidx.compose.material3.MenuDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.PopupProperties
import androidx.core.view.size
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.UIComposableScope
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.composeOrNull
import expo.modules.ui.findChildSlotView
import expo.modules.ui.isSlotView

@Composable
fun FunctionalComposableScope.DropdownMenuContent(
  props: DropdownMenuProps,
  onDismissRequest: () -> Unit
) {
  val itemsSlotView = findChildSlotView(view, "items")
  // Menus of `DropdownMenuGroup`s are Material 3 Expressive menus, which have their own popup.
  val isGrouped = itemsSlotView != null && (0..<itemsSlotView.size).any { isMenuGroup(itemsSlotView.getChildAt(it)) }

  Box(modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)) {
    // Trigger - non-items children
    Children(UIComposableScope(), filter = { !isSlotView(it) })

    if (itemsSlotView != null && isGrouped) {
      // A menu in a group is a submenu, which opens beside its trigger item, like Compose's cascading menus.
      val isSubmenu = isMenuGroup(view.parent)
      DropdownMenuPopup(
        expanded = props.expanded,
        onDismissRequest = onDismissRequest,
        popupPositionProvider = MenuDefaults.rememberDropdownMenuPopupPositionProvider(
          if (isSubmenu) MenuAnchorPosition.End else MenuAnchorPosition.Below
        ),
        properties = PopupProperties(
          focusable = props.properties.focusable,
          dismissOnBackPress = props.properties.dismissOnBackPress,
          dismissOnClickOutside = props.properties.dismissOnClickOutside,
          clippingEnabled = props.properties.clippingEnabled
        )
      ) {
        val scope = UIComposableScope(columnScope = this)
        for (index in 0..<itemsSlotView.size) {
          if (index > 0) {
            Spacer(Modifier.height(MenuDefaults.GroupSpacing))
          }
          itemsSlotView.Child(scope, index)
        }
      }
    }

    DropdownMenu(
      containerColor = props.color?.composeOrNull ?: MenuDefaults.containerColor,
      shape = props.cornerRadius?.let { RoundedCornerShape(it.dp) } ?: MenuDefaults.shape,
      shadowElevation = props.shadowElevation?.dp ?: MenuDefaults.ShadowElevation,
      expanded = props.expanded && !isGrouped,
      onDismissRequest = onDismissRequest,
      properties = PopupProperties(
        focusable = props.properties.focusable,
        dismissOnBackPress = props.properties.dismissOnBackPress,
        dismissOnClickOutside = props.properties.dismissOnClickOutside,
        clippingEnabled = props.properties.clippingEnabled
      )
    ) {
      itemsSlotView?.let {
        with(UIComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    }
  }
}
