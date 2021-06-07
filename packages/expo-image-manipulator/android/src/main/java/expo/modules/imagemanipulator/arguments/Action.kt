package expo.modules.imagemanipulator.arguments

import java.util.*

class Action private constructor(
  val resize: ActionResize?,
  val rotate: Int?,
  val flip: ActionFlip?,
  val crop: ActionCrop?
) {

  companion object {
    private const val TAG = "action"
    private const val KEY_RESIZE = "resize"
    private const val KEY_ROTATE = "rotate"
    private const val KEY_FLIP = "flip"
    private const val KEY_CROP = "crop"
    @Throws(IllegalArgumentException::class)
    fun fromObject(options: Any?): Action {
      require(options is Map<*, *>) { "'$TAG' must be an object" }
      val optionsMap = options
      val resize = if (optionsMap.containsKey(KEY_RESIZE)) ActionResize.fromObject(optionsMap[KEY_RESIZE]) else null
      var rotate: Int? = null
      if (optionsMap.containsKey(KEY_ROTATE)) {
        require(optionsMap[KEY_ROTATE] is Double) { "'$TAG.$KEY_ROTATE' must be a Number value" }
        rotate = (optionsMap[KEY_ROTATE] as Double?)!!.toInt()
      }
      val flip = if (optionsMap.containsKey(KEY_FLIP)) ActionFlip.fromObject(optionsMap[KEY_FLIP]) else null
      val crop = if (optionsMap.containsKey(KEY_CROP)) ActionCrop.fromObject(optionsMap[KEY_CROP]) else null
      val actions = ArrayList<Any?>()
      actions.add(resize)
      actions.add(rotate)
      actions.add(flip)
      actions.add(crop)
      var actionsCounter = 0
      for (action in actions) {
        if (action != null) {
          actionsCounter += 1
        }
      }
      require(actionsCounter == 1) {
        String.format(
          "Single action must contain exactly one transformation from list: ['%s', '%s', '%s', '%s']",
          KEY_RESIZE,
          KEY_ROTATE,
          KEY_FLIP,
          KEY_CROP
        )
      }
      return Action(resize, rotate, flip, crop)
    }
  }
}
