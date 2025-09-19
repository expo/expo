package expo.modules.ui.listDetails

import android.annotation.SuppressLint
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.VerticalDragHandle
import androidx.compose.material3.adaptive.ExperimentalMaterial3AdaptiveApi
import androidx.compose.material3.adaptive.layout.AnimatedPane
import androidx.compose.material3.adaptive.layout.ListDetailPaneScaffoldRole
import androidx.compose.material3.adaptive.layout.ThreePaneScaffoldDestinationItem
import androidx.compose.material3.adaptive.layout.rememberPaneExpansionState
import androidx.compose.material3.adaptive.navigation.NavigableListDetailPaneScaffold
import androidx.compose.material3.adaptive.navigation.rememberListDetailPaneScaffoldNavigator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import expo.modules.kotlin.views.ExpoView

@SuppressLint("UnusedContentLambdaTargetStateParameter")
@OptIn(ExperimentalMaterial3AdaptiveApi::class)
@Composable
fun ListDetailViewComposable(
  listContent: ExpoView,
  detailContent: ExpoView,
) {
  val scaffoldNavigator = rememberListDetailPaneScaffoldNavigator(
    initialDestinationHistory = listOf(
      ThreePaneScaffoldDestinationItem(
        pane = ListDetailPaneScaffoldRole.Detail,
        contentKey = 1.0f
      )
    )
  )

  NavigableListDetailPaneScaffold(
    navigator = scaffoldNavigator,
    listPane = {
      AnimatedPane {
        AndroidView(
          factory = { context -> listContent },
          modifier = Modifier
        )
      }
    },
    detailPane = {
      AnimatedPane {
        AndroidView(
          factory = { context -> detailContent },
          modifier = Modifier
        )
      }
    },
    paneExpansionState = rememberPaneExpansionState(scaffoldNavigator.scaffoldValue),
    paneExpansionDragHandle = { state ->
      val interactionSource =
        remember { MutableInteractionSource() }
      VerticalDragHandle(
        modifier =
          Modifier.paneExpansionDraggable(
            state,
            LocalMinimumInteractiveComponentSize.current,
            interactionSource
          ), interactionSource = interactionSource
      )
    }
  )
}