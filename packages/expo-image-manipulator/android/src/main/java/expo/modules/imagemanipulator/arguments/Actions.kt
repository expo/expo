package expo.modules.imagemanipulator.arguments

import expo.modules.imagemanipulator.actions.Action
import expo.modules.imagemanipulator.actions.CropAction
import expo.modules.imagemanipulator.actions.FillAction
import expo.modules.imagemanipulator.actions.FlipAction
import expo.modules.imagemanipulator.actions.ResizeAction
import expo.modules.imagemanipulator.actions.RotateAction
import java.util.*

private const val KEY_CROP = "crop"
private const val KEY_FLIP = "flip"
private const val KEY_RESIZE = "resize"
private const val KEY_ROTATE = "rotate"
private const val KEY_FILL = "fill"

class Actions(public val actions: List<Action>) {
  companion object {
    fun fromArgument(rawList: ArrayList<Any?>): Actions {
      val actions: MutableList<Action> = mutableListOf()

      for (rawObject in rawList) {
        require(rawObject is Map<*, *>)
        when {
          rawObject.containsKey(KEY_CROP) -> actions.add(CropAction.fromObject(rawObject[KEY_CROP]!!))
          rawObject.containsKey(KEY_FILL) -> actions.add(FillAction.fromObject(rawObject[KEY_FILL]!! as String))
          rawObject.containsKey(KEY_FLIP) -> actions.add(FlipAction.fromObject(rawObject[KEY_FLIP]!! as String))
          rawObject.containsKey(KEY_RESIZE) -> actions.add(ResizeAction.fromObject(rawObject[KEY_RESIZE]!!))
          rawObject.containsKey(KEY_ROTATE) -> actions.add(RotateAction.fromObject((rawObject[KEY_ROTATE]!! as Double).toInt()))
        }
      }

      return Actions(actions)
    }
  }
}
