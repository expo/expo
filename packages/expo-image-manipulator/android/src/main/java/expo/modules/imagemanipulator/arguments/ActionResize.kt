package expo.modules.imagemanipulator.arguments

class ActionResize private constructor(val width: Int, val height: Int) {

  companion object {
    private const val TAG = "action.resize"
    private const val KEY_WIDTH = "width"
    private const val KEY_HEIGHT = "height"
    fun fromObject(options: Any?): ActionResize {
      require(options is Map<*, *>) { "'$TAG' must be an object" }
      val optionsMap = options
      var width = 0
      if (optionsMap.containsKey(KEY_WIDTH)) {
        require(optionsMap[KEY_WIDTH] is Double) { "'$TAG.$KEY_WIDTH' must be a Number value" }
        width = (optionsMap[KEY_WIDTH] as Double?)!!.toInt()
      }
      var height = 0
      if (optionsMap.containsKey(KEY_HEIGHT)) {
        require(optionsMap[KEY_HEIGHT] is Double) { "'$TAG.$KEY_HEIGHT' must be a Number value" }
        height = (optionsMap[KEY_HEIGHT] as Double?)!!.toInt()
      }
      return ActionResize(width, height)
    }
  }
}
