package expo.modules.ui

import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.ModuleDefinitionBuilderWithCompose

inline fun <reified Props : ComposeProps> ModuleDefinitionBuilderWithCompose.ExpoUIView(
  name: String,
  noinline viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
) {
  return View(name, viewFunction)
}
