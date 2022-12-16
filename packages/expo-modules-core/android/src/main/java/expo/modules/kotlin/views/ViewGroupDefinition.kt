package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup

class ViewGroupDefinition(
  val addViewAction: AddViewAction?,
  val getChildAtAction: GetChildAtAction?,
  val getChildCountAction: GetChildCountAction?,
  val removeViewAction: RemoveViewAction?,
  val removeViewAtAction: RemoveViewAtAction?
)

internal typealias AddViewAction = (parent: ViewGroup, child: View, index: Int) -> Unit
internal typealias GetChildAtAction = (parent: ViewGroup, index: Int) -> View?
internal typealias GetChildCountAction = (parent: ViewGroup) -> Int
internal typealias RemoveViewAction = (parent: ViewGroup, childToRemove: View) -> Unit
internal typealias RemoveViewAtAction = (parent: ViewGroup, index: Int) -> Unit
