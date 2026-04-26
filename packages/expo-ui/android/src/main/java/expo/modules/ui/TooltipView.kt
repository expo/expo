@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.RichTooltip
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.FunctionalComposableScope
import kotlinx.coroutines.withContext
import kotlin.coroutines.cancellation.CancellationException
import expo.modules.kotlin.views.OptimizedComposeProps

// --- PlainTooltipView ---

@OptimizedComposeProps
data class PlainTooltipViewProps(
  val containerColor: MutableState<Color?> = mutableStateOf(null),
  val contentColor: MutableState<Color?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class PlainTooltipView(context: Context, appContext: AppContext) :
  ExpoComposeView<PlainTooltipViewProps>(context, appContext) {
  override val props = PlainTooltipViewProps()

  @Composable
  override fun ComposableScope.Content() {
    Children(this)
  }
}

// --- RichTooltipView ---

@OptimizedComposeProps
data class RichTooltipViewProps(
  val containerColor: MutableState<Color?> = mutableStateOf(null),
  val contentColor: MutableState<Color?> = mutableStateOf(null),
  val titleContentColor: MutableState<Color?> = mutableStateOf(null),
  val actionContentColor: MutableState<Color?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class RichTooltipView(context: Context, appContext: AppContext) :
  ExpoComposeView<RichTooltipViewProps>(context, appContext) {
  override val props = RichTooltipViewProps()

  @Composable
  override fun ComposableScope.Content() {
    Children(this)
  }
}

// --- TooltipBoxView ---

@OptimizedComposeProps
data class TooltipBoxViewProps(
  val isPersistent: Boolean = false,
  val hasAction: Boolean? = null,
  val enableUserInput: Boolean = true,
  val focusable: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.TooltipBoxContent(
  props: TooltipBoxViewProps,
  show: AsyncFunctionHandle<Unit>,
  dismiss: AsyncFunctionHandle<Unit>
) {
  val tooltipState = rememberTooltipState(isPersistent = props.isPersistent)
  val scope = rememberCoroutineScope()

  show.handle {
    try {
      withContext(scope.coroutineContext) {
        tooltipState.show()
      }
    } catch (_: CancellationException) {
      // Can occur if the compose scope is cancelled (view disposed) or if a
      // competing show/dismiss call cancels this one. Safe to ignore in both cases.
    }
  }

  dismiss.handle {
    try {
      withContext(scope.coroutineContext) {
        tooltipState.dismiss()
      }
    } catch (_: CancellationException) {
      // Can occur if the compose scope is cancelled (view disposed) or if a
      // competing show/dismiss call cancels this one. Safe to ignore in both cases.
    }
  }

  val tooltipSlotView = findChildSlotView(view, "tooltip")
  val plainTooltipView = tooltipSlotView?.let { findChildOfType<PlainTooltipView>(it) }
  val richTooltipView = tooltipSlotView?.let { findChildOfType<RichTooltipView>(it) }

  val actionSlotView = richTooltipView?.let { findChildSlotView(it, "action") }
  val hasAction = props.hasAction ?: (actionSlotView != null)

  val positionProvider = if (richTooltipView != null) {
    TooltipDefaults.rememberRichTooltipPositionProvider()
  } else {
    TooltipDefaults.rememberPlainTooltipPositionProvider()
  }

  TooltipBox(
    positionProvider = positionProvider,
    enableUserInput = props.enableUserInput,
    focusable = props.focusable,
    hasAction = hasAction,
    tooltip = {
      if (plainTooltipView != null) {
        PlainTooltip(
          containerColor = plainTooltipView.props.containerColor.value.composeOrNull
            ?: TooltipDefaults.plainTooltipContainerColor,
          contentColor = plainTooltipView.props.contentColor.value.composeOrNull
            ?: TooltipDefaults.plainTooltipContentColor,
          modifier = ModifierRegistry.applyModifiers(plainTooltipView.props.modifiers.value, appContext, composableScope, globalEventDispatcher)
        ) {
          with(UIComposableScope()) { with(plainTooltipView) { Content() } }
        }
      } else if (richTooltipView != null) {
        val titleSlotView = findChildSlotView(richTooltipView, "title")
        val textSlotView = findChildSlotView(richTooltipView, "text")
        val defaultColors = TooltipDefaults.richTooltipColors()

        RichTooltip(
          title = titleSlotView?.let { { it.renderSlot() } },
          action = actionSlotView?.let { { it.renderSlot() } },
          colors = TooltipDefaults.richTooltipColors(
            containerColor = richTooltipView.props.containerColor.value.composeOrNull
              ?: defaultColors.containerColor,
            contentColor = richTooltipView.props.contentColor.value.composeOrNull
              ?: defaultColors.contentColor,
            titleContentColor = richTooltipView.props.titleContentColor.value.composeOrNull
              ?: defaultColors.titleContentColor,
            actionContentColor = richTooltipView.props.actionContentColor.value.composeOrNull
              ?: defaultColors.actionContentColor
          ),
          modifier = ModifierRegistry.applyModifiers(richTooltipView.props.modifiers.value, appContext, composableScope, globalEventDispatcher)
        ) {
          textSlotView?.renderSlot()
        }
      }
    },
    state = tooltipState,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(), filter = { !isSlotView(it) })
  }
}
