@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.modules.DefinitionMarker

@DefinitionMarker
class ViewGroupDefinitionBuilder {
  @PublishedApi
  internal var addViewAction: AddViewAction? = null

  @PublishedApi
  internal var getChildAtAction: GetChildAtAction? = null

  @PublishedApi
  internal var getChildCountAction: GetChildCountAction? = null

  @PublishedApi
  internal var removeViewAction: RemoveViewAction? = null

  @PublishedApi
  internal var removeViewAtAction: RemoveViewAtAction? = null

  fun build() = ViewGroupDefinition(
    addViewAction,
    getChildAtAction,
    getChildCountAction,
    removeViewAction,
    removeViewAtAction
  )

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> AddChildView(
    noinline body: (parent: ParentViewType, child: ChildViewType, index: Int) -> Unit
  ) {
    addViewAction = { parent, child, index ->
      body(parent as ParentViewType, child as ChildViewType, index)
    }
  }

  inline fun <reified ParentViewType : ViewGroup> GetChildCount(
    noinline body: (view: ParentViewType) -> Int
  ) {
    getChildCountAction = { view ->
      body(view as ParentViewType)
    }
  }

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> GetChildViewAt(
    noinline body: (view: ParentViewType, index: Int) -> ChildViewType?
  ) {
    getChildAtAction = { view, index ->
      body(view as ParentViewType, index)
    }
  }

  inline fun <reified ParentViewType : ViewGroup> RemoveChildViewAt(
    noinline body: (view: ParentViewType, index: Int) -> Unit
  ) {
    removeViewAtAction = { view, index ->
      body(view as ParentViewType, index)
    }
  }

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> RemoveChildView(
    noinline body: (parent: ParentViewType, child: ChildViewType) -> Unit
  ) {
    removeViewAction = { view, child ->
      body(view as ParentViewType, child as ChildViewType)
    }
  }
}
