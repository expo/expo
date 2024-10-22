package expo.modules.updates.loader

import android.content.Context
import expo.modules.jsonutils.require
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.structuredheaders.Dictionary
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.selectionpolicy.SelectionPolicies
import okhttp3.*
import okhttp3.brotli.BrotliInterceptor
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.util.*
import kotlin.math.min
import kotlin.math.max
import expo.modules.easclient.EASClientID
import expo.modules.structuredheaders.OuterList
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.UpdatesUtils.parseContentDispositionNameParameter
import expo.modules.updates.codesigning.ValidationResult
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.*
import java.security.cert.CertificateException
import java.util.concurrent.TimeUnit

/**
 * Utility class that holds all the logic for downloading data and files, such as update manifests
 * and assets, using an instance of [OkHttpClient].
 */
class FileDownloader(
  private val context: Context,
  private val configuration: UpdatesConfiguration,
  private val logger: UpdatesLogger
) {
  // If the configured launch wait milliseconds is greater than the okhttp default (10_000)
  // we should use that as the timeout. For example, let's say launchWaitMs is 20 seconds,
  // the HTTP timeout should be at least 20 seconds.
  private var client: OkHttpClient = OkHttpClient.Builder()
    .cache(getCache(context))
    .connectTimeout(max(configuration.launchWaitMs.toLong(), 10_000L), TimeUnit.MILLISECONDS)
    .readTimeout(max(configuration.launchWaitMs.toLong(), 10_000L), TimeUnit.MILLISECONDS)
    .addInterceptor(BrotliInterceptor)
    .build()

  /**
   * Constructor for tests
   */
  constructor(context: Context, configuration: UpdatesConfiguration, logger: UpdatesLogger, client: OkHttpClient) : this(context, configuration, logger) {
    this.client = client
  }

  interface FileDownloadCallback {
    fun onFailure(e: Exception)
    fun onSuccess(file: File, hash: ByteArray)
  }

  interface RemoteUpdateDownloadCallback {
    fun onFailure(e: Exception)
    fun onSuccess(updateResponse: UpdateResponse)
  }

  interface AssetDownloadCallback {
    fun onFailure(e: Exception, assetEntity: AssetEntity)
    fun onSuccess(assetEntity: AssetEntity, isNew: Boolean)
  }

  private fun downloadAssetAndVerifyHashAndWriteToPath(
    request: Request,
    expectedBase64URLEncodedSHA256Hash: String?,
    destination: File,
    callback: FileDownloadCallback
  ) {
    downloadData(
      request,
      object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          val message = "Failed to download asset from URL ${request.url}"
          logger.error(message, e, UpdatesErrorCode.AssetsFailedToLoad)
          callback.onFailure(IOException(message, e))
        }

        @Throws(IOException::class)
        override fun onResponse(call: Call, response: Response) {
          if (!response.isSuccessful) {
            val message = "Asset download request not successful"
            val cause = IOException(response.body!!.string())
            logger.error(message, cause, UpdatesErrorCode.AssetsFailedToLoad)
            callback.onFailure(IOException(message, cause))
            return
          }
          try {
            response.body!!.byteStream().use { inputStream ->
              val hash = UpdatesUtils.verifySHA256AndWriteToFile(inputStream, destination, expectedBase64URLEncodedSHA256Hash)
              callback.onSuccess(destination, hash)
            }
          } catch (e: Exception) {
            val message = "Failed to write asset file from ${request.url} to destination $destination"
            logger.error(message, e, UpdatesErrorCode.AssetsFailedToLoad)
            callback.onFailure(IOException(message, e))
          }
        }
      }
    )
  }

  internal fun parseRemoteUpdateResponse(response: Response, callback: RemoteUpdateDownloadCallback) {
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
        callback.onSuccess(
          UpdateResponse(
            responseHeaderData = responseHeaderData,
            manifestUpdateResponsePart = null,
            directiveUpdateResponsePart = null
          )
        )
        return
      }

      val message = "Invalid update response"
      val cause = IOException("Empty body")
      logger.error(message, cause, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(IOException(message, cause))
      return
    }

    val isMultipart = responseBody.contentType()?.type == "multipart"
    if (isMultipart) {
      parseMultipartRemoteUpdateResponse(responseBody, responseHeaderData, callback)
    } else {
      val manifestResponseInfo = ResponsePartInfo(
        responseHeaderData = responseHeaderData,
        responsePartHeaderData = ResponsePartHeaderData(
          signature = responseHeaders["expo-signature"]
        ),
        body = response.body!!.string()
      )

      parseManifest(
        manifestResponseInfo,
        null,
        null,
        object : ParseManifestCallback {
          override fun onFailure(e: Exception) {
            callback.onFailure(e)
          }

          override fun onSuccess(manifestUpdateResponsePart: UpdateResponsePart.ManifestUpdateResponsePart) {
            callback.onSuccess(
              UpdateResponse(
                responseHeaderData = responseHeaderData,
                manifestUpdateResponsePart = manifestUpdateResponsePart,
                directiveUpdateResponsePart = null
              )
            )
          }
        }
      )
    }
  }

  private fun parseMultipartRemoteUpdateResponse(responseBody: ResponseBody, responseHeaderData: ResponseHeaderData, callback: RemoteUpdateDownloadCallback) {
    var manifestPartBodyAndHeaders: Pair<String, Headers>? = null
    var extensionsBody: String? = null
    var certificateChainString: String? = null
    var directivePartBodyAndHeaders: Pair<String, Headers>? = null

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
      if (responseBody.bytes().isNotEmpty()) {
        val message = "Error while reading multipart remote update response"
        logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
        callback.onFailure(IOException(message, e))
        return
      }
    }

    val extensions = try {
      extensionsBody?.let { JSONObject(it) }
    } catch (e: Exception) {
      val message = "Failed to parse multipart remote update extensions part"
      logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(IOException(message, e))
      return
    }

    // in v0 compatibility mode require a manifest
    if (configuration.enableExpoUpdatesProtocolV0CompatibilityMode && manifestPartBodyAndHeaders == null) {
      val message = "Invalid update response"
      val cause = IOException("Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the response being for a different protocol version.")
      logger.error(message, cause, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(IOException(message, cause))
      return
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

    var parseManifestResponse: UpdateResponsePart.ManifestUpdateResponsePart? = null
    var parseDirectiveResponse: UpdateResponsePart.DirectiveUpdateResponsePart? = null
    var didError = false

    // need to parse the directive and manifest in parallel, to do so use this common callback.
    // would be a great place to have better coroutine stuff
    val maybeFinish = {
      if (!didError) {
        val isManifestDone = manifestResponseInfo == null || parseManifestResponse != null
        val isDirectiveDone = directiveResponseInfo == null || parseDirectiveResponse != null

        if (isManifestDone && isDirectiveDone) {
          callback.onSuccess(
            UpdateResponse(
              responseHeaderData = responseHeaderData,
              manifestUpdateResponsePart = parseManifestResponse,
              directiveUpdateResponsePart = parseDirectiveResponse
            )
          )
        }
      }
    }

    if (directiveResponseInfo != null) {
      parseDirective(
        directiveResponseInfo,
        certificateChainString,
        object : ParseDirectiveCallback {
          override fun onFailure(e: Exception) {
            if (!didError) {
              didError = true
              callback.onFailure(e)
            }
          }

          override fun onSuccess(directiveUpdateResponsePart: UpdateResponsePart.DirectiveUpdateResponsePart) {
            parseDirectiveResponse = directiveUpdateResponsePart
            maybeFinish()
          }
        }
      )
    }

    if (manifestResponseInfo != null) {
      parseManifest(
        manifestResponseInfo,
        extensions,
        certificateChainString,
        object : ParseManifestCallback {
          override fun onFailure(e: Exception) {
            if (!didError) {
              didError = true
              callback.onFailure(e)
            }
          }
          override fun onSuccess(manifestUpdateResponsePart: UpdateResponsePart.ManifestUpdateResponsePart) {
            parseManifestResponse = manifestUpdateResponsePart
            maybeFinish()
          }
        }
      )
    }

    // if both parts are empty, we still want to finish
    if (manifestResponseInfo == null && directiveResponseInfo == null) {
      maybeFinish()
    }
  }

  interface ParseDirectiveCallback {
    fun onFailure(e: Exception)
    fun onSuccess(directiveUpdateResponsePart: UpdateResponsePart.DirectiveUpdateResponsePart)
  }

  private fun parseDirective(
    directiveResponsePartInfo: ResponsePartInfo,
    certificateChainFromManifestResponse: String?,
    callback: ParseDirectiveCallback
  ) {
    try {
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
        callback.onFailure(IOException(message, e))
        return
      }

      callback.onSuccess(UpdateResponsePart.DirectiveUpdateResponsePart(UpdateDirective.fromJSONString(body)))
    } catch (e: Exception) {
      val message = "Failed to construct directive from response"
      logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(IOException(message, e))
    }
  }

  interface ParseManifestCallback {
    fun onFailure(e: Exception)
    fun onSuccess(manifestUpdateResponsePart: UpdateResponsePart.ManifestUpdateResponsePart)
  }

  private fun parseManifest(
    manifestResponseInfo: ResponsePartInfo,
    extensions: JSONObject?,
    certificateChainFromManifestResponse: String?,
    callback: ParseManifestCallback
  ) {
    try {
      checkCodeSigningAndCreateManifest(
        bodyString = manifestResponseInfo.body,
        preManifest = JSONObject(manifestResponseInfo.body),
        responseHeaderData = manifestResponseInfo.responseHeaderData,
        responsePartHeaderData = manifestResponseInfo.responsePartHeaderData,
        extensions = extensions,
        certificateChainFromManifestResponse = certificateChainFromManifestResponse,
        configuration = configuration,
        logger = logger,
        callback = callback
      )
    } catch (e: Exception) {
      val message = "Failed to construct manifest from response"
      logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(IOException(message, e))
    }
  }

  fun downloadRemoteUpdate(
    extraHeaders: JSONObject?,
    callback: RemoteUpdateDownloadCallback
  ) {
    try {
      downloadData(
        createRequestForRemoteUpdate(extraHeaders, configuration, logger, context),
        object : Callback {
          override fun onFailure(call: Call, e: IOException) {
            val message = "Failed to download remote update"
            logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
            callback.onFailure(IOException(message, e))
          }

          @Throws(IOException::class)
          override fun onResponse(call: Call, response: Response) {
            if (!response.isSuccessful) {
              val message = "Remote update request not successful"
              val underlyingError = IOException(response.body!!.string())
              logger.error(message, underlyingError, UpdatesErrorCode.UpdateFailedToLoad)
              callback.onFailure(IOException(message, underlyingError))
              return
            }

            parseRemoteUpdateResponse(response, callback)
          }
        }
      )
    } catch (e: Exception) {
      val message = "Failed to download remote update"
      logger.error(message, e, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(IOException(message, e))
    }
  }

  fun downloadAsset(
    asset: AssetEntity,
    destinationDirectory: File?,
    callback: AssetDownloadCallback
  ) {
    if (asset.url == null) {
      val message = "Failed to download asset ${asset.key}"
      val error = Exception("Asset missing URL")
      logger.error(message, error, UpdatesErrorCode.AssetsFailedToLoad)
      callback.onFailure(IOException(message, error), asset)
      return
    }
    val filename = UpdatesUtils.createFilenameForAsset(asset)
    val path = File(destinationDirectory, filename)
    if (path.exists()) {
      asset.relativePath = filename
      callback.onSuccess(asset, false)
    } else {
      try {
        downloadAssetAndVerifyHashAndWriteToPath(
          createRequestForAsset(asset, configuration, context),
          asset.expectedHash,
          path,
          object : FileDownloadCallback {
            override fun onFailure(e: Exception) {
              callback.onFailure(e, asset)
            }

            override fun onSuccess(file: File, hash: ByteArray) {
              asset.downloadTime = Date()
              asset.relativePath = filename
              asset.hash = hash
              callback.onSuccess(asset, true)
            }
          }
        )
      } catch (e: Exception) {
        val message = "Failed to download asset ${asset.key}"
        logger.error(message, e, UpdatesErrorCode.AssetsFailedToLoad)
        callback.onFailure(IOException(message, e), asset)
      }
    }
  }

  private fun downloadData(request: Request, callback: Callback) {
    downloadData(request, callback, false)
  }

  private fun downloadData(request: Request, callback: Callback, isRetry: Boolean) {
    client.newCall(request).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        if (isRetry) {
          callback.onFailure(call, e)
        } else {
          downloadData(request, callback, true)
        }
      }

      @Throws(IOException::class)
      override fun onResponse(call: Call, response: Response) {
        callback.onResponse(call, response)
      }
    })
  }

  companion object {
    private fun checkCodeSigningAndCreateManifest(
      bodyString: String,
      preManifest: JSONObject,
      responseHeaderData: ResponseHeaderData,
      responsePartHeaderData: ResponsePartHeaderData,
      extensions: JSONObject?,
      certificateChainFromManifestResponse: String?,
      configuration: UpdatesConfiguration,
      logger: UpdatesLogger,
      callback: ParseManifestCallback
    ) {
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
        callback.onFailure(IOException(message, e))
        return
      }

      val update = UpdateFactory.getUpdate(preManifest, responseHeaderData, extensions, configuration)
      if (!SelectionPolicies.matchesFilters(update.updateEntity!!, responseHeaderData.manifestFilters)) {
        callback.onFailure(Exception("Manifest filters do not match manifest content for downloaded manifest"))
      } else {
        callback.onSuccess(UpdateResponsePart.ManifestUpdateResponsePart(update))
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

    internal fun createRequestForAsset(
      assetEntity: AssetEntity,
      configuration: UpdatesConfiguration,
      context: Context
    ): Request {
      return Request.Builder()
        .url(assetEntity.url!!.toString())
        .addHeadersFromJSONObject(assetEntity.extraRequestHeaders)
        .header("Expo-Platform", "android")
        .header("Expo-Protocol-Version", "1")
        .header("Expo-API-Version", "1")
        .header("Expo-Updates-Environment", "BARE")
        .header("EAS-Client-ID", EASClientID(context).uuid.toString())
        .apply {
          for ((key, value) in configuration.requestHeaders) {
            header(key, value)
          }
        }
        .build()
    }

    internal fun createRequestForRemoteUpdate(
      extraHeaders: JSONObject?,
      configuration: UpdatesConfiguration,
      logger: UpdatesLogger,
      context: Context
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
        .header("EAS-Client-ID", EASClientID(context).uuid.toString())
        .apply {
          val runtimeVersion = configuration.runtimeVersionRaw
          if (!runtimeVersion.isNullOrEmpty()) {
            header("Expo-Runtime-Version", runtimeVersion)
          }
        }
        .apply {
          val previousFatalError = NoDatabaseLauncher.consumeErrorLog(context, logger)
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

    private fun getCache(context: Context): Cache {
      val cacheSize = 50 * 1024 * 1024 // 50 MiB
      return Cache(getCacheDirectory(context), cacheSize.toLong())
    }

    private fun getCacheDirectory(context: Context): File {
      return File(context.cacheDir, "okhttp")
    }

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
  }
}
