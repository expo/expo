package expo.modules.devlauncher.compose

data class Session(
  val token: String,
  val version: Int,
  val expiresAt: Long,
)
