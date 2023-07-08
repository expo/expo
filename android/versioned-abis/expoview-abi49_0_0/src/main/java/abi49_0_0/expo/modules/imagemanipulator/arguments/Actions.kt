package abi49_0_0.expo.modules.imagemanipulator.arguments

import abi49_0_0.expo.modules.imagemanipulator.ManipulateAction
import abi49_0_0.expo.modules.imagemanipulator.actions.Action
import abi49_0_0.expo.modules.imagemanipulator.actions.CropAction
import abi49_0_0.expo.modules.imagemanipulator.actions.FlipAction
import abi49_0_0.expo.modules.imagemanipulator.actions.ResizeAction
import abi49_0_0.expo.modules.imagemanipulator.actions.RotateAction

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
