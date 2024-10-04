package abi49_0_0.expo.modules.permissions

enum class PermissionsTypes(val type: String) {
  LOCATION("location"),
  LOCATION_FOREGROUND("locationForeground"),
  LOCATION_BACKGROUND("locationBackground"),
  CAMERA("camera"),
  CONTACTS("contacts"),
  AUDIO_RECORDING("audioRecording"),
  MEDIA_LIBRARY_WRITE_ONLY("mediaLibraryWriteOnly"),
  MEDIA_LIBRARY("mediaLibrary"),
  CALENDAR("calendar"),
  SMS("sms"),
  REMINDERS("reminders"),
  NOTIFICATIONS("notifications"),
  USER_FACING_NOTIFICATIONS("userFacingNotifications"),
  SYSTEM_BRIGHTNESS("systemBrightness");

  override fun toString(): String = type
}
