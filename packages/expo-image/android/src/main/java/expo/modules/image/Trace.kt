package expo.modules.image

object Trace {
  val tag = "ExpoImage"
  val loadNewImageBlock = "load new image"

  private var lastCookieValue = 0
  fun getNextCookieValue() = synchronized(this) {
    lastCookieValue++
  }
}
