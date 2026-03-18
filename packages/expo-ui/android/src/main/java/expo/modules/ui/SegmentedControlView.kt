package expo.modules.ui

import androidx.compose.material3.MultiChoiceSegmentedButtonRow
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.with

data class SingleChoiceSegmentedButtonRowProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SingleChoiceSegmentedButtonRowContent(props: SingleChoiceSegmentedButtonRowProps) {
  SingleChoiceSegmentedButtonRow(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope().with(rowScope = this@SingleChoiceSegmentedButtonRow))
  }
}

data class MultiChoiceSegmentedButtonRowProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.MultiChoiceSegmentedButtonRowContent(props: MultiChoiceSegmentedButtonRowProps) {
  MultiChoiceSegmentedButtonRow(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope().with(rowScope = this@MultiChoiceSegmentedButtonRow))
  }
}
