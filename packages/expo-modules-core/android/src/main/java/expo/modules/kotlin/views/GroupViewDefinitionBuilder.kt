@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.modules.DefinitionMarker

@DefinitionMarker
class GroupViewDefinitionBuilder {
  @PublishedApi internal var addViewAction: AddViewAction? = null
  @PublishedApi internal var getChildAtAction: GetChildAtAction? = null
  @PublishedApi internal var getChildCountAction: GetChildCountAction? = null
  @PublishedApi internal var removeViewAction: RemoveViewAction? = null
  @PublishedApi internal var removeViewAtAction: RemoveViewAtAction? = null

  fun build() = GroupViewDefinition(
    addViewAction,
    getChildAtAction,
    getChildCountAction,
    removeViewAction,
    removeViewAtAction
  )

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> addView(
    noinline body: (parent: ParentViewType, child: ChildViewType, index: Int) -> Unit
  ) {
    addViewAction = { parent, child, index ->
      body(parent as ParentViewType, child as ChildViewType, index)
    }
  }

  inline fun <reified ParentViewType : ViewGroup> getChildCount(
    noinline body: (view: ParentViewType) -> Int
  ) {
    getChildCountAction = { view ->
      body(view as ParentViewType)
    }
  }

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> getChildAt(
    noinline body: (view: ParentViewType, index: Int) -> ChildViewType
  ) {
    getChildAtAction = { view, index ->
      body(view as ParentViewType, index)
    }
  }

  inline fun <reified ParentViewType : ViewGroup> removeViewAt(
    noinline body: (view: ParentViewType, index: Int) -> Unit
  ) {
    removeViewAtAction = { view, index ->
      body(view as ParentViewType, index)
    }
  }

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> removeView(
    noinline body: (parent: ParentViewType, child: ChildViewType) -> Unit
  ) {
    removeViewAction = { view, child ->
      body(view as ParentViewType, child as ChildViewType)
    }
  }
}
