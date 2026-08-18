package expo.modules.ui

import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.RowScope
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import expo.modules.kotlin.views.ComposableScope

data class UIComposableScope(
  val rowScope: RowScope? = null,
  val columnScope: ColumnScope? = null,
  val boxScope: BoxScope? = null,
  val nestedScrollConnection: NestedScrollConnection? = null
) : ComposableScope

val ComposableScope.rowScope: RowScope?
  get() = (this as? UIComposableScope)?.rowScope

val ComposableScope.columnScope: ColumnScope?
  get() = (this as? UIComposableScope)?.columnScope

val ComposableScope.boxScope: BoxScope?
  get() = (this as? UIComposableScope)?.boxScope

val ComposableScope.nestedScrollConnection: NestedScrollConnection?
  get() = (this as? UIComposableScope)?.nestedScrollConnection
