package expo.modules.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.core.view.size
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class ListProps(
  val contentPaddingHorizontal: Float = 16f,
  val contentPaddingVertical: Float = 8f,
  val itemSpacing: Float = 12f,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ListContent(props: ListProps) {
  LazyColumn(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope),
    contentPadding = PaddingValues(
      horizontal = props.contentPaddingHorizontal.dp,
      vertical = props.contentPaddingVertical.dp
    ),
    verticalArrangement = Arrangement.spacedBy(props.itemSpacing.dp)
  ) {
    items(view.size) { index ->
      Child(ComposableScope(), index)
    }
  }
}
