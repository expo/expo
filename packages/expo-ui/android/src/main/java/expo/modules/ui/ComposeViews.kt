@file:OptIn(ExperimentalMaterial3ExpressiveApi::class, ExperimentalLayoutApi::class)

package expo.modules.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FloatingToolbarDefaults
import androidx.compose.material3.FloatingToolbarExitDirection
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.with
import expo.modules.kotlin.views.withIf
import expo.modules.ui.convertibles.HorizontalAlignment
import expo.modules.ui.convertibles.HorizontalArrangement
import expo.modules.ui.convertibles.VerticalAlignment
import expo.modules.ui.convertibles.ContentAlignment
import expo.modules.ui.convertibles.VerticalArrangement
import expo.modules.ui.convertibles.toComposeArrangement

enum class FloatingToolbarExitAlwaysScrollBehavior(val value: String) : Enumerable {
  TOP("top"),
  BOTTOM("bottom"),
  START("start"),
  END("end");

  fun toComposeExitDirection(): FloatingToolbarExitDirection {
    return when (this) {
      TOP -> FloatingToolbarExitDirection.Top
      BOTTOM -> FloatingToolbarExitDirection.Bottom
      START -> FloatingToolbarExitDirection.Start
      END -> FloatingToolbarExitDirection.End
    }
  }
}

data class LayoutProps(
  val horizontalArrangement: HorizontalArrangement? = null,
  val verticalArrangement: VerticalArrangement? = null,
  val horizontalAlignment: HorizontalAlignment? = null,
  val verticalAlignment: VerticalAlignment? = null,
  val contentAlignment: ContentAlignment? = null,
  val floatingToolbarExitAlwaysScrollBehavior: FloatingToolbarExitAlwaysScrollBehavior? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
internal fun FunctionalComposableScope.RowContent(props: LayoutProps) {
  val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior
    ?.toComposeExitDirection()
    ?.let {
      FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
    }
  Row(
    horizontalArrangement = props.horizontalArrangement?.toComposeArrangement() ?: Arrangement.Start,
    verticalAlignment = props.verticalAlignment?.toComposeAlignment() ?: Alignment.Top,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      .then(if (scrollBehavior != null) Modifier.nestedScroll(scrollBehavior) else Modifier)
  ) {
    val scope = ComposableScope()
      .with(rowScope = this@Row)
      .withIf(scrollBehavior != null) {
        with(nestedScrollConnection = scrollBehavior)
      }
    Children(scope)
  }
}

@Composable
internal fun FunctionalComposableScope.FlowRowContent(props: LayoutProps) {
  FlowRow(
    horizontalArrangement = props.horizontalArrangement?.toComposeArrangement() ?: Arrangement.Start,
    verticalArrangement = props.verticalArrangement?.toComposeArrangement() ?: Arrangement.Top,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    val scope = ComposableScope()
      .with(rowScope = this@FlowRow)
    Children(scope)
  }
}

@Composable
internal fun FunctionalComposableScope.ColumnContent(props: LayoutProps) {
  val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior
    ?.toComposeExitDirection()
    ?.let {
      FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
    }
  Column(
    verticalArrangement = props.verticalArrangement?.toComposeArrangement() ?: Arrangement.Top,
    horizontalAlignment = props.horizontalAlignment?.toComposeAlignment() ?: Alignment.Start,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      .then(if (scrollBehavior != null) Modifier.nestedScroll(scrollBehavior) else Modifier)
  ) {
    val scope = ComposableScope()
      .with(columnScope = this@Column)
      .withIf(scrollBehavior != null) {
        with(nestedScrollConnection = scrollBehavior)
      }
    Children(scope)
  }
}

@Composable
fun FunctionalComposableScope.BoxContent(props: LayoutProps) {
  val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior
    ?.toComposeExitDirection()
    ?.let {
      FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
    }
  Box(
    contentAlignment = props.contentAlignment?.toComposeAlignment() ?: Alignment.TopStart,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      .then(if (scrollBehavior != null) Modifier.nestedScroll(scrollBehavior) else Modifier)
  ) {
    val scope = ComposableScope()
      .with(boxScope = this@Box)
      .withIf(scrollBehavior != null) {
        with(nestedScrollConnection = scrollBehavior)
      }
    Children(scope)
  }
}
