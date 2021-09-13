package expo.modules.devlauncher.launcher.manifest

import com.google.gson.annotations.SerializedName

enum class DevLauncherOrientation {
  @SerializedName("default")
  DEFAULT,

  @SerializedName("portrait")
  PORTRAIT,

  @SerializedName("landscape")
  LANDSCAPE
}

object DevLauncherOrientationValues {
  const val DEFAULT = "default"
  const val PORTRAIT = "portrait"
  const val LANDSCAPE = "landscape"
}

enum class DevLauncherUserInterface {
  @SerializedName("automatic")
  AUTOMATIC,

  @SerializedName("dark")
  DARK,

  @SerializedName("light")
  LIGHT
}

object DevLauncherUserInterfaceValues {
  const val AUTOMATIC = "automatic"
  const val DARK = "dark"
  const val LIGHT = "light"
}

enum class DevLauncherStatusBarStyle {
  @SerializedName("dark-content")
  DARK,

  @SerializedName("light-content")
  LIGHT
}

object DevLauncherStatusBarStyleValues {
  const val DARK = "dark-content"
  const val LIGHT = "light-content"
}
