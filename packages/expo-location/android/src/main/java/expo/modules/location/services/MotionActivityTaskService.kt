package expo.modules.location.services

internal class MotionActivityTaskService : BaseForegroundTaskService() {
  override val channelDescription = "Background motion activity notification channel"
}
