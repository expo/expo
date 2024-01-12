package expo.modules.haptics.arguments

object HapticsNotificationType {
  private val types = mapOf(
    "success" to HapticsVibrationType(
      longArrayOf(0, 40, 100, 40),
      intArrayOf(0, 50, 0, 60),
      longArrayOf(0, 40, 100, 40)
    ),
    "warning" to HapticsVibrationType(
      longArrayOf(0, 40, 120, 60),
      intArrayOf(0, 40, 0, 60),
      longArrayOf(0, 40, 120, 60)
    ),
    "error" to HapticsVibrationType(
      longArrayOf(0, 60, 100, 40, 80, 50),
      intArrayOf(0, 50, 0, 40, 0, 50),
      longArrayOf(0, 60, 100, 40, 80, 50)
    )
  )

  @Throws(HapticsInvalidArgumentException::class)
  fun fromString(type: String): HapticsVibrationType =
    types.getOrElse(type) {
      throw HapticsInvalidArgumentException("'type' must be one of ['success', 'warning', 'error']. Obtained '$type'.")
    }
}
