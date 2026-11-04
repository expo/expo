@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalLayoutDirection
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
class TopAppBarColors : Record {
  @Field val containerColor: Color? = null

  @Field val navigationIconContentColor: Color? = null

  @Field val titleContentColor: Color? = null

  @Field val actionIconContentColor: Color? = null
}

@OptimizedComposeProps
data class TopAppBarProps(
  val colors: TopAppBarColors = TopAppBarColors(),
  val windowInsets: PaddingValuesRecord? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.TopAppBarContent(props: TopAppBarProps) {
  val layoutDirection = LocalLayoutDirection.current
  val windowInsets = props.windowInsets?.toPaddingValues()?.let {
    WindowInsets(
      left = it.calculateLeftPadding(layoutDirection),
      top = it.calculateTopPadding(),
      right = it.calculateRightPadding(layoutDirection),
      bottom = it.calculateBottomPadding()
    )
  } ?: TopAppBarDefaults.windowInsets

  TopAppBar(
    title = { Children(UIComposableScope(), filter = { isSlotWithName(it, "title") }) },
    navigationIcon = { Children(UIComposableScope(), filter = { isSlotWithName(it, "navigationIcon") }) },
    actions = { Children(UIComposableScope(rowScope = this), filter = { isSlotWithName(it, "actions") }) },
    windowInsets = windowInsets,
    colors = TopAppBarDefaults.topAppBarColors(
      containerColor = props.colors.containerColor.compose,
      navigationIconContentColor = props.colors.navigationIconContentColor.compose,
      titleContentColor = props.colors.titleContentColor.compose,
      actionIconContentColor = props.colors.actionIconContentColor.compose
    ),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )
}
