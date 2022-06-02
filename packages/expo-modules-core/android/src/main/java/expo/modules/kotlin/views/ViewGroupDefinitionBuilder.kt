@file:OptIn(ExperimentalStdlibApi::class)
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

  @Deprecated(
    message = "The 'addChildView' component was renamed to 'AddChildView'.",
    replaceWith = ReplaceWith("AddChildView(body)")
  )
  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> addChildView(
    noinline body: (parent: ParentViewType, child: ChildViewType, index: Int) -> Unit
  ) = AddChildView(body)

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> AddChildView(
    noinline body: (parent: ParentViewType, child: ChildViewType, index: Int) -> Unit
  ) {
    addViewAction = { parent, child, index ->
      body(parent as ParentViewType, child as ChildViewType, index)
    }
  }

  @Deprecated(
    message = "The 'getChildCount' component was renamed to 'GetChildCount'.",
    replaceWith = ReplaceWith("GetChildCount(body)")
  )
  inline fun <reified ParentViewType : ViewGroup> getChildCount(
    noinline body: (view: ParentViewType) -> Int
  ) = GetChildCount(body)

  inline fun <reified ParentViewType : ViewGroup> GetChildCount(
    noinline body: (view: ParentViewType) -> Int
  ) {
    getChildCountAction = { view ->
      body(view as ParentViewType)
    }
  }

  @Deprecated(
    message = "The 'getChildViewAt' component was renamed to 'GetChildViewAt'.",
    replaceWith = ReplaceWith("GetChildViewAt(body)")
  )
  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> getChildViewAt(
    noinline body: (view: ParentViewType, index: Int) -> ChildViewType?
  ) = GetChildViewAt(body)

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> GetChildViewAt(
    noinline body: (view: ParentViewType, index: Int) -> ChildViewType?
  ) {
    getChildAtAction = { view, index ->
      body(view as ParentViewType, index)
    }
  }

  @Deprecated(
    message = "The 'removeChildViewAt' component was renamed to 'RemoveChildViewAt'.",
    replaceWith = ReplaceWith("RemoveChildViewAt(body)")
  )
  inline fun <reified ParentViewType : ViewGroup> removeChildViewAt(
    noinline body: (view: ParentViewType, index: Int) -> Unit
  ) = RemoveChildViewAt(body)

  inline fun <reified ParentViewType : ViewGroup> RemoveChildViewAt(
    noinline body: (view: ParentViewType, index: Int) -> Unit
  ) {
    removeViewAtAction = { view, index ->
      body(view as ParentViewType, index)
    }
  }

  @Deprecated(
    message = "The 'removeChildView' component was renamed to 'RemoveChildView'.",
    replaceWith = ReplaceWith("RemoveChildView(body)")
  )
  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> removeChildView(
    noinline body: (parent: ParentViewType, child: ChildViewType) -> Unit
  ) = RemoveChildView(body)

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> RemoveChildView(
    noinline body: (parent: ParentViewType, child: ChildViewType) -> Unit
  ) {
    removeViewAction = { view, child ->
      body(view as ParentViewType, child as ChildViewType)
    }
  }
}
