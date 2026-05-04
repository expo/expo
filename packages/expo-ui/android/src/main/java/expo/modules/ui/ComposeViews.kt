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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalGraphicsContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.convertibles.HorizontalAlignment
import expo.modules.ui.convertibles.HorizontalArrangement
import expo.modules.ui.convertibles.VerticalAlignment
import expo.modules.ui.convertibles.ContentAlignment
import expo.modules.ui.convertibles.VerticalArrangement
import expo.modules.ui.convertibles.toComposeArrangement
import expo.modules.kotlin.views.OptimizedComposeProps

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

@OptimizedRecord
data class HostsLayerParams(
  @Field val blendMode: BlendModeType = BlendModeType.SRC_OVER
) : Record

@OptimizedComposeProps
data class LayoutProps(
  val horizontalArrangement: HorizontalArrangement? = null,
  val verticalArrangement: VerticalArrangement? = null,
  val horizontalAlignment: HorizontalAlignment? = null,
  val verticalAlignment: VerticalAlignment? = null,
  val contentAlignment: ContentAlignment? = null,
  val floatingToolbarExitAlwaysScrollBehavior: FloatingToolbarExitAlwaysScrollBehavior? = null,
  /**
   * Only `Box` honors `hostsLayer`. The field lives on the shared `LayoutProps`
   * record but `Row`/`Column`/`FlowRow` ignore it.
   */
  val hostsLayer: HostsLayerParams? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

/**
 * If [params] is non-null, allocates a [GraphicsLayer] tied to this composable's
 * lifetime and keeps its [GraphicsLayer.blendMode] in sync with [params].
 * Returns null when no layer should be hosted.
 */
@Composable
private fun rememberHostedLayer(params: HostsLayerParams?): GraphicsLayer? {
  if (params == null) return null
  val graphicsContext = LocalGraphicsContext.current
  val layer = remember(graphicsContext) { graphicsContext.createGraphicsLayer() }
  val blendMode = params.blendMode.toBlendMode()
  SideEffect { layer.blendMode = blendMode }
  DisposableEffect(layer) {
    onDispose { graphicsContext.releaseGraphicsLayer(layer) }
  }
  return layer
}

/**
 * Returns a `drawLayer(layer)` modifier for compositing [layer] after the
 * receiver's content, or [Modifier] when [layer] is null.
 */
private fun Modifier.thenDrawHostedLayer(layer: GraphicsLayer?): Modifier =
  if (layer != null) {
    this.then(
      Modifier.drawWithContent {
        drawContent()
        drawLayer(layer)
      }
    )
  } else {
    this
  }

@Composable
internal fun FunctionalComposableScope.RowContent(props: LayoutProps) {
  val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior
    ?.toComposeExitDirection()
    ?.let {
      FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
    }
  val inheritedLayer = composableScope.layerToRecord
  Row(
    horizontalArrangement = props.horizontalArrangement?.toComposeArrangement() ?: Arrangement.Start,
    verticalAlignment = props.verticalAlignment?.toComposeAlignment() ?: Alignment.Top,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      .then(if (scrollBehavior != null) Modifier.nestedScroll(scrollBehavior) else Modifier)
  ) {
    Children(UIComposableScope(rowScope = this@Row, nestedScrollConnection = scrollBehavior, layerToRecord = inheritedLayer))
  }
}

@Composable
internal fun FunctionalComposableScope.FlowRowContent(props: LayoutProps) {
  val inheritedLayer = composableScope.layerToRecord
  FlowRow(
    horizontalArrangement = props.horizontalArrangement?.toComposeArrangement() ?: Arrangement.Start,
    verticalArrangement = props.verticalArrangement?.toComposeArrangement() ?: Arrangement.Top,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this@FlowRow, layerToRecord = inheritedLayer))
  }
}

@Composable
internal fun FunctionalComposableScope.ColumnContent(props: LayoutProps) {
  val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior
    ?.toComposeExitDirection()
    ?.let {
      FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
    }
  val inheritedLayer = composableScope.layerToRecord
  Column(
    verticalArrangement = props.verticalArrangement?.toComposeArrangement() ?: Arrangement.Top,
    horizontalAlignment = props.horizontalAlignment?.toComposeAlignment() ?: Alignment.Start,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      .then(if (scrollBehavior != null) Modifier.nestedScroll(scrollBehavior) else Modifier)
  ) {
    Children(UIComposableScope(columnScope = this@Column, nestedScrollConnection = scrollBehavior, layerToRecord = inheritedLayer))
  }
}

@Composable
fun FunctionalComposableScope.BoxContent(props: LayoutProps) {
  val scrollBehavior = props.floatingToolbarExitAlwaysScrollBehavior
    ?.toComposeExitDirection()
    ?.let {
      FloatingToolbarDefaults.exitAlwaysScrollBehavior(exitDirection = it)
    }
  val hostedLayer = rememberHostedLayer(props.hostsLayer)
  // If this Box hosts its own layer, expose it to descendants. Otherwise
  // forward whatever layer the parent scope already exposes, so descendants
  // nested inside intermediate non-host containers still find the host's
  // layer.
  val effectiveLayer = hostedLayer ?: composableScope.layerToRecord
  // Non-`srcOver` blend modes only produce the right output if the composite
  // happens in an offscreen buffer. When hosting a layer with a non-default
  // blend mode, transparently wrap the box in `compositingStrategy = Offscreen`
  // so the user doesn't have to remember it. The offscreen modifier must be
  // the OUTERMOST so user-supplied draw modifiers (e.g. `background(brush)`)
  // paint into the offscreen buffer where the blend can apply.
  val needsOffscreen = props.hostsLayer != null &&
    props.hostsLayer.blendMode != BlendModeType.SRC_OVER
  val offscreenModifier = if (needsOffscreen) {
    Modifier.graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
  } else {
    Modifier
  }
  Box(
    contentAlignment = props.contentAlignment?.toComposeAlignment() ?: Alignment.TopStart,
    modifier = offscreenModifier
      .then(ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher))
      .then(if (scrollBehavior != null) Modifier.nestedScroll(scrollBehavior) else Modifier)
      .thenDrawHostedLayer(hostedLayer)
  ) {
    Children(UIComposableScope(boxScope = this@Box, nestedScrollConnection = scrollBehavior, layerToRecord = effectiveLayer))
  }
}
