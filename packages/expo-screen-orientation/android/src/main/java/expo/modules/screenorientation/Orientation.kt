package expo.modules.screenorientation

/*
 * Enum representing current a screen orientation.
 */
enum class Orientation(val value: Int) {
  UNKNOWN(0),
  PORTRAIT(1),
  PORTRAIT_UP(2),
  PORTRAIT_DOWN(3),
  LANDSCAPE(4),
  LANDSCAPE_LEFT(5),
  LANDSCAPE_RIGHT(6),
}
