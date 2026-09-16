package expo.modules.location.services

internal class LocationTaskService : BaseForegroundTaskService() {
  override val channelDescription = "Background location notification channel"

  override fun nextServiceId(): Int = sServiceId++

  companion object {
    private var sServiceId = 481756
  }
}
