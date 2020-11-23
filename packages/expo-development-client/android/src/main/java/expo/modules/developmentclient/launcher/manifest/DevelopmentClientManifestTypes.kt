package expo.modules.developmentclient.launcher.manifest

import com.google.gson.annotations.SerializedName

enum class DevelopmentClientOrientation {
  @SerializedName("default")
  DEFAULT,

  @SerializedName("portrait")
  PORTRAIT,

  @SerializedName("landscape")
  LANDSCAPE
}

enum class DevelopmentClientUserInterface {
  @SerializedName("automatic")
  AUTOMATIC,

  @SerializedName("dark")
  DARK,

  @SerializedName("light")
  LIGHT
}

enum class DevelopmentClientStatusBarStyle {
  @SerializedName("dark-content")
  DARK,

  @SerializedName("light-content")
  LIGHT
}
