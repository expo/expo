@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.imePadding
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.ModalBottomSheetProperties
import androidx.compose.material3.contentColorFor
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.currentRecomposeScope
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.window.DialogWindowProvider
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import kotlinx.coroutines.withContext
import kotlin.coroutines.cancellation.CancellationException

@OptimizedRecord
data class ModalBottomSheetPropertiesRecord(
  @Field val shouldDismissOnBackPress: Boolean = true,
  @Field val shouldDismissOnClickOutside: Boolean = true
) : Record

@OptimizedComposeProps
data class ModalBottomSheetViewProps(
  val skipPartiallyExpanded: Boolean = false,
  val initialFullyExpanded: Boolean = false,
  val fitToContents: Boolean = true,
  val containerColor: Color? = null,
  val contentColor: Color? = null,
  val scrimColor: Color? = null,
  val showDragHandle: Boolean = true,
  val sheetGesturesEnabled: Boolean = true,
  val contentWindowInsets: PaddingValuesRecord? = null,
  val properties: ModalBottomSheetPropertiesRecord = ModalBottomSheetPropertiesRecord(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

/**
 * True while the input method has an active connection to a view that accepts text, for example a
 * focused TextInput. `expo-dev-menu` makes the same check in `DevMenuFragment.onKeyUp`.
 */
private fun Activity.isAcceptingText(): Boolean {
  val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
  return inputMethodManager?.isAcceptingText == true
}

/**
 * Material3 shows [ModalBottomSheet] in its own dialog window. Android sends key events to the
 * focused window, so the activity does not get them while the sheet is open. Key triggers that
 * the activity owns then stop working, for example KEYCODE_MENU, which opens the dev menu.
 * React Native's own Modal sends every other key up to the activity for this reason. Do the same.
 *
 * Do not forward while a view in the sheet accepts text. React Native turns a double press of R
 * into a reload and only skips it when `Activity.getCurrentFocus()` is an EditText. That focus
 * belongs to the activity window, so it never sees a TextInput in the sheet's own dialog window.
 * Without this check, typing "rr" in a sheet TextInput reloads the app.
 */
@Composable
private fun ForwardKeyEventsToActivity(activity: Activity?) {
  val dialog = (LocalView.current.parent as? DialogWindowProvider)?.window?.callback as? Dialog
  if (dialog == null || activity == null) {
    return
  }

  DisposableEffect(dialog, activity) {
    dialog.setOnKeyListener { _, keyCode, event ->
      val isForwardable = event.action == KeyEvent.ACTION_UP &&
        keyCode != KeyEvent.KEYCODE_BACK &&
        keyCode != KeyEvent.KEYCODE_ESCAPE &&
        !activity.isAcceptingText()
      isForwardable && activity.onKeyUp(keyCode, event)
    }
    onDispose {
      dialog.setOnKeyListener(null)
    }
  }
}

@Composable
fun FunctionalComposableScope.ModalBottomSheetContent(
  props: ModalBottomSheetViewProps,
  hide: AsyncFunctionHandle<Unit>,
  expand: AsyncFunctionHandle<Unit>,
  partialExpand: AsyncFunctionHandle<Unit>,
  onDismissRequest: () -> Unit
) {
  val sheetState = rememberModalBottomSheetState(props.skipPartiallyExpanded)
  val scope = rememberCoroutineScope()

  hide.handle {
    try {
      withContext(scope.coroutineContext) {
        sheetState.hide()
      }
    } catch (_: CancellationException) {
      // Swipe-dismiss may cancel the coroutine scope while hide() is in-flight.
      // Swallowing the exception avoids an unhandled promise rejection on the JS side.
    }
  }

  expand.handle {
    try {
      withContext(scope.coroutineContext) {
        sheetState.expand()
      }
    } catch (_: CancellationException) {
      // Swipe-dismiss may cancel the coroutine scope while expand() is in-flight.
      // Swallowing the exception avoids an unhandled promise rejection on the JS side.
    }
  }

  partialExpand.handle {
    try {
      withContext(scope.coroutineContext) {
        sheetState.partialExpand()
      }
    } catch (_: CancellationException) {
      // Swipe-dismiss may cancel the coroutine scope while partialExpand() is in-flight.
      // Swallowing the exception avoids an unhandled promise rejection on the JS side.
    }
  }

  val resolvedContainerColor = props.containerColor.composeOrNull ?: BottomSheetDefaults.ContainerColor
  // Material3 themes the sheet window's system bars from the content color, so it has to contrast
  // with the container color. contentColorFor() returns LocalContentColor for a container color that
  // is not a color-scheme role, and that is black outside a Surface. A dark custom container color
  // then asked for light system bars, which turned the navigation bar white.
  val resolvedContentColor = props.contentColor.composeOrNull
    ?: MaterialTheme.colorScheme.contentColorFor(resolvedContainerColor).takeOrElse {
      if (resolvedContainerColor.luminance() > 0.5f) {
        ComposeColor.Black
      } else {
        ComposeColor.White
      }
    }
  // Children invalidates its own scope; slot selection must also observe child changes.
  val contentRecomposeScope = currentRecomposeScope
  DisposableEffect(view, contentRecomposeScope) {
    view.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewAdded(parent: View?, child: View?) {
        contentRecomposeScope.invalidate()
      }
      override fun onChildViewRemoved(parent: View?, child: View?) {
        contentRecomposeScope.invalidate()
      }
    })
    onDispose { view.setOnHierarchyChangeListener(null) }
  }

  val resolvedScrimColor = props.scrimColor.composeOrNull ?: BottomSheetDefaults.ScrimColor
  val dragHandleSlotView = findChildSlotView(view, "dragHandle")
  val footerSlotView = findChildSlotView(view, "footer")
  val layoutDirection = LocalLayoutDirection.current
  val contentWindowInsets = props.contentWindowInsets?.toPaddingValues()?.let {
    WindowInsets(
      left = it.calculateLeftPadding(layoutDirection),
      top = it.calculateTopPadding(),
      right = it.calculateRightPadding(layoutDirection),
      bottom = it.calculateBottomPadding()
    )
  }

  ModalBottomSheet(
    sheetState = sheetState,
    onDismissRequest = onDismissRequest,
    containerColor = resolvedContainerColor,
    contentColor = resolvedContentColor,
    scrimColor = resolvedScrimColor,
    sheetGesturesEnabled = props.sheetGesturesEnabled,
    dragHandle = when {
      dragHandleSlotView != null -> {
        { with(UIComposableScope()) { with(dragHandleSlotView) { Content() } } }
      }
      props.showDragHandle -> {
        { BottomSheetDefaults.DragHandle() }
      }
      else -> null
    },
    contentWindowInsets = { contentWindowInsets ?: BottomSheetDefaults.modalWindowInsets },
    properties = ModalBottomSheetProperties(
      shouldDismissOnBackPress = props.properties.shouldDismissOnBackPress,
      shouldDismissOnClickOutside = props.properties.shouldDismissOnClickOutside
    ),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      // Reserve IME space before Material computes anchors for the sticky viewport.
      .then(
        if (contentWindowInsets == null && (footerSlotView != null || !props.fitToContents)) {
          Modifier.imePadding()
        } else {
          Modifier
        }
      )
  ) {
    ForwardKeyEventsToActivity(appContext.currentActivity)
    if (footerSlotView == null && props.fitToContents) {
      Children(UIComposableScope(), filter = { !isSlotView(it) })
    } else {
      ModalBottomSheetLayout(
        sheetState = sheetState,
        fitToContents = props.fitToContents,
        contentWindowInsets = contentWindowInsets ?: BottomSheetDefaults.modalWindowInsets,
        content = { Children(UIComposableScope(), filter = { !isSlotView(it) }) },
        footer = { footerSlotView?.renderSlot() }
      )
    }
  }

  LaunchedEffect(Unit) {
    if (props.initialFullyExpanded && !props.skipPartiallyExpanded) {
      try {
        sheetState.expand()
      } catch (_: CancellationException) {
        // Dismissal can cancel the expand animation.
      } catch (_: Exception) {
        // Expanded anchor may be unreachable; never crash the view.
      }
    }
  }
}
