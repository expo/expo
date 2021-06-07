package expo.modules.imagemanipulator.arguments

class ActionCrop private constructor(
  val originX: Int,
  val originY: Int,
  val width: Int,
  val height: Int) {

  companion object {
    private const val TAG = "action.crop"
    private const val KEY_ORIGIN_X = "originX"
    private const val KEY_ORIGIN_Y = "originY"
    private const val KEY_WIDTH = "width"
    private const val KEY_HEIGHT = "height"
    @Throws(IllegalArgumentException::class)
    fun fromObject(options: Any?): ActionCrop {
      require(options is Map<*, *>) { "'$TAG' must be an object" }
      val optionsMap = options
      val originXDouble = getDoubleFromOptions(optionsMap, KEY_ORIGIN_X, TAG + "." + KEY_ORIGIN_X)
        ?: throw IllegalArgumentException("'" + TAG + "." + KEY_ORIGIN_X + "' must be defined")
      val originX = originXDouble.toInt()
      val originYDouble = getDoubleFromOptions(optionsMap, KEY_ORIGIN_Y, TAG + "." + KEY_ORIGIN_Y)
        ?: throw IllegalArgumentException("'" + TAG + "." + KEY_ORIGIN_Y + "' must be defined")
      val originY = originYDouble.toInt()
      val widthDouble = getDoubleFromOptions(optionsMap, KEY_WIDTH, TAG + "." + KEY_WIDTH)
        ?: throw IllegalArgumentException("'" + TAG + "." + KEY_WIDTH + "' must be defined")
      val width = widthDouble.toInt()
      val heightDouble = getDoubleFromOptions(optionsMap, KEY_HEIGHT, TAG + "." + KEY_HEIGHT)
        ?: throw IllegalArgumentException("'" + TAG + "." + KEY_HEIGHT + "' must be defined")
      val height = heightDouble.toInt()
      return ActionCrop(originX, originY, width, height)
    }

    private fun getDoubleFromOptions(options: Map<*, *>, key: String, pathToErroneousKey: String): Double? {
      if (!options.containsKey(key)) {
        return null
      }
      require(options[key] is Double) { "'$pathToErroneousKey' must be a Number value" }
      return options[key] as Double?
    }
  }
}
