package expo.modules.location.services

internal class LocationTaskService : BaseForegroundTaskService() {
  override val channelDescription = "Background location notification channel"
}
