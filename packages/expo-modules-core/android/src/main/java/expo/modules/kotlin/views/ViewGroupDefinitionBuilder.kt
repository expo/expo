@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.modules.DefinitionMarker

@DefinitionMarker
class ViewGroupDefinitionBuilder<ParentType : ViewGroup> {
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

  @Suppress("UNCHECKED_CAST")
  inline fun <reified ChildViewType : View> AddChildView(
    crossinline body: (parent: ParentType, child: ChildViewType, index: Int) -> Unit
  ) {
    addViewAction = { parent, child, index ->
      body(parent as ParentType, child as ChildViewType, index)
    }
  }

  @Suppress("UNCHECKED_CAST")
  inline fun GetChildCount(
    crossinline body: (view: ParentType) -> Int
  ) {
    getChildCountAction = { view ->
      body(view as ParentType)
    }
  }

  @Suppress("UNCHECKED_CAST")
  inline fun <reified ChildViewType : View> GetChildViewAt(
    crossinline body: (view: ParentType, index: Int) -> ChildViewType?
  ) {
    getChildAtAction = { view, index ->
      body(view as ParentType, index)
    }
  }

  @Suppress("UNCHECKED_CAST")
  inline fun RemoveChildViewAt(
    crossinline body: (view: ParentType, index: Int) -> Unit
  ) {
    removeViewAtAction = { view, index ->
      body(view as ParentType, index)
    }
  }

  @Suppress("UNCHECKED_CAST")
  inline fun <reified ChildViewType : View> RemoveChildView(
    noinline body: (parent: ParentType, child: ChildViewType) -> Unit
  ) {
    removeViewAction = { view, child ->
      body(view as ParentType, child as ChildViewType)
    }
  }
}
