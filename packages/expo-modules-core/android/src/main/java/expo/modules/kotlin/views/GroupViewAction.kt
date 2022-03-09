package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup

class GroupViewAction(
  val body: (Payload) -> Any
) {
  data class Payload(
    val parentView: ViewGroup? = null,
    val childView: View? = null,
    val index: Int? = null
  )

  enum class Action {
    ADD_VIEW,
    GET_CHILD_AT,
    GET_CHILD_COUNT,
    REMOVE_VIEW,
    REMOVE_VIEW_AT
  }
}
