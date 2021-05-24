package expo.interfaces.devmenu.expoapi

class DevMenuEASUpdates {
  data class Channel(
    val id: String,
    val name: String,
    val createdAt: String,
    val updatedAt: String
  )

  data class Branch(
    val id: String,
    val updates: Array<Update>
  ) {
    override fun equals(other: Any?): Boolean {
      if (this === other) return true
      if (javaClass != other?.javaClass) return false

      other as Branch

      if (id != other.id) return false
      if (!updates.contentEquals(other.updates)) return false

      return true
    }

    override fun hashCode(): Int {
      var result = id.hashCode()
      result = 31 * result + updates.contentHashCode()
      return result
    }
  }

  data class Update(
    val id: String,
    val message: String,
    val platform: String,
    val runtimeVersion: String,
    val createdAt: String,
    val updatedAt: String
  )
}
