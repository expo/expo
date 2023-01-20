package expo.modules.imagemanipulator.arguments

import expo.modules.imagemanipulator.ManipulateAction
import expo.modules.imagemanipulator.actions.Action
import expo.modules.imagemanipulator.actions.CropAction
import expo.modules.imagemanipulator.actions.FlipAction
import expo.modules.imagemanipulator.actions.ResizeAction
import expo.modules.imagemanipulator.actions.RotateAction

class Actions(val actions: List<Action>) {
  companion object {
    fun fromArgument(actionList: List<ManipulateAction>): Actions {
      val actions: MutableList<Action> = mutableListOf()

      for (action in actionList) {
        action.flip?.let {
          actions.add(FlipAction(it))
        }
        action.crop?.let {
          actions.add(CropAction(it))
        }
        action.rotate?.let {
          actions.add(RotateAction(it.toInt()))
        }
        action.resize?.let {
          actions.add(ResizeAction(it))
        }
      }

      return Actions(actions)
    }
  }
}
