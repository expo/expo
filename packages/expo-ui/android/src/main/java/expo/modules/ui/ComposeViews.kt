@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FloatingToolbarDefaults
import androidx.compose.material3.FloatingToolbarExitDirection
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.with
import expo.modules.kotlin.views.withIf

enum class HorizontalArrangement(val value: String) : Enumerable {
  START("start"),
  END("end"),
  CENTER("center"),
  SPACE_BETWEEN("spaceBetween"),
  SPACE_AROUND("spaceAround"),
  SPACE_EVENLY("spaceEvenly");

  fun toComposeArrangement(): Arrangement.Horizontal {
    return when (this) {
      START -> Arrangement.Start
      END -> Arrangement.End
      CENTER -> Arrangement.Center
      SPACE_BETWEEN -> Arrangement.SpaceBetween
      SPACE_AROUND -> Arrangement.SpaceAround
      SPACE_EVENLY -> Arrangement.SpaceEvenly
    }
  }
}

enum class VerticalArrangement(val value: String) : Enumerable {
  TOP("top"),
  BOTTOM("bottom"),
  CENTER("center"),
  SPACE_BETWEEN("spaceBetween"),
  SPACE_AROUND("spaceAround"),
  SPACE_EVENLY("spaceEvenly");

  fun toComposeArrangement(): Arrangement.Vertical {
    return when (this) {
      TOP -> Arrangement.Top
      BOTTOM -> Arrangement.Bottom
      CENTER -> Arrangement.Center
      SPACE_BETWEEN -> Arrangement.SpaceBetween
      SPACE_AROUND -> Arrangement.SpaceAround
      SPACE_EVENLY -> Arrangement.SpaceEvenly
    }
  }
}

enum class HorizontalAlignment(val value: String) : Enumerable {
  START("start"),
  END("end"),
  CENTER("center");

  fun toComposeAlignment(): Alignment.Horizontal {
    return when (this) {
      START -> Alignment.Start
      END -> Alignment.End
      CENTER -> Alignment.CenterHorizontally
    }
  }
}

enum class VerticalAlignment(val value: String) : Enumerable {
  TOP("top"),
  BOTTOM("bottom"),
  CENTER("center");

  fun toComposeAlignment(): Alignment.Vertical {
    return when (this) {
      TOP -> Alignment.Top
      BOTTOM -> Alignment.Bottom
      CENTER -> Alignment.CenterVertically
    }
  }
}

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
  val horizontalArrangement: MutableState<HorizontalArrangement> = mutableStateOf(HorizontalArrangement.START),
  val verticalArrangement: MutableState<VerticalArrangement> = mutableStateOf(VerticalArrangement.TOP),
  val horizontalAlignment: MutableState<HorizontalAlignment> = mutableStateOf(HorizontalAlignment.START),
  val verticalAlignment: MutableState<VerticalAlignment> = mutableStateOf(VerticalAlignment.TOP),
  val floatingToolbarExitAlwaysScrollBehavior: MutableState<FloatingToolbarExitAlwaysScrollBehavior?> = mutableStateOf(null),
  val modifiers: MutableState<List<ExpoModifier>?> = mutableStateOf(emptyList())
) : ComposeProps

class RowView(context: Context, appContext: AppContext) : ExpoComposeView<LayoutProps>(context, appContext) {
  override val props = LayoutProps()

  @Composable
  override fun ComposableScope.Content() {
    val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior.value
      ?.toComposeExitDirection()
      ?.let {
        FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
      }
    Row(
      horizontalArrangement = props.horizontalArrangement.value.toComposeArrangement(),
      verticalAlignment = props.verticalAlignment.value.toComposeAlignment(),
      modifier = Modifier.fromExpoModifiers(props.modifiers.value, this@Content)
    ) {
      val scope = this@Content
        .with(rowScope = this@Row)
        .withIf(scrollBehavior != null) {
          with(nestedScrollConnection = scrollBehavior)
        }
      Children(scope)
    }
  }
}

class ColumnView(context: Context, appContext: AppContext) : ExpoComposeView<LayoutProps>(context, appContext) {
  override val props = LayoutProps()

  @Composable
  override fun ComposableScope.Content() {
    val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior.value
      ?.toComposeExitDirection()
      ?.let {
        FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
      }
    Column(
      verticalArrangement = props.verticalArrangement.value.toComposeArrangement(),
      horizontalAlignment = props.horizontalAlignment.value.toComposeAlignment(),
      modifier = Modifier.fromExpoModifiers(props.modifiers.value, this@Content)
    ) {
      val scope = this@Content
        .with(columnScope = this@Column)
        .withIf(scrollBehavior != null) {
          with(nestedScrollConnection = scrollBehavior)
        }
      Children(scope)
    }
  }
}

class BoxView(context: Context, appContext: AppContext) : ExpoComposeView<LayoutProps>(context, appContext) {
  override val props = LayoutProps()

  @Composable
  override fun ComposableScope.Content() {
    val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior.value
      ?.toComposeExitDirection()
      ?.let {
        FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
      }
    Box(
      modifier = Modifier
        .fromExpoModifiers(props.modifiers.value, this@Content)
        .then(if (scrollBehavior != null) Modifier.nestedScroll(scrollBehavior) else Modifier)
    ) {
      val scope = this@Content
        .with(boxScope = this@Box)
        .withIf(scrollBehavior != null) {
          with(nestedScrollConnection = scrollBehavior)
        }
      Children(scope)
    }
  }
}
