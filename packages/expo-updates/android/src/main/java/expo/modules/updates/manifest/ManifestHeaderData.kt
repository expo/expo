package expo.modules.updates.manifest

data class ManifestHeaderData(
  val protocolVersion: String? = null,
  val serverDefinedHeaders: String? = null,
  val manifestFilters: String? = null,
  /**
   * Classic updates Expo Go manifest signature
   */
  val manifestSignature: String? = null,
  /**
   * Code signing manifest signature
   */
  val signature: String? = null
)
