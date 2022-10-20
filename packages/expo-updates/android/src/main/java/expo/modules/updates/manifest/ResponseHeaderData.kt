package expo.modules.updates.manifest

data class ResponseHeaderData(
  val protocolVersion: String? = null,
  val serverDefinedHeaders: String? = null,
  val manifestFilters: String? = null,
  /**
   * Classic updates Expo Go manifest signature
   */
  val manifestSignature: String? = null,
)

data class ResponsePartHeaderData(
  /**
   * Code signing part signature
   */
  val signature: String? = null
)

data class ResponsePartInfo(
  val responseHeaderData: ResponseHeaderData,
  val responsePartHeaderData: ResponsePartHeaderData,
  val body: String
)
