package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.text.input.rememberTextFieldState
import androidx.compose.material3.ExpandedFullScreenSearchBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SearchBar
import androidx.compose.material3.SearchBarDefaults
import androidx.compose.material3.rememberSearchBarState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class SearchBarProps(
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class SearchBarView(context: Context, appContext: AppContext) :
  ExpoComposeView<SearchBarProps>(context, appContext) {
  override val props = SearchBarProps()
  private val onSearch by EventDispatcher<GenericEventPayload1<String>>()

  @OptIn(ExperimentalMaterial3Api::class)
  @Composable
  override fun ComposableScope.Content() {
    val searchBarState = rememberSearchBarState()
    val textFieldState = rememberTextFieldState()

    val inputField =
      @Composable {
        SearchBarDefaults.InputField(
          searchBarState = searchBarState,
          textFieldState = textFieldState,
          onSearch = { value -> onSearch.invoke(GenericEventPayload1(value)) },
          placeholder = {
            Children(this@Content, filter = { isSlotWithName(it, "placeholder") })
          }
        )
      }
    SearchBar(
      state = searchBarState,
      inputField = inputField,
      modifier = Modifier.fromExpoModifiers(props.modifiers.value, this@Content),
    )

    val expandedFullScreenSearchBarView = findChildSlotView(this@SearchBarView, "expandedFullScreenSearchBar")
    expandedFullScreenSearchBarView?.let { slotView ->
      ExpandedFullScreenSearchBar(
        state = searchBarState,
        inputField = inputField,
      ) {
        ExpandedFullScreenSearchBarView(this@Content, slotView)
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
}
