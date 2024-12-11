package expo.modules.location

data class LocationParams(
  val accuracy: LocationAccuracy,
  var distance: Float,
  var interval: Long
)

enum class LocationAccuracy {
  LOWEST,
  LOW,
  MEDIUM,
  HIGH
}
