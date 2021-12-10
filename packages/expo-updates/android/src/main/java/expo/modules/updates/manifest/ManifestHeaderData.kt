package expo.modules.updates.manifest

data class ManifestHeaderData(
  val protocolVersion: String? = null,
  val serverDefinedHeaders: String? = null,
  val manifestFilters: String? = null,
  val manifestSignature: String? = null
)
