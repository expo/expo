@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.modules.DefinitionMarker

@DefinitionMarker
class GroupViewDefinitionBuilder {
  @PublishedApi
  internal var actions = mutableMapOf<GroupViewAction.Action, GroupViewAction>()

  fun build() = GroupViewDefinition(actions)

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> addView(
    noinline body: (parent: ParentViewType, child: ChildViewType, index: Int) -> Unit
  ) {
    actions[GroupViewAction.Action.ADD_VIEW] = GroupViewAction { (parent, child, index) ->
      body(parent as ParentViewType, child as ChildViewType, index!!)
    }
  }

  inline fun <reified ParentViewType : ViewGroup> getChildCount(
    noinline body: (view: ParentViewType) -> Int
  ) {
    actions[GroupViewAction.Action.GET_CHILD_COUNT] = GroupViewAction { (view) ->
      body(view as ParentViewType)
    }
  }

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> getChildAt(
    noinline body: (view: ParentViewType, index: Int) -> ChildViewType
  ) {
    actions[GroupViewAction.Action.GET_CHILD_AT] = GroupViewAction { (view, _, index) ->
      body(view as ParentViewType, index!!)
    }
  }

  inline fun <reified ParentViewType : ViewGroup> removeViewAt(
    noinline body: (view: ParentViewType, index: Int) -> Unit
  ) {
    actions[GroupViewAction.Action.REMOVE_VIEW_AT] = GroupViewAction { (view, _, index) ->
      body(view as ParentViewType, index!!)
    }
  }

  inline fun <reified ParentViewType : ViewGroup, reified ChildViewType : View> removeView(
    noinline body: (parent: ParentViewType, child: ChildViewType) -> Unit
  ) {
    actions[GroupViewAction.Action.REMOVE_VIEW] = GroupViewAction { (view, child) ->
      body(view as ParentViewType, child as ChildViewType)
    }
  }
}
