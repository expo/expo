package expo.modules.location.services

internal class MotionActivityTaskService : BaseForegroundTaskService() {
  override val channelDescription = "Background motion activity notification channel"

  override fun nextServiceId(): Int = sServiceId++

  companion object {
    // Uses a base far from LocationTaskService's own counter so the two services, which run as
    // independent foreground-service notifications, can never end up sharing a notification ID.
    private var sServiceId = 581756
  }
}
