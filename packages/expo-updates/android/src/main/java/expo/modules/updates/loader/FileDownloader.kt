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
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.util.*
import kotlin.math.min
import org.apache.commons.fileupload.MultipartStream
import org.apache.commons.fileupload.ParameterParser
import java.io.ByteArrayOutputStream
import expo.modules.easclient.EASClientID
import okhttp3.Headers.Companion.toHeaders
import expo.modules.jsonutils.getNullable
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.codesigning.ValidationResult
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.*
import kotlinx.coroutines.suspendCancellableCoroutine
import java.security.cert.CertificateException
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.resume

/**
 * Utility class that holds all the logic for downloading data and files, such as update manifests
 * and assets, using an instance of [OkHttpClient].
 */
open class FileDownloader(context: Context, private val client: OkHttpClient) {
  constructor(context: Context) : this(
    context,
    OkHttpClient.Builder()
      .cache(getCache(context))
      .addInterceptor(BrotliInterceptor)
      .build()
  )
  private val logger = UpdatesLogger(context)

  data class FileDownloadResult(val file: File, val hash: ByteArray)

  data class AssetDownloadResult(val assetEntity: AssetEntity, val isNew: Boolean)

  private suspend fun downloadFileAndVerifyHashAndWriteToPath(
    request: Request,
    expectedBase64URLEncodedSHA256Hash: String?,
    destination: File,
  ): FileDownloadResult {
    val response = downloadData(request)
    if (!response.isSuccessful) {
      throw Exception(
        "Network request failed: " + response.body!!
          .string()
      )
    }

    try {
      return response.body!!.byteStream().use { inputStream ->
        val hash = UpdatesUtils.verifySHA256AndWriteToFile(inputStream, destination, expectedBase64URLEncodedSHA256Hash)
        FileDownloadResult(destination, hash)
      }
    } catch (e: Exception) {
      logger.error("Failed to download file to destination $destination: ${e.localizedMessage}", UpdatesErrorCode.AssetsFailedToLoad, e)
      throw e
    }
  }

  internal suspend fun parseRemoteUpdateResponse(response: Response, configuration: UpdatesConfiguration): UpdateResponse {
    val responseHeaders = response.headers
    val responseHeaderData = ResponseHeaderData(
      protocolVersionRaw = responseHeaders["expo-protocol-version"],
      manifestFiltersRaw = responseHeaders["expo-manifest-filters"],
      serverDefinedHeadersRaw = responseHeaders["expo-server-defined-headers"],
      manifestSignature = responseHeaders["expo-manifest-signature"],
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

      val message = "Missing body in remote update"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
      throw Exception(
        message,
        IOException(message)
      )
    }

    val contentType = response.header("content-type") ?: ""
    val isMultipart = contentType.startsWith("multipart/", ignoreCase = true)
    if (isMultipart) {
      val boundaryParameter = ParameterParser().parse(contentType, ';')["boundary"]
      if (boundaryParameter == null) {
        val message = "Missing boundary in multipart remote update content-type"
        logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
        throw Exception(
          message,
          IOException(message)
        )
      }

      return parseMultipartRemoteUpdateResponse(responseBody, responseHeaderData, boundaryParameter, configuration)
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
        null,
        configuration,
      )
      return UpdateResponse(
        responseHeaderData = responseHeaderData,
        manifestUpdateResponsePart = manifestUpdateResponsePart,
        directiveUpdateResponsePart = null
      )
    }
  }

  private fun parseHeaders(text: String): Headers {
    val headers = mutableMapOf<String, String>()
    val lines = text.split(CRLF)
    for (line in lines) {
      val indexOfSeparator = line.indexOf(":")
      if (indexOfSeparator == -1) {
        continue
      }
      val key = line.substring(0, indexOfSeparator).trim()
      val value = line.substring(indexOfSeparator + 1).trim()
      headers[key] = value
    }
    return headers.toHeaders()
  }

  private suspend fun parseMultipartRemoteUpdateResponse(responseBody: ResponseBody, responseHeaderData: ResponseHeaderData, boundary: String, configuration: UpdatesConfiguration): UpdateResponse {
    var manifestPartBodyAndHeaders: Pair<String, Headers>? = null
    var extensionsBody: String? = null
    var certificateChainString: String? = null
    var directivePartBodyAndHeaders: Pair<String, Headers>? = null

    val multipartStream = MultipartStream(responseBody.byteStream(), boundary.toByteArray())

    try {
      var nextPart = multipartStream.skipPreamble()
      while (nextPart) {
        val headers = parseHeaders(multipartStream.readHeaders())

        // always read the body to progress the reader
        val output = ByteArrayOutputStream()
        multipartStream.readBodyData(output)

        val contentDispositionValue = headers["content-disposition"]
        if (contentDispositionValue != null) {
          val contentDispositionParameterMap = ParameterParser().parse(contentDispositionValue, ';')
          val contentDispositionName = contentDispositionParameterMap["name"]
          if (contentDispositionName != null) {
            when (contentDispositionName) {
              "manifest" -> manifestPartBodyAndHeaders = Pair(output.toString(), headers)
              "extensions" -> extensionsBody = output.toString()
              "certificate_chain" -> certificateChainString = output.toString()
              "directive" -> directivePartBodyAndHeaders = Pair(output.toString(), headers)
            }
          }
        }
        nextPart = multipartStream.readBoundary()
      }
    } catch (e: Exception) {
      val message = "Error while reading multipart remote update response"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
      throw Exception(message, e)
    }

    val extensions = try {
      extensionsBody?.let { JSONObject(it) }
    } catch (e: Exception) {
      val message = "Failed to parse multipart remote update extensions"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
      throw Exception(message, e)
    }

    // in v0 compatibility mode require a manifest
    if (configuration.enableExpoUpdatesProtocolV0CompatibilityMode && manifestPartBodyAndHeaders == null) {
      val message = "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the update being a rollback or other directive."
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
      throw Exception(message, IOException(message))
    }

    val manifestResponseInfo = manifestPartBodyAndHeaders?.let {
      ResponsePartInfo(
        responseHeaderData = responseHeaderData,
        responsePartHeaderData = ResponsePartHeaderData(
          signature = manifestPartBodyAndHeaders.second["expo-signature"]
        ),
        body = manifestPartBodyAndHeaders.first
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
            signature = directivePartBodyAndHeaders.second["expo-signature"]
          ),
          body = directivePartBodyAndHeaders.first
        )
      }
    }

    val directiveUpdateResponsePart = directiveResponseInfo?.let {
      parseDirective(it, certificateChainString, configuration)
    }

    val manifestUpdateResponsePart = manifestResponseInfo?.let {
      parseManifest(it, extensions, certificateChainString, configuration)
    }

    return UpdateResponse(
      responseHeaderData = responseHeaderData,
      manifestUpdateResponsePart = manifestUpdateResponsePart,
      directiveUpdateResponsePart = directiveUpdateResponsePart
    )
  }

  private fun parseDirective(
    directiveResponsePartInfo: ResponsePartInfo,
    certificateChainFromManifestResponse: String?,
    configuration: UpdatesConfiguration,
  ): UpdateResponsePart.DirectiveUpdateResponsePart {
    try {
      val body = directiveResponsePartInfo.body

      // check code signing if code signing is configured
      // 1. verify the code signing signature (throw if invalid)
      // 2. then, if the code signing certificate is only valid for a particular project, verify that the directive
      //    has the correct info for code signing. If the code signing certificate doesn't specify a particular
      //    project, it is assumed to be valid for all projects
      // 3. consider the directive verified if both of these pass
      configuration.codeSigningConfiguration?.let { codeSigningConfiguration ->
        val signatureValidationResult = codeSigningConfiguration.validateSignature(
          directiveResponsePartInfo.responsePartHeaderData.signature,
          body.toByteArray(),
          certificateChainFromManifestResponse,
        )
        if (signatureValidationResult.validationResult == ValidationResult.INVALID) {
          throw IOException("Directive download was successful, but signature was incorrect")
        }

        if (signatureValidationResult.validationResult != ValidationResult.SKIPPED) {
          val directiveForProjectInformation = UpdateDirective.fromJSONString(body)
          signatureValidationResult.expoProjectInformation?.let { expoProjectInformation ->
            if (expoProjectInformation.projectId != directiveForProjectInformation.signingInfo?.easProjectId ||
              expoProjectInformation.scopeKey != directiveForProjectInformation.signingInfo.scopeKey
            ) {
              throw CertificateException("Invalid certificate for directive project ID or scope key")
            }
          }
        }
      }

      return UpdateResponsePart.DirectiveUpdateResponsePart(UpdateDirective.fromJSONString(body))
    } catch (e: Exception) {
      val message = "Failed to parse directive data: ${e.localizedMessage}"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
      throw Exception(
        message,
        e
      )
    }
  }

  private suspend fun parseManifest(
    manifestResponseInfo: ResponsePartInfo,
    extensions: JSONObject?,
    certificateChainFromManifestResponse: String?,
    configuration: UpdatesConfiguration,
  ): UpdateResponsePart.ManifestUpdateResponsePart {
    try {
      val updateResponseJson = extractUpdateResponseJson(manifestResponseInfo.body, configuration)
      val isSignatureInBody =
        updateResponseJson.has("manifestString") && updateResponseJson.has("signature")
      val signature = if (isSignatureInBody) {
        updateResponseJson.getNullable("signature")
      } else {
        manifestResponseInfo.responseHeaderData.manifestSignature
      }

      /**
       * The updateResponseJson is just the manifest when it is unsigned, or the signature is sent as a header.
       * If the signature is in the body, the updateResponseJson looks like:
       * {
       *   manifestString: string;
       *   signature: string;
       * }
       */
      val manifestString = if (isSignatureInBody) {
        updateResponseJson.getString("manifestString")
      } else {
        manifestResponseInfo.body
      }
      val preManifest = JSONObject(manifestString)

      // XDL serves unsigned manifests with the `signature` key set to "UNSIGNED".
      // We should treat these manifests as unsigned rather than signed with an invalid signature.
      val isUnsignedFromXDL = "UNSIGNED" == signature
      if (signature != null && !isUnsignedFromXDL) {
        val rsaSignatureResult = try {
          verifyExpoPublicRSASignature(
            this@FileDownloader,
            manifestString,
            signature,
          )
        } catch (e: RSAException) {
          throw Exception("Could not validate signed manifest", e)
        }

        if (rsaSignatureResult.isValid) {
          try {
            return checkCodeSigningAndCreateManifest(
              bodyString = manifestResponseInfo.body,
              preManifest = preManifest,
              responseHeaderData = manifestResponseInfo.responseHeaderData,
              responsePartHeaderData = manifestResponseInfo.responsePartHeaderData,
              extensions = extensions,
              certificateChainFromManifestResponse = certificateChainFromManifestResponse,
              isVerified = true,
              configuration = configuration,
              logger = logger,
            )
          } catch (e: Exception) {
            throw Exception("Failed to parse manifest data", e)
          }
        } else {
          val message = "Manifest signature is invalid; aborting"
          logger.error(message, UpdatesErrorCode.UpdateHasInvalidSignature)
          throw Exception(
            message,
            Exception("Manifest signature is invalid")
          )
        }
      } else {
        return checkCodeSigningAndCreateManifest(
          bodyString = manifestResponseInfo.body,
          preManifest = preManifest,
          responseHeaderData = manifestResponseInfo.responseHeaderData,
          responsePartHeaderData = manifestResponseInfo.responsePartHeaderData,
          extensions = extensions,
          certificateChainFromManifestResponse = certificateChainFromManifestResponse,
          isVerified = false,
          configuration = configuration,
          logger = logger,
        )
      }
    } catch (e: Exception) {
      val message = "Failed to parse manifest data: ${e.localizedMessage}"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
      throw Exception(
        message,
        e
      )
    }
  }

  suspend fun downloadRemoteUpdate(
    configuration: UpdatesConfiguration,
    extraHeaders: JSONObject?,
    context: Context,
  ): UpdateResponse {
    val response = try {
      downloadData(createRequestForRemoteUpdate(configuration, extraHeaders, context))
    } catch (e: IOException) {
      val message = "Failed to download remote update from URL: ${configuration.updateUrl}: ${e.localizedMessage}"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
      throw Exception(message, e)
    }

    if (!response.isSuccessful) {
      val message = "Failed to download remote update from URL: ${configuration.updateUrl}"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
      throw Exception(message, Exception(response.body!!.string()))
    }

    return parseRemoteUpdateResponse(response, configuration)
  }

  suspend fun downloadAsset(
    asset: AssetEntity,
    destinationDirectory: File?,
    configuration: UpdatesConfiguration,
    context: Context,
  ): AssetDownloadResult {
    if (asset.url == null) {
      val message = "Could not download asset " + asset.key + " with no URL"
      logger.error(message, UpdatesErrorCode.AssetsFailedToLoad)
      throw Exception(message)
    }
    val filename = UpdatesUtils.createFilenameForAsset(asset)
    val path = File(destinationDirectory, filename)
    if (path.exists()) {
      asset.relativePath = filename
      return AssetDownloadResult(asset, false)
    } else {
      try {
        val result = downloadFileAndVerifyHashAndWriteToPath(
          createRequestForAsset(asset, configuration, context),
          asset.expectedHash,
          path,
        )

        asset.downloadTime = Date()
        asset.relativePath = filename
        asset.hash = result.hash
        return AssetDownloadResult(asset, true)
      } catch (e: Exception) {
        logger.error("Failed to download asset ${asset.key}: ${e.localizedMessage}", UpdatesErrorCode.AssetsFailedToLoad, e)
        throw e
      }
    }
  }

  suspend inline fun Request.await(okHttpClient: OkHttpClient): Response {
    return suspendCancellableCoroutine { callback ->
      okHttpClient.newCall(this).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
          callback.resume(response)
        }

        override fun onFailure(call: Call, e: IOException) {
          if (callback.isCancelled) {
            return
          }
          callback.resumeWithException(e)
        }
      })
    }
  }

  suspend fun downloadData(request: Request): Response {
    return try {
      request.await(client)
    } catch (e: IOException) {
      request.await(client)
    }
  }

  companion object {
    private val TAG = FileDownloader::class.java.simpleName

    // Standard line separator for HTTP.
    private const val CRLF = "\r\n"

    @Throws(Exception::class)
    private fun checkCodeSigningAndCreateManifest(
      bodyString: String,
      preManifest: JSONObject,
      responseHeaderData: ResponseHeaderData,
      responsePartHeaderData: ResponsePartHeaderData,
      extensions: JSONObject?,
      certificateChainFromManifestResponse: String?,
      isVerified: Boolean,
      configuration: UpdatesConfiguration,
      logger: UpdatesLogger,
    ): UpdateResponsePart.ManifestUpdateResponsePart {
      if (configuration.expectsSignedManifest) {
        preManifest.put("isVerified", isVerified)
      }

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
            certificateChainFromManifestResponse,
          )
          if (signatureValidationResult.validationResult == ValidationResult.INVALID) {
            throw IOException("Manifest download was successful, but signature was incorrect")
          }

          if (signatureValidationResult.validationResult != ValidationResult.SKIPPED) {
            val manifestForProjectInformation = ManifestFactory.getManifest(
              preManifest,
              responseHeaderData,
              extensions,
              configuration
            ).manifest
            signatureValidationResult.expoProjectInformation?.let { expoProjectInformation ->
              if (expoProjectInformation.projectId != manifestForProjectInformation.getEASProjectID() ||
                expoProjectInformation.scopeKey != manifestForProjectInformation.getScopeKey()
              ) {
                throw CertificateException("Invalid certificate for manifest project ID or scope key")
              }
            }

            logger.info("Update code signature verified successfully")
            preManifest.put("isVerified", true)
          }
        }
      } catch (e: Exception) {
        logger.error(e.message!!, UpdatesErrorCode.UpdateCodeSigningError)
        throw e
      }

      val updateManifest = ManifestFactory.getManifest(preManifest, responseHeaderData, extensions, configuration)
      if (!SelectionPolicies.matchesFilters(updateManifest.updateEntity!!, responseHeaderData.manifestFilters)) {
        throw Exception("Downloaded manifest is invalid; provides filters that do not match its content")
      } else {
        return UpdateResponsePart.ManifestUpdateResponsePart(updateManifest)
      }
    }

    @Throws(IOException::class)
    private fun extractUpdateResponseJson(
      manifestString: String,
      configuration: UpdatesConfiguration
    ): JSONObject {
      try {
        return JSONObject(manifestString)
      } catch (e: JSONException) {
        // Ignore this error, try to parse manifest as array
      }

      // TODO: either add support for runtimeVersion or deprecate multi-manifests
      try {
        // the manifestString could be an array of manifest objects
        // in this case, we choose the first compatible manifest in the array
        val manifestArray = JSONArray(manifestString)
        for (i in 0 until manifestArray.length()) {
          val manifestCandidate = manifestArray.getJSONObject(i)
          val sdkVersion = manifestCandidate.getString("sdkVersion")
          if (configuration.sdkVersion != null && configuration.sdkVersion.split(",").contains(sdkVersion)
          ) {
            return manifestCandidate
          }
        }
      } catch (e: JSONException) {
        throw IOException(
          "Manifest string is not a valid JSONObject or JSONArray: $manifestString",
          e
        )
      }
      throw IOException("No compatible manifest found. SDK Versions supported: " + configuration.sdkVersion + " Provided manifestString: " + manifestString)
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
      context: Context,
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
      configuration: UpdatesConfiguration,
      extraHeaders: JSONObject?,
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
        .header("Expo-Accept-Signature", configuration.expectsSignedManifest.toString())
        .header("EAS-Client-ID", EASClientID(context).uuid.toString())
        .apply {
          val runtimeVersion = configuration.runtimeVersionRaw
          val sdkVersion = configuration.sdkVersion
          if (!runtimeVersion.isNullOrEmpty()) {
            header("Expo-Runtime-Version", runtimeVersion)
          } else if (!sdkVersion.isNullOrEmpty()) {
            header("Expo-SDK-Version", sdkVersion)
          }
        }
        .header("Expo-Release-Channel", configuration.releaseChannel)
        .apply {
          val previousFatalError = NoDatabaseLauncher.consumeErrorLog(context)
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

      return extraHeaders
    }
  }
}
