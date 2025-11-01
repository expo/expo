package expo.modules.updates.loader

import androidx.annotation.VisibleForTesting
import expo.modules.jsonutils.require
import expo.modules.structuredheaders.Dictionary
import expo.modules.structuredheaders.OuterList
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.BSPatch
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
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Cache
import okhttp3.Headers
import okhttp3.MediaType
import okhttp3.MultipartReader
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.brotli.BrotliInterceptor
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.Source
import okio.buffer
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.security.cert.CertificateException
import java.util.Date
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.max
import kotlin.math.min

private const val PATCH_CONTENT_TYPE = "application/vnd.bsdiff"
private const val PATCH_TEMP_SUFFIX = ".patch"
private const val PATCHED_TEMP_SUFFIX = ".patched"
private const val A_IM_HEADER = "A-IM"
private const val IM_HEADER = "im"
private const val DELTA_BASE_HEADER = "delta-base"
private const val ETAG_HEADER = "etag"
private const val IF_NONE_MATCH_HEADER = "If-None-Match"
private const val IF_MATCH_HEADER = "If-Match"
private const val EXPO_CURRENT_UPDATE_ID_HEADER = "Expo-Current-Update-ID"
private const val EXPO_REQUESTED_UPDATE_ID_HEADER = "Expo-Requested-Update-ID"
private const val EXPO_EMBEDDED_UPDATE_ID_HEADER = "Expo-Embedded-Update-ID"

/**
 * Utility class that holds all the logic for downloading data and files, such as update manifests
 * and assets, using an instance of [OkHttpClient].
 */
class FileDownloader(
  private val filesDirectory: File,
  private val easClientID: String,
  private val configuration: UpdatesConfiguration,
  private val logger: UpdatesLogger,
  private val database: UpdatesDatabase
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
  constructor(
    filesDirectory: File,
    easClientID: String,
    configuration: UpdatesConfiguration,
    logger: UpdatesLogger,
    database: UpdatesDatabase,
    client: OkHttpClient
  ) : this(filesDirectory, easClientID, configuration, logger, database) {
    this.client = client
  }

  data class FileDownloadResult(val file: File, val hash: ByteArray)
  data class AssetDownloadResult(val assetEntity: AssetEntity, val isNew: Boolean)

  @VisibleForTesting
  internal suspend fun downloadAssetAndVerifyHashAndWriteToPath(
    asset: AssetEntity,
    extraHeaders: JSONObject,
    request: Request,
    expectedBase64URLEncodedSHA256Hash: String?,
    destination: File,
    updatesDirectory: File,
    progressListener: FileDownloadProgressListener? = null,
    allowPatch: Boolean,
    launchedUpdate: UpdateEntity? = null,
    requestedUpdate: UpdateEntity? = null
  ): FileDownloadResult {
    try {
      val response = downloadData(request, progressListener)
      val hash = response.use { resp ->
        if (!resp.isSuccessful) {
          val message = "Asset download request not successful"
          val cause = IOException(resp.body?.string() ?: "Unknown error")
          logger.error(message, cause, UpdatesErrorCode.AssetsFailedToLoad)
          throw IOException(message, cause)
        }

        val responseBody = resp.body
          ?: throw IOException("Asset download response from ${request.url} had no body")
        responseBody.use { body ->
          val patchMetadata = parsePatchResponseMetadata(resp)
          if (patchMetadata == null) {
            body.byteStream().use { inputStream ->
              UpdatesUtils.verifySHA256AndWriteToFile(
                inputStream,
                destination,
                expectedBase64URLEncodedSHA256Hash
              )
            }
          } else {
            val requestedUpdateId = requestedUpdate?.id?.toString()
            val idsAreDifferent = launchedUpdate != null && requestedUpdate != null && launchedUpdate.id != requestedUpdate.id
            val shouldAttemptPatch = allowPatch && asset.isLaunchAsset && idsAreDifferent

            if (!shouldAttemptPatch) {
              logger.warn(
                "Received patch response even though patch application is disabled; retrying with full asset download",
                UpdatesErrorCode.AssetsFailedToLoad,
                requestedUpdateId,
                asset.key
              )
              return@use fallbackBundleDownload(
                asset = asset,
                extraHeaders = extraHeaders,
                progressListener = progressListener,
                destination = destination,
                expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash
              )
            }

            if (!validatePatchResponseMetadata(patchMetadata, launchedUpdate, requestedUpdate)) {
              logger.warn(
                "Patch response missing required headers or had mismatched identifiers; retrying with full asset download",
                UpdatesErrorCode.AssetsFailedToLoad,
                requestedUpdateId,
                asset.key
              )
              return@use fallbackBundleDownload(
                asset = asset,
                extraHeaders = extraHeaders,
                progressListener = progressListener,
                destination = destination,
                expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash
              )
            }

            return@use runCatching {
              applyPatchAndVerify(
                asset = asset,
                responseBody = body,
                destination = destination,
                updatesDirectory = updatesDirectory,
                launchedUpdate = launchedUpdate,
                requestedUpdate = requestedUpdate,
                expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash
              )
            }.getOrElse {
              logger.warn(
                "Patch application failed for asset ${asset.key}; retrying with full asset download",
                UpdatesErrorCode.AssetsFailedToLoad,
                requestedUpdateId,
                asset.key
              )
              fallbackBundleDownload(
                asset = asset,
                extraHeaders = extraHeaders,
                progressListener = progressListener,
                destination = destination,
                expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash
              )
            }
          }
        }
      }
      return FileDownloadResult(destination, hash)
    } catch (e: IOException) {
      val message = "Failed to download asset from URL ${request.url}"
      logger.error(message, e, UpdatesErrorCode.AssetsFailedToLoad)
      throw IOException(message, e)
    }
  }

  private suspend fun fallbackBundleDownload(
    asset: AssetEntity,
    extraHeaders: JSONObject,
    progressListener: FileDownloadProgressListener?,
    destination: File,
    expectedBase64URLEncodedSHA256Hash: String?
  ): ByteArray {
    val fallbackRequest = createRequestForAsset(
      assetEntity = asset,
      extraHeaders = extraHeaders,
      configuration = configuration,
      allowPatch = false
    )

    val fallbackResponse = downloadData(fallbackRequest, progressListener)
    return fallbackResponse.use { fallbackResp ->
      val fallbackBody = fallbackResp.body
        ?: throw IOException("Fallback asset download response from ${fallbackRequest.url} had no body")

      fallbackBody.use { body ->
        if (!fallbackResp.isSuccessful) {
          throw IOException(body.string())
        }

        body.byteStream().use { inputStream ->
          UpdatesUtils.verifySHA256AndWriteToFile(
            inputStream,
            destination,
            expectedBase64URLEncodedSHA256Hash
          )
        }
      }
    }
  }

  private data class PatchResponseMetadata(
    val imHeaderRaw: String?,
    val hasImBsdiff: Boolean,
    val hasLegacyContentType: Boolean,
    val statusCode: Int,
    val deltaBase: String?,
    val eTag: String?
  )

  private fun parsePatchResponseMetadata(response: Response): PatchResponseMetadata? {
    val responseBody = response.body
    val mediaType = responseBody?.contentType()
    val hasLegacyContentType = mediaType?.let { it.type == "application" && it.subtype == "vnd.bsdiff" } ?: false
    val imHeaderRaw = response.header(IM_HEADER)
    val hasImBsdiff = imHeaderRaw
      ?.split(',')
      ?.map { it.trim() }
      ?.any { it.equals("bsdiff", ignoreCase = true) }
      ?: false
    val statusCode = response.code

    if (!hasLegacyContentType && !hasImBsdiff && statusCode != 226) {
      return null
    }

    return PatchResponseMetadata(
      imHeaderRaw = imHeaderRaw,
      hasImBsdiff = hasImBsdiff,
      hasLegacyContentType = hasLegacyContentType,
      statusCode = statusCode,
      deltaBase = response.header(DELTA_BASE_HEADER),
      eTag = response.header(ETAG_HEADER)
    )
  }

  private fun validatePatchResponseMetadata(
    metadata: PatchResponseMetadata,
    launchedUpdate: UpdateEntity?,
    requestedUpdate: UpdateEntity?
  ): Boolean {
    val expectedBase = launchedUpdate?.id?.toString()?.lowercase()
    val expectedTarget = requestedUpdate?.id?.toString()?.lowercase()
    val deltaBase = metadata.deltaBase?.lowercase()
    val eTag = metadata.eTag?.lowercase()

    if (!metadata.hasImBsdiff || deltaBase == null || eTag == null) {
      return false
    }

    if (expectedBase != null && deltaBase != expectedBase) {
      return false
    }

    if (expectedTarget != null && eTag != expectedTarget) {
      return false
    }

    return true
  }

  @Throws(IOException::class)
  private fun applyPatchAndVerify(
    asset: AssetEntity,
    responseBody: ResponseBody,
    destination: File,
    updatesDirectory: File,
    launchedUpdate: UpdateEntity,
    requestedUpdate: UpdateEntity?,
    expectedBase64URLEncodedSHA256Hash: String?
  ): ByteArray {
    val launchAssetContext = prepareAssetForDiff(
      asset = asset,
      responseBody = responseBody,
      updatesDirectory = updatesDirectory,
      launchedUpdate = launchedUpdate
    )

    return applyHermesDiff(
      baseFile = launchAssetContext.baseFile,
      diffBody = responseBody,
      destination = destination,
      expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash,
      asset = asset,
      requestedUpdateId = requestedUpdate?.id?.toString()
    )
  }

  internal data class LaunchAssetContext(val baseFile: File)

  @VisibleForTesting
  internal fun prepareAssetForDiff(
    asset: AssetEntity,
    responseBody: ResponseBody,
    updatesDirectory: File,
    launchedUpdate: UpdateEntity
  ): LaunchAssetContext {
    return try {
      preparePatchBaseAsset(asset, updatesDirectory, launchedUpdate)
    } catch (e: Exception) {
      responseBody.close()
      if (e is IOException) {
        throw e
      } else {
        throw IOException("Failed to prepare asset for diff", e)
      }
    }
  }

  private fun preparePatchBaseAsset(
    asset: AssetEntity,
    updatesDirectory: File,
    launchedUpdate: UpdateEntity
  ): LaunchAssetContext {
    if (!asset.isLaunchAsset) {
      throw IOException("Received patch for non-launch asset ${asset.key}")
    }

    val currentUpdateId = launchedUpdate.id

    val launchAssetEntity = database.updateDao().loadLaunchAssetForUpdate(currentUpdateId)
      ?: throw IOException("Launch asset not found for current update $currentUpdateId")

    val launchAssetRelativePath = launchAssetEntity.relativePath
      ?: throw IOException("Launch asset for update $currentUpdateId is missing a relative path")

    val baseFile = File(updatesDirectory, launchAssetRelativePath)
    if (!baseFile.exists()) {
      throw IOException("Base asset $baseFile is missing; cannot apply patch")
    }

    val actualBaseHash = try {
      UpdatesUtils.toBase64Url(UpdatesUtils.sha256(baseFile))
    } catch (_: Exception) {
      null
    }

    val expectedBaseHash = launchAssetEntity.expectedHash
    if (expectedBaseHash != null && actualBaseHash != null && expectedBaseHash != actualBaseHash) {
      logger.warn(
        "Asset hash mismatch for update $currentUpdateId; expected=$expectedBaseHash actual=$actualBaseHash",
        UpdatesErrorCode.AssetsFailedToLoad,
        currentUpdateId.toString(),
        asset.key
      )
      throw IOException("Asset hash mismatch for update $currentUpdateId; expected=$expectedBaseHash actual=$actualBaseHash")
    }

    return LaunchAssetContext(baseFile)
  }

  @VisibleForTesting
  internal var applyPatch: (String, String, String) -> Int = { baseFilePath, newFilePath, patchFilePath ->
    BSPatch.applyPatch(baseFilePath, newFilePath, patchFilePath)
  }

  @VisibleForTesting
  internal fun applyHermesDiff(
    baseFile: File,
    diffBody: ResponseBody,
    destination: File,
    expectedBase64URLEncodedSHA256Hash: String?,
    asset: AssetEntity,
    requestedUpdateId: String?
  ): ByteArray {
    val patchFile = File(destination.absolutePath + PATCH_TEMP_SUFFIX)
    val patchedTempFile = File(destination.absolutePath + PATCHED_TEMP_SUFFIX)

    try {
      patchFile.parentFile?.mkdirs()
      patchedTempFile.parentFile?.mkdirs()

      diffBody.byteStream().use { input ->
        patchFile.outputStream().use { output -> input.copyTo(output) }
      }

      val patchResult = applyPatch(
        baseFile.absolutePath,
        patchedTempFile.absolutePath,
        patchFile.absolutePath
      )

      if (patchResult != 0) {
        throw IOException("BSPatch exited with code $patchResult while applying patch")
      }

      FileInputStream(patchedTempFile).use { patchedInputStream ->
        val result = UpdatesUtils.verifySHA256AndWriteToFile(
          patchedInputStream,
          destination,
          expectedBase64URLEncodedSHA256Hash
        )
        logger.info(
          "Applied diff for asset ${asset.key}",
          UpdatesErrorCode.None,
          requestedUpdateId,
          asset.key
        )
        return result
      }
    } catch (e: Exception) {
      val ioException = e as? IOException ?: IOException("Failed to apply patch", e)
      logger.error(
        "Failed to apply patch for asset ${asset.key}",
        ioException,
        UpdatesErrorCode.AssetsFailedToLoad
      )
      throw ioException
    } finally {
      if (patchFile.exists()) {
        patchFile.delete()
      }
      if (patchedTempFile.exists()) {
        patchedTempFile.delete()
      }
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
    destinationDirectory: File,
    extraHeaders: JSONObject,
    launchedUpdate: UpdateEntity?,
    requestedUpdate: UpdateEntity?,
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
      val canApplyPatch =
        asset.isLaunchAsset &&
          launchedUpdate != null &&
          requestedUpdate != null &&
          launchedUpdate.id != requestedUpdate.id

      try {
        val downloadResult = downloadAssetAndVerifyHashAndWriteToPath(
          asset,
          extraHeaders,
          createRequestForAsset(
            asset,
            extraHeaders,
            configuration,
            allowPatch = canApplyPatch
          ),
          asset.expectedHash,
          path,
          destinationDirectory,
          assetLoadProgressListener?.let { listener -> { listener.invoke(it) } },
          allowPatch = canApplyPatch,
          launchedUpdate = launchedUpdate,
          requestedUpdate = requestedUpdate
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

  private suspend fun downloadData(request: Request, progressListener: FileDownloadProgressListener? = null): Response =
    suspendCancellableCoroutine { continuation ->
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
    configuration: UpdatesConfiguration,
    allowPatch: Boolean = true
  ): Request = Request.Builder()
    .url(assetEntity.url!!.toString())
    .addHeadersFromJSONObject(assetEntity.extraRequestHeaders)
    .addHeadersFromJSONObject(extraHeaders)
    .header("Expo-Platform", "android")
    .header("Expo-Protocol-Version", "1")
    .header("Expo-API-Version", "1")
    .header("Expo-Updates-Environment", "BARE")
    .header("EAS-Client-ID", easClientID)
    .apply {
      val shouldRequestPatch = allowPatch && assetEntity.isLaunchAsset && configuration.enableBsdiffPatchSupport
      val currentId = extraHeaders.optString(EXPO_CURRENT_UPDATE_ID_HEADER, "")
      val requestedId = extraHeaders.optString(EXPO_REQUESTED_UPDATE_ID_HEADER, "")
      if (shouldRequestPatch) {
        header(A_IM_HEADER, "bsdiff")
        header("Accept", "$PATCH_CONTENT_TYPE,*/*")
        if (currentId.isNotEmpty()) {
          header(IF_NONE_MATCH_HEADER, currentId)
        }
        if (requestedId.isNotEmpty()) {
          header(IF_MATCH_HEADER, requestedId)
        }
      } else {
        removeHeader(A_IM_HEADER)
        header("Accept", "application/javascript")
        if (currentId.isNotEmpty()) {
          removeHeader(IF_NONE_MATCH_HEADER)
        }
        if (requestedId.isNotEmpty()) {
          removeHeader(IF_MATCH_HEADER)
        }
      }
    }
    .apply {
      for ((key, value) in configuration.requestHeaders) {
        header(key, value)
      }
    }
    .build()

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
        extraHeaders.put(EXPO_CURRENT_UPDATE_ID_HEADER, it.id.toString().lowercase())
      }
      embeddedUpdate?.let {
        extraHeaders.put(EXPO_EMBEDDED_UPDATE_ID_HEADER, it.id.toString().lowercase())
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
        extraHeaders.put(EXPO_CURRENT_UPDATE_ID_HEADER, it.id.toString().lowercase())
      }
      embeddedUpdate?.let {
        extraHeaders.put(EXPO_EMBEDDED_UPDATE_ID_HEADER, it.id.toString().lowercase())
      }
      requestedUpdate?.let {
        extraHeaders.put(EXPO_REQUESTED_UPDATE_ID_HEADER, it.id.toString().lowercase())
      }

      return extraHeaders
    }
  }
}

internal fun interface FileDownloadProgressListener {
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
