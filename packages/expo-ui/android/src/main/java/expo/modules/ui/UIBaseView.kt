package expo.modules.ui

import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ComposeViewBuilderScope
import expo.modules.kotlin.views.ModuleDefinitionBuilderWithCompose

/**
 * Registers a Jetpack Compose view with Expo Modules. Declare events and
 * async functions via `by Event<T>()` / `by AsyncFunction<T>()` property
 * delegates; supply the composable body via `Content { props -> ... }`.
 * Each event/function name is the `val` identifier (declared once).
 *
 * ```
 * ExpoUIView<TextFieldProps>("TextFieldView") {
 *   val focus by AsyncFunction()
 *   val onValueChange by Event<String>()
 *
 *   Content { props ->
 *     focus.handle { focusRequester.requestFocus() }
 *     TextFieldContent(props, onValueChange = { onValueChange(it) })
 *   }
 * }
 * ```
 */
inline fun <reified Props : ComposeProps> ModuleDefinitionBuilderWithCompose.ExpoUIView(
  name: String,
  block: ComposeViewBuilderScope<Props>.() -> Unit
) {
  return View<Props>(name, block)
}
