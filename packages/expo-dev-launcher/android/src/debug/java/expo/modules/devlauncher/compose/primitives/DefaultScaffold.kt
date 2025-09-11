package expo.modules.devlauncher.compose.primitives

import androidx.compose.runtime.Composable
import androidx.compose.ui.layout.SubcomposeLayout
import androidx.compose.ui.util.fastMaxBy

@Composable
fun DefaultScaffold(
  bottomTab: @Composable () -> Unit = {},
  content: @Composable () -> Unit
) {
  SubcomposeLayout { constraints ->
    val maxWidth = constraints.maxWidth
    val maxHeight = constraints.maxHeight

    val bottomTabPlaceables = subcompose("bottomTab", bottomTab)
      .map { it.measure(constraints) }
    val bottomTabsHeight = bottomTabPlaceables.fastMaxBy { it.height }?.height ?: 0
    val contentPlaceables = subcompose("content", content)
      .map { it.measure(constraints.copy(maxHeight = maxHeight - bottomTabsHeight)) }

    layout(maxWidth, maxHeight) {
      contentPlaceables.forEach { it.place(0, 0) }
      bottomTabPlaceables.forEach { it.place(0, maxHeight - it.height) }
    }
  }
}
