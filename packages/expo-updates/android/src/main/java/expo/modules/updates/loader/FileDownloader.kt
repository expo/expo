package expo.modules.updates.loader

import androidx.annotation.VisibleForTesting
import expo.modules.jsonutils.require
import expo.modules.structuredheaders.Dictionary
import expo.modules.structuredheaders.OuterList
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.UpdatesUtils.parseContentDispositionNameParameter
import expo.modules.updates.codesigning.ValidationResult
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.ResponseHeaderData
import expo.modules.updates.manifest.ResponsePartHeaderData
import expo.modules.updates.manifest.ResponsePartInfo
import expo.modules.updates.manifest.UpdateFactory
import expo.modules.updates.selectionpolicy.SelectionPolicies
import okhttp3.Cache
import okhttp3.Headers
import okhttp3.MultipartReader
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.brotli.BrotliInterceptor
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.security.cert.CertificateException
import java.util.Date
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.MediaType
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.Source
import okio.buffer
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Utility class that holds all the logic for downloading data and files, such as update manifests
 * and assets, using an instance of [OkHttpClient].
 */
class FileDownloader(
  private val filesDirectory: File,
  private val easClientID: String,
  private val configuration: UpdatesConfiguration,
  private val logger: UpdatesLogger
) {
  // If the configured launch wait milliseconds is greater than the okhttp default (10_000)
  // we should use that as the timeout. For example, let's say launchWaitMs is 20 seconds,
  // the HTTP timeout should be at least 20 seconds.
  private var client: OkHttpClient = OkHttpClient.Builder()
    .cache(getCache())
    .connectTimeout(max(configuration.launchWaitMs.toLong(), 10_000L), TimeUnit.MILLISECONDS)
    .readTimeout(max(configuration.launchWaitMs.toLong(), 10_000L), TimeUnit.MILLISECONDS)
    .addInterceptor(BrotliInterceptor)
    .build()

  /**
   * Constructor for tests
   */
  constructor(filesDirectory: File, easClientID: String, configuration: UpdatesConfiguration, logger: UpdatesLogger, client: OkHttpClient) : this(filesDirectory, easClientID, configuration, logger) {
    this.client = client
  }

  data class FileDownloadResult(val file: File, val hash: ByteArray)
  data class AssetDownloadResult(val assetEntity: AssetEntity, val isNew: Boolean)

  private suspend fun downloadAssetAndVerifyHashAndWriteToPath(
    request: Request,
    expectedBase64URLEncodedSHA256Hash: String?,
    destination: File,
    progressListener: FileDownloadProgressListener? = null
  ): FileDownloadResult {
    try {
      val response = downloadData(request, progressListener)

      if (!response.isSuccessful) {
        val message = "Asset download request not successful"
        val cause = IOException(response.body?.string() ?: "Unknown error")
        logger.error(message, cause, UpdatesErrorCode.AssetsFailedToLoad)
        throw IOException(message, cause)
      }

      try {
        response.body!!.byteStream().use { inputStream ->
          val hash = UpdatesUtils.verifySHA256AndWriteToFile(inputStream, destination, expectedBase64URLEncodedSHA256Hash)
          return FileDownloadResult(destination, hash)
        }
      } catch (e: Exception) {
        val message = "Failed to write asset file from ${request.url} to destination $destination"
        logger.error(message, e, UpdatesErrorCode.AssetsFailedToLoad)
        throw IOException(message, e)
      }
    } catch (e: IOException) {
      val message = "Failed to download asset from URL ${request.url}"
      logger.error(message, e, UpdatesErrorCode.AssetsFailedToLoad)
      throw IOException(message, e)
    }
  }

  internal fun parseRemoteUpdateResponse(response: Response): UpdateResponse {
    val responseHeaders = response.headers
    val responseHeaderData = ResponseHeaderData(
      protocolVersionRaw = responseHeaders["expo-protocol-version"],
      manifestFiltersRaw = responseHeaders["expo-manifest-filters"],
      serverDefinedHeadersRaw = responseHeaders["expo-server-defined-headers"]
    )
    val responseBody = response.body

    if (response.code == 204 || responseBody == null) {
      // If the protocol version greater than 0, we support returning a 204 and no body to mean no-op.
      // A 204 has no content-type.
      if (responseHeaderData.protocolVersion != null && responseHeaderData.protocolVersion > 0) {
        return UpdateResponse(
          responseHeaderData = responseHeaderData,
          manifestUpdateResponsePart = null,
          directiveUpdateResponsePart = null
        )
      }

      val message = "Invalid update response"
      val cause = IOException("Empty body")
      logger.error(message, cause, UpdatesErrorCode.UpdateFailedToLoad)
      throw IOException(message, cause)
    }

    val isMultipart = responseBody.contentType()?.type == "multipart"
    if (isMultipart) {
      return parseMultipartRemoteUpdateResponse(response, responseBody, responseHeaderData)
    } else {
      val manifestResponseInfo = ResponsePartInfo(
        responseHeaderData = responseHeaderData,
        responsePartHeaderData = ResponsePartHeaderData(
          signature = responseHeaders["expo-signature"]
        ),
        body = response.body!!.string()
      )

      val manifestUpdateResponsePart = parseManifest(
        manifestResponseInfo,
        null,
        null
      )

      return UpdateResponse(
        responseHeaderData = responseHeaderData,
        manifestUpdateResponsePart = manifestUpdateResponsePart,
        directiveUpdateResponsePart = null
      )
    }
  }

  private fun parseMultipartRemoteUpdateResponse(response: Response, responseBody: ResponseBody, responseHeaderData: ResponseHeaderData): UpdateResponse {
    var manifestPartBodyAndHeaders: Pair<String, Headers>? = null
    var extensionsBody: String? = null
    var certificateChainString: String? = null
    var directivePartBodyAndHeaders: Pair<String, Headers>? = null

    val isEmpty = response.peekBody(1).bytes().isEmpty()
    if (!isEmpty) {
      try {
        MultipartReader(responseBody).use { reader ->
          while (true) {
            val nextPart = reader.nextPart() ?: break
            nextPart.use { part ->
              val headers = part.headers
              val body = part.body
              val contentDispositionValue = headers["content-disposition"]
              if (contentDispositionValue != null) {
                val contentDispositionName =
                  contentDispositionValue.parseContentDispositionNameParameter()
                if (contentDispositionName != null) {
                  when (contentDispositionName) {
                    "manifest" -> manifestPartBodyAndHeaders = Pair(body.readUtf8(), headers)
                    "extensions" -> extensionsBody = body.readUtf8()
                    "certificate_chain" -> certificateChainString = body.readUtf8()
                    "directive" -> directivePartBodyAndHeaders = Pair(body.readUtf8(), headers)
                  }
                }
              }
            }
          }
        }
      } catch (e: Exception) {
        // okhttp multipart reader doesn't support empty multipart bodies, but our spec does
        val message = "Error while reading multipart remote update response"
        logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
        throw IOException(message, e)
      }
    }

    val extensions = try {
      extensionsBody?.let { JSONObject(it) }
    } catch (e: Exception) {
      val message = "Failed to parse multipart remote update extensions part"
      logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
      throw IOException(message, e)
    }

    // in v0 compatibility mode require a manifest
    if (configuration.enableExpoUpdatesProtocolV0CompatibilityMode && manifestPartBodyAndHeaders == null) {
      val message = "Invalid update response"
      val cause = IOException("Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the response being for a different protocol version.")
      logger.error(message, cause, UpdatesErrorCode.UpdateFailedToLoad)
      throw IOException(message, cause)
    }

    val manifestResponseInfo = manifestPartBodyAndHeaders?.let {
      ResponsePartInfo(
        responseHeaderData = responseHeaderData,
        responsePartHeaderData = ResponsePartHeaderData(
          signature = it.second["expo-signature"]
        ),
        body = it.first
      )
    }

    // in v0 compatibility mode ignore directives
    val directiveResponseInfo = if (configuration.enableExpoUpdatesProtocolV0CompatibilityMode) {
      null
    } else {
      directivePartBodyAndHeaders?.let {
        ResponsePartInfo(
          responseHeaderData = responseHeaderData,
          responsePartHeaderData = ResponsePartHeaderData(
            signature = it.second["expo-signature"]
          ),
          body = it.first
        )
      }
    }

    val parseManifestResponse = manifestResponseInfo?.let {
      parseManifest(it, extensions, certificateChainString)
    }
    val parseDirectiveResponse = directiveResponseInfo?.let {
      parseDirective(it, certificateChainString)
    }

    return UpdateResponse(
      responseHeaderData = responseHeaderData,
      manifestUpdateResponsePart = parseManifestResponse,
      directiveUpdateResponsePart = parseDirectiveResponse
    )
  }

  private fun parseDirective(
    directiveResponsePartInfo: ResponsePartInfo,
    certificateChainFromManifestResponse: String?
  ): UpdateResponsePart.DirectiveUpdateResponsePart {
    val body = directiveResponsePartInfo.body

    // check code signing if code signing is configured
    // 1. verify the code signing signature (throw if invalid)
    // 2. then, if the code signing certificate is only valid for a particular project, verify that the directive
    //    has the correct info for code signing. If the code signing certificate doesn't specify a particular
    //    project, it is assumed to be valid for all projects
    // 3. consider the directive verified if both of these pass
    try {
      configuration.codeSigningConfiguration?.let { codeSigningConfiguration ->
        val signatureValidationResult = codeSigningConfiguration.validateSignature(
          directiveResponsePartInfo.responsePartHeaderData.signature,
          body.toByteArray(),
          certificateChainFromManifestResponse
        )
        if (signatureValidationResult.validationResult == ValidationResult.INVALID) {
          throw IOException("Incorrect signature")
        }

        if (signatureValidationResult.validationResult != ValidationResult.SKIPPED) {
          val directiveForProjectInformation = UpdateDirective.fromJSONString(body)
          signatureValidationResult.expoProjectInformation?.let { expoProjectInformation ->
            if (expoProjectInformation.projectId != directiveForProjectInformation.signingInfo?.easProjectId ||
              expoProjectInformation.scopeKey != directiveForProjectInformation.signingInfo.scopeKey
            ) {
              throw CertificateException("Code signing certificate project ID or scope key does not match project ID or scope key in response part")
            }
          }
        }
      }
    } catch (e: Exception) {
      val message = "Code signing verification failed for directive"
      logger.error(message, e, UpdatesErrorCode.UpdateCodeSigningError)
      throw IOException(message, e)
    }

    return UpdateResponsePart.DirectiveUpdateResponsePart(UpdateDirective.fromJSONString(body))
  }

  private fun parseManifest(
    manifestResponseInfo: ResponsePartInfo,
    extensions: JSONObject?,
    certificateChainFromManifestResponse: String?
  ): UpdateResponsePart.ManifestUpdateResponsePart {
    return checkCodeSigningAndCreateManifest(
      bodyString = manifestResponseInfo.body,
      preManifest = JSONObject(manifestResponseInfo.body),
      responseHeaderData = manifestResponseInfo.responseHeaderData,
      responsePartHeaderData = manifestResponseInfo.responsePartHeaderData,
      extensions = extensions,
      certificateChainFromManifestResponse = certificateChainFromManifestResponse,
      configuration = configuration,
      logger = logger
    )
  }

  suspend fun downloadRemoteUpdate(
    extraHeaders: JSONObject?
  ): UpdateResponse {
    try {
      val response = downloadData(
        createRequestForRemoteUpdate(extraHeaders, configuration, logger)
      )

      if (!response.isSuccessful) {
        val message = "Remote update request not successful"
        val underlyingError = IOException(response.body?.string() ?: "Unknown error")
        logger.error(message, underlyingError, UpdatesErrorCode.UpdateFailedToLoad)
        throw IOException(message, underlyingError)
      }

      return parseRemoteUpdateResponse(response)
    } catch (e: Exception) {
      val message = "Failed to download remote update"
      logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
      throw IOException(message, e)
    }
  }

  suspend fun downloadAsset(
    asset: AssetEntity,
    destinationDirectory: File?,
    extraHeaders: JSONObject,
    assetLoadProgressListener: ((Double) -> Unit)? = null
  ): AssetDownloadResult {
    if (asset.url == null) {
      val message = "Failed to download asset ${asset.key}"
      val error = Exception("Asset missing URL")
      logger.error(message, error, UpdatesErrorCode.AssetsFailedToLoad)
      throw IOException(message, error)
    }

    val filename = UpdatesUtils.createFilenameForAsset(asset)
    val path = File(destinationDirectory, filename)

    if (path.exists()) {
      asset.relativePath = filename
      return AssetDownloadResult(asset, false)
    } else {
      try {
        val downloadResult = downloadAssetAndVerifyHashAndWriteToPath(
          createRequestForAsset(asset, extraHeaders, configuration),
          asset.expectedHash,
          path,
          assetLoadProgressListener?.let { listener -> { listener.invoke(it) } }
        )

        asset.downloadTime = Date()
        asset.relativePath = filename
        asset.hash = downloadResult.hash
        return AssetDownloadResult(asset, true)
      } catch (e: Exception) {
        val message = "Failed to download asset ${asset.key}"
        logger.error(message, e, UpdatesErrorCode.AssetsFailedToLoad)
        throw IOException(message, e)
      }
    }
  }

  private suspend fun downloadData(request: Request, progressListener: FileDownloadProgressListener? = null): Response = suspendCancellableCoroutine { continuation ->
    val call = client.newCall(request)

    continuation.invokeOnCancellation {
      call.cancel()
    }

    try {
      val response = call.execute()
      val wrappedResponse = progressListener?.let { listener ->
        response.body?.let { responseBody ->
          val wrappedBody = FileDownloadProgressResponseBody(responseBody, listener)
          response.newBuilder().body(wrappedBody).build()
        }
      }
      continuation.resume(wrappedResponse ?: response)
    } catch (e: Exception) {
      continuation.resumeWithException(e)
    }
  }

  private fun getCache(): Cache {
    val cacheSize = 50 * 1024 * 1024 // 50 MiB
    return Cache(getCacheDirectory(), cacheSize.toLong())
  }

  private fun getCacheDirectory(): File {
    return File(filesDirectory, "okhttp")
  }

  @VisibleForTesting
  fun createRequestForAsset(
    assetEntity: AssetEntity,
    extraHeaders: JSONObject,
    configuration: UpdatesConfiguration
  ): Request {
    return Request.Builder()
      .url(assetEntity.url!!.toString())
      .addHeadersFromJSONObject(assetEntity.extraRequestHeaders)
      .addHeadersFromJSONObject(extraHeaders)
      .header("Expo-Platform", "android")
      .header("Expo-Protocol-Version", "1")
      .header("Expo-API-Version", "1")
      .header("Expo-Updates-Environment", "BARE")
      .header("EAS-Client-ID", easClientID)
      .apply {
        for ((key, value) in configuration.requestHeaders) {
          header(key, value)
        }
      }
      .build()
  }

  private fun checkCodeSigningAndCreateManifest(
    bodyString: String,
    preManifest: JSONObject,
    responseHeaderData: ResponseHeaderData,
    responsePartHeaderData: ResponsePartHeaderData,
    extensions: JSONObject?,
    certificateChainFromManifestResponse: String?,
    configuration: UpdatesConfiguration,
    logger: UpdatesLogger
  ): UpdateResponsePart.ManifestUpdateResponsePart {
    // Set the isVerified field in the manifest itself so that it is stored in the database.
    // Note that this is not considered for code signature verification.
    // currently this is only used by Expo Go, but moving it out of the library would require
    // also storing the signature so database-loaded-update validity could be derived at load
    // time.
    preManifest.put("isVerified", false)

    // check code signing if code signing is configured
    // 1. verify the code signing signature (throw if invalid)
    // 2. then, if the code signing certificate is only valid for a particular project, verify that the manifest
    //    has the correct info for code signing. If the code signing certificate doesn't specify a particular
    //    project, it is assumed to be valid for all projects
    // 3. mark the manifest as verified if both of these pass
    try {
      configuration.codeSigningConfiguration?.let { codeSigningConfiguration ->
        val signatureValidationResult = codeSigningConfiguration.validateSignature(
          responsePartHeaderData.signature,
          bodyString.toByteArray(),
          certificateChainFromManifestResponse
        )
        if (signatureValidationResult.validationResult == ValidationResult.INVALID) {
          throw IOException("Incorrect signature")
        }

        if (signatureValidationResult.validationResult != ValidationResult.SKIPPED) {
          val manifestForProjectInformation = UpdateFactory.getUpdate(
            preManifest,
            responseHeaderData,
            extensions,
            configuration
          ).manifest
          signatureValidationResult.expoProjectInformation?.let { expoProjectInformation ->
            if (expoProjectInformation.projectId != manifestForProjectInformation.getEASProjectID() ||
              expoProjectInformation.scopeKey != manifestForProjectInformation.getScopeKey()
            ) {
              throw CertificateException("Code signing certificate project ID or scope key does not match project ID or scope key in response")
            }
          }

          logger.info("Manifest code signing signature verified successfully")
          preManifest.put("isVerified", true)
        }
      }
    } catch (e: Exception) {
      val message = "Code signing verification failed for manifest"
      logger.error(message, e, UpdatesErrorCode.UpdateCodeSigningError)
      throw IOException(message, e)
    }

    val update = UpdateFactory.getUpdate(preManifest, responseHeaderData, extensions, configuration)
    if (!SelectionPolicies.matchesFilters(update.updateEntity!!, responseHeaderData.manifestFilters)) {
      throw Exception("Manifest filters do not match manifest content for downloaded manifest")
    } else {
      return UpdateResponsePart.ManifestUpdateResponsePart(update)
    }
  }

  private fun Request.Builder.addHeadersFromJSONObject(headers: JSONObject?): Request.Builder {
    if (headers == null) {
      return this
    }

    headers.keys().asSequence().forEach { key ->
      header(key, headers.require<Any>(key).toString())
    }
    return this
  }

  @VisibleForTesting
  fun createRequestForRemoteUpdate(
    extraHeaders: JSONObject?,
    configuration: UpdatesConfiguration,
    logger: UpdatesLogger
  ): Request {
    return Request.Builder()
      .url(configuration.updateUrl.toString())
      .addHeadersFromJSONObject(extraHeaders)
      .header("Accept", "multipart/mixed,application/expo+json,application/json")
      .header("Expo-Platform", "android")
      .header("Expo-Protocol-Version", "1")
      .header("Expo-API-Version", "1")
      .header("Expo-Updates-Environment", "BARE")
      .header("Expo-JSON-Error", "true")
      .header("EAS-Client-ID", easClientID)
      .apply {
        val runtimeVersion = configuration.runtimeVersionRaw
        if (!runtimeVersion.isNullOrEmpty()) {
          header("Expo-Runtime-Version", runtimeVersion)
        }
      }
      .apply {
        val previousFatalError = NoDatabaseLauncher.consumeErrorLog(filesDirectory, logger)
        if (previousFatalError != null) {
          // some servers can have max length restrictions for headers,
          // so we restrict the length of the string to 1024 characters --
          // this should satisfy the requirements of most servers
          header(
            "Expo-Fatal-Error",
            previousFatalError.substring(0, min(1024, previousFatalError.length))
          )
        }
      }
      .apply {
        for ((key, value) in configuration.requestHeaders) {
          header(key, value)
        }
      }
      .apply {
        configuration.codeSigningConfiguration?.let {
          header("expo-expect-signature", it.getAcceptSignatureHeader())
        }
      }
      .build()
  }

  companion object {
    fun getExtraHeadersForRemoteUpdateRequest(
      database: UpdatesDatabase,
      configuration: UpdatesConfiguration,
      launchedUpdate: UpdateEntity?,
      embeddedUpdate: UpdateEntity?
    ): JSONObject {
      val extraHeaders =
        ManifestMetadata.getServerDefinedHeaders(database, configuration) ?: JSONObject()

      ManifestMetadata.getExtraParams(database, configuration)?.let {
        extraHeaders.put("Expo-Extra-Params", Dictionary.valueOf(it.mapValues { elem -> StringItem.valueOf(elem.value) }).serialize())
      }

      launchedUpdate?.let {
        extraHeaders.put("Expo-Current-Update-ID", it.id.toString().lowercase())
      }
      embeddedUpdate?.let {
        extraHeaders.put("Expo-Embedded-Update-ID", it.id.toString().lowercase())
      }

      database.updateDao().loadRecentUpdateIdsWithFailedLaunch().let {
        if (it.isNotEmpty()) {
          extraHeaders.put(
            "Expo-Recent-Failed-Update-IDs",
            OuterList.valueOf(it.map { elem -> StringItem.valueOf(elem.toString()) }).serialize()
          )
        }
      }

      return extraHeaders
    }

    fun getExtraHeadersForRemoteAssetRequest(
      launchedUpdate: UpdateEntity?,
      embeddedUpdate: UpdateEntity?,
      requestedUpdate: UpdateEntity?
    ): JSONObject {
      val extraHeaders = JSONObject()

      launchedUpdate?.let {
        extraHeaders.put("Expo-Current-Update-ID", it.id.toString().lowercase())
      }
      embeddedUpdate?.let {
        extraHeaders.put("Expo-Embedded-Update-ID", it.id.toString().lowercase())
      }
      requestedUpdate?.let {
        extraHeaders.put("Expo-Requested-Update-ID", it.id.toString().lowercase())
      }

      return extraHeaders
    }
  }
}

private fun interface FileDownloadProgressListener {
  fun update(bytesRead: Long, contentLength: Long) {
    // Only emit progress if content length is known
    if (contentLength > 0) {
      onProgressUpdate(bytesRead.toDouble() / contentLength.toDouble())
    }
  }

  fun onProgressUpdate(progress: Double)
}

private class FileDownloadProgressResponseBody(
  private val responseBody: ResponseBody,
  private val progressListener: FileDownloadProgressListener
) : ResponseBody() {
  override fun contentType(): MediaType? = responseBody.contentType()

  override fun contentLength(): Long = responseBody.contentLength()

  private val bufferedSource by lazy {
    source(responseBody.source()).buffer()
  }

  override fun source(): BufferedSource = bufferedSource

  private fun source(source: Source): Source {
    return object : ForwardingSource(source) {
      var totalBytesRead: Long = 0

      override fun read(sink: Buffer, byteCount: Long): Long {
        val bytesRead = super.read(sink, byteCount)
        totalBytesRead += if (bytesRead != -1L) bytesRead else 0
        progressListener.update(totalBytesRead, responseBody.contentLength())
        return bytesRead
      }
    }
  }
}
