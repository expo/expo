package expo.modules.devlauncher.compose.routes

import kotlinx.serialization.Serializable

object Routes {
  @Serializable
  object Main

  @Serializable
  object Home

  @Serializable
  object Settings

  @Serializable
  object Updates {
    @Serializable
    object Branches

    @Serializable
    data class Branch(val name: String)
  }
}
