@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarDefaults
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import kotlinx.coroutines.withContext
import kotlin.coroutines.cancellation.CancellationException

// --- SnackbarView ---
//
// Class-based marker view that carries styling props for a child of
// `SnackbarHost`. Mirrors the role of the `Snackbar(snackbarData, ...)`
// composable inside Compose's `SnackbarHost(hostState) { data -> Snackbar(data, ...) }`
// lambda — content comes from `SnackbarData`, this view only contributes styling.
// When rendered standalone (no `SnackbarHost` parent) it intentionally renders
// nothing.

@OptimizedComposeProps
data class SnackbarViewProps(
  val containerColor: MutableState<Color?> = mutableStateOf(null),
  val contentColor: MutableState<Color?> = mutableStateOf(null),
  val actionContentColor: MutableState<Color?> = mutableStateOf(null),
  val dismissActionContentColor: MutableState<Color?> = mutableStateOf(null),
  val actionOnNewLine: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class SnackbarView(context: Context, appContext: AppContext) :
  ExpoComposeView<SnackbarViewProps>(context, appContext) {
  override val props = SnackbarViewProps()

  @Composable
  override fun ComposableScope.Content() {
    // Intentionally empty — this view is a styling marker for SnackbarHost.
  }
}

// --- SnackbarHostView ---

@OptimizedRecord
data class SnackbarShowOptions(
  @Field val message: String = "",
  @Field val actionLabel: String? = null,
  @Field val withDismissAction: Boolean = false,
  @Field val duration: String = "short"
) : Record

@OptimizedComposeProps
data class SnackbarHostProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SnackbarHostContent(
  props: SnackbarHostProps,
  show: AsyncFunctionHandle<SnackbarShowOptions>
) {
  val hostState = remember { SnackbarHostState() }
  val scope = rememberCoroutineScope()
  val snackbarConfig = findChildOfType<SnackbarView>(view)

  show.handle { options ->
    val duration = when (options.duration) {
      "long" -> SnackbarDuration.Long
      "indefinite" -> SnackbarDuration.Indefinite
      else -> SnackbarDuration.Short
    }
    val result = try {
      withContext(scope.coroutineContext) {
        hostState.showSnackbar(
          message = options.message,
          actionLabel = options.actionLabel,
          withDismissAction = options.withDismissAction,
          duration = duration
        )
      }
    } catch (_: CancellationException) {
      // The compose scope can be cancelled if the view is disposed mid-show.
      SnackbarResult.Dismissed
    }
    when (result) {
      SnackbarResult.ActionPerformed -> "actionPerformed"
      SnackbarResult.Dismissed -> "dismissed"
    }
  }

  SnackbarHost(
    hostState = hostState,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) { data ->
    Snackbar(
      snackbarData = data,
      modifier = snackbarConfig?.let {
        ModifierRegistry.applyModifiers(it.props.modifiers.value, appContext, composableScope, globalEventDispatcher)
      } ?: androidx.compose.ui.Modifier,
      actionOnNewLine = snackbarConfig?.props?.actionOnNewLine?.value ?: false,
      containerColor = snackbarConfig?.props?.containerColor?.value.composeOrNull ?: SnackbarDefaults.color,
      contentColor = snackbarConfig?.props?.contentColor?.value.composeOrNull ?: SnackbarDefaults.contentColor,
      actionContentColor = snackbarConfig?.props?.actionContentColor?.value.composeOrNull
        ?: SnackbarDefaults.actionContentColor,
      dismissActionContentColor = snackbarConfig?.props?.dismissActionContentColor?.value.composeOrNull
        ?: SnackbarDefaults.dismissActionContentColor
    )
  }
}
