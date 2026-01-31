@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import androidx.compose.foundation.text.input.rememberTextFieldState
import androidx.compose.material3.DockedSearchBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SearchBarDefaults
import androidx.compose.material3.rememberSearchBarState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.snapshotFlow
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class DockedSearchBarProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.DockedSearchBarContent(
  props: DockedSearchBarProps,
  onQueryChange: (GenericEventPayload1<String>) -> Unit
) {
  val searchBarState = rememberSearchBarState()
  val textFieldState = rememberTextFieldState()

  LaunchedEffect(Unit) {
    snapshotFlow { textFieldState.text.toString() }
      .collect { onQueryChange(GenericEventPayload1(it)) }
  }

  DockedSearchBar(
    expanded = false,
    onExpandedChange = {},
    inputField = @Composable {
      SearchBarDefaults.InputField(
        searchBarState = searchBarState,
        textFieldState = textFieldState,
        onSearch = {},
        placeholder = {
          Children(ComposableScope(), filter = { isSlotWithName(it, "placeholder") })
        },
        leadingIcon = {
          Children(ComposableScope(), filter = { isSlotWithName(it, "leadingIcon") })
        }
      )
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {}
}
