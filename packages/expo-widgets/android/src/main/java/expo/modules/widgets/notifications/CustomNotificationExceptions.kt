package expo.modules.widgets.notifications

import expo.modules.kotlin.exception.CodedException

internal class NotificationsDisabledException :
  CodedException(
    "The custom notification could not be posted because notifications are disabled for this app. " +
      "Set `enablePushNotifications: true` in the expo-widgets config plugin to add the POST_NOTIFICATIONS permission, " +
      "request it at runtime (for example with expo-notifications' requestPermissionsAsync()), " +
      "and check the app's notification settings."
  )

internal class MissingNotificationChannelException(channelId: String) :
  CodedException(
    "The custom notification could not be posted because the notification channel '$channelId' does not exist. " +
      "Create the channel first (for example with expo-notifications' setNotificationChannelAsync()) " +
      "or omit `channelId` to use the default channel."
  )

internal class CustomNotificationLayoutNotFoundException(name: String) :
  CodedException(
    "No layout is registered for the custom notification '$name'. " +
      "Call createCustomNotification('$name', layout) in the app before posting or updating it."
  )

internal class MissingCollapsedSectionException(name: String) :
  CodedException(
    "The layout of the custom notification '$name' returned no `collapsed` section. " +
      "Return `{ collapsed: <element> }` from the layout function; `expanded` and `headsUp` are optional."
  )

internal class CustomNotificationNotFoundException(name: String, id: String) :
  CodedException(
    "The custom notification '$id' of '$name' is not active. " +
      "The user may have dismissed it, or it was cancelled or timed out. Post it again with post()."
  )

internal class CustomNotificationCancelledException :
  CodedException("The custom notification operation was cancelled before it could be posted.")

internal class SmallIconNotFoundException(name: String) :
  CodedException(
    "The drawable '$name' passed as `smallIcon` was not found in the app's resources. " +
      "Add it to the app's res/drawable directory or omit `smallIcon` to use the default icon."
  )

internal class InvalidNotificationColorException(color: String) :
  CodedException(
    "The value '$color' passed as `color` is not a valid color. Use the #RRGGBB or #AARRGGBB format."
  )
