package expo.modules.ui

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.text.input.TextFieldState
import androidx.compose.material3.AppBarWithSearch
import androidx.compose.material3.ExpandedFullScreenSearchBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.SearchBarDefaults
import androidx.compose.material3.SearchBarState
import androidx.compose.material3.SearchBarValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSearchBarState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshotFlow
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

data class AppBarWithSearchViewProps(
  val title: MutableState<String> = mutableStateOf(""),
  val placeholder: MutableState<String> = mutableStateOf(""),
  val hasNavigationIcon: MutableState<Boolean> = mutableStateOf(false),
  val hasTrailingIcon: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

class AppBarWithSearchView(context: Context, appContext: AppContext) :
  ExpoComposeView<AppBarWithSearchViewProps>(context, appContext) {
  override val props = AppBarWithSearchViewProps()
  private val onValueChanged by EventDispatcher()
  private val onSearchSubmitted by EventDispatcher()
  private val onExpandedChange by EventDispatcher()

  private val textFieldState = TextFieldState()
  private var initialized = false
  @OptIn(ExperimentalMaterial3Api::class)
  private var searchBarState: SearchBarState? = null
  private var coroutineScope: CoroutineScope? = null

  @OptIn(ExperimentalMaterial3Api::class)
  fun collapse() {
    val state = searchBarState ?: return
    val scope = coroutineScope ?: return
    scope.launch { state.animateToCollapsed() }
  }

  var query: String?
    get() = if (initialized) textFieldState.text.toString() else null
    set(value) {
      initialized = true
      textFieldState.edit { replace(0, length, value ?: "") }
      onValueChanged(mapOf("value" to (value ?: "")))
    }

  @OptIn(ExperimentalMaterial3Api::class)
  @Composable
  override fun ComposableScope.Content() {
    val searchBarState = rememberSearchBarState()
    val scope = rememberCoroutineScope()
    this@AppBarWithSearchView.searchBarState = searchBarState
    this@AppBarWithSearchView.coroutineScope = scope
    val isExpanded = searchBarState.currentValue == SearchBarValue.Expanded

    val placeholderText = props.placeholder.value.ifEmpty { props.title.value }

    LaunchedEffect(Unit) {
      snapshotFlow { textFieldState.text.toString() }
        .collect { text ->
          onValueChanged(mapOf("value" to text))
        }
    }

    LaunchedEffect(isExpanded) {
      onExpandedChange(mapOf("expanded" to isExpanded))
    }

    val inputField: @Composable () -> Unit = {
      SearchBarDefaults.InputField(
        textFieldState = textFieldState,
        searchBarState = searchBarState,
        onSearch = {
          onSearchSubmitted(mapOf("value" to it))
          scope.launch { searchBarState.animateToCollapsed() }
        },
        placeholder = { Text(placeholderText) },
        leadingIcon = {
          if (isExpanded) {
            IconButton(onClick = {
              scope.launch { searchBarState.animateToCollapsed() }
            }) {
              getImageVector("filled.ArrowBack")?.let {
                Icon(imageVector = it, contentDescription = "Close search")
              }
            }
          } else {
            getImageVector("filled.Search")?.let {
              Icon(imageVector = it, contentDescription = null)
            }
          }
        },
        trailingIcon = if (isExpanded && textFieldState.text.isNotEmpty()) {
          {
            IconButton(onClick = {
              textFieldState.edit { replace(0, length, "") }
            }) {
              getImageVector("filled.Close")?.let {
                Icon(imageVector = it, contentDescription = "Clear query")
              }
            }
          }
        } else null,
      )
    }

    if (isExpanded) {
      BackHandler { scope.launch { searchBarState.animateToCollapsed() } }
    }

    AppBarWithSearch(
      state = searchBarState,
      inputField = inputField,
      navigationIcon = { if (props.hasNavigationIcon.value) Child(0) },
      actions = { if (props.hasTrailingIcon.value) Child(1) },
    )
    ExpandedFullScreenSearchBar(
      state = searchBarState,
      inputField = inputField,
    ) {
      Child(2)
    }
  }
}
