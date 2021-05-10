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

enum class DevLauncherUserInterface {
  @SerializedName("automatic")
  AUTOMATIC,

  @SerializedName("dark")
  DARK,

  @SerializedName("light")
  LIGHT
}

enum class DevLauncherStatusBarStyle {
  @SerializedName("dark-content")
  DARK,

  @SerializedName("light-content")
  LIGHT
}
