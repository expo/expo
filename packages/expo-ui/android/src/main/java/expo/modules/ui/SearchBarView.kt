@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import androidx.compose.foundation.text.input.rememberTextFieldState
import androidx.compose.material3.ExpandedFullScreenSearchBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SearchBar
import androidx.compose.material3.SearchBarDefaults
import androidx.compose.material3.rememberSearchBarState
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class SearchBarProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SearchBarContent(props: SearchBarProps, onSearch: (GenericEventPayload1<String>) -> Unit) {
  val searchBarState = rememberSearchBarState()
  val textFieldState = rememberTextFieldState()

  val inputField =
    @Composable {
      SearchBarDefaults.InputField(
        searchBarState = searchBarState,
        textFieldState = textFieldState,
        onSearch = { value -> onSearch.invoke(GenericEventPayload1(value)) },
        placeholder = {
          Children(ComposableScope(), filter = { isSlotWithName(it, "placeholder") })
        }
      )
    }
  SearchBar(
    state = searchBarState,
    inputField = inputField,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )

  val expandedFullScreenSearchBarView = findChildSlotView(view, "expandedFullScreenSearchBar")
  expandedFullScreenSearchBarView?.let { slotView ->
    ExpandedFullScreenSearchBar(
      state = searchBarState,
      inputField = inputField
    ) {
      ExpandedFullScreenSearchBarView(ComposableScope(), slotView)
    }
  }
}

@Composable
private fun ExpandedFullScreenSearchBarView(composableScope: ComposableScope, view: SlotView) {
  with(composableScope) {
    with(view) {
      Content()
    }
  }
}
