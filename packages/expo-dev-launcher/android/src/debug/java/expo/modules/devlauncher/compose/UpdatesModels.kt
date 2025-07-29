package expo.modules.devlauncher.compose

data class Update(
  val id: String,
  val name: String,
  val createdAt: String?,
  val isCompatible: Boolean = false,
  val permalink: String
)

data class Branch(
  val name: String,
  val compatibleUpdate: Update? = null
)
