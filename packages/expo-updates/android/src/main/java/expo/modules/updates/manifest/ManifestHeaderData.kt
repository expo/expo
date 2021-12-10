package expo.modules.updates.manifest

data class ManifestHeaderData(
  val protocolVersion: String?,
  val serverDefinedHeaders: String?,
  val manifestFilters: String?,
  val manifestSignature: String?
)
