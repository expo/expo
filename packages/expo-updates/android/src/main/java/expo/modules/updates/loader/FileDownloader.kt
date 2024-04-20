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
import org.apache.commons.fileupload.MultipartStream
import org.apache.commons.fileupload.ParameterParser
import java.io.ByteArrayOutputStream
import expo.modules.easclient.EASClientID
import expo.modules.structuredheaders.OuterList
import okhttp3.Headers.Companion.toHeaders
import expo.modules.structuredheaders.StringItem
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
class FileDownloader(context: Context, private val configuration: UpdatesConfiguration) {
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
  constructor(context: Context, configuration: UpdatesConfiguration, client: OkHttpClient) : this(context, configuration) {
    this.client = client
  }

  private val logger = UpdatesLogger(context)

  interface FileDownloadCallback {
    fun onFailure(e: Exception)
    fun onSuccess(file: File, hash: ByteArray)
  }

  interface RemoteUpdateDownloadCallback {
    fun onFailure(message: String, e: Exception)
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
          logger.error("Failed to download asset from ${request.url}", UpdatesErrorCode.AssetsFailedToLoad, e)
          callback.onFailure(e)
        }

        @Throws(IOException::class)
        override fun onResponse(call: Call, response: Response) {
          if (!response.isSuccessful) {
            val error = Exception("Network request failed: " + response.body!!.string())
            logger.error("Failed to download file from ${request.url}", UpdatesErrorCode.AssetsFailedToLoad, error)
            callback.onFailure(error)
            return
          }
          try {
            response.body!!.byteStream().use { inputStream ->
              val hash = UpdatesUtils.verifySHA256AndWriteToFile(inputStream, destination, expectedBase64URLEncodedSHA256Hash)
              callback.onSuccess(destination, hash)
            }
          } catch (e: Exception) {
            logger.error("Failed to write file from ${request.url} to destination $destination", UpdatesErrorCode.AssetsFailedToLoad, e)
            callback.onFailure(e)
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

      val message = "Missing body in remote update"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(
        message,
        IOException(message)
      )
      return
    }

    val contentType = response.header("content-type") ?: ""
    val isMultipart = contentType.startsWith("multipart/", ignoreCase = true)
    if (isMultipart) {
      val boundaryParameter = ParameterParser().parse(contentType, ';')["boundary"]
      if (boundaryParameter == null) {
        val message = "Missing boundary in multipart remote update content-type"
        logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
        callback.onFailure(
          message,
          IOException(message)
        )
        return
      }

      parseMultipartRemoteUpdateResponse(responseBody, responseHeaderData, boundaryParameter, callback)
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
          override fun onFailure(message: String, e: Exception) {
            callback.onFailure(message, e)
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

  private fun parseMultipartRemoteUpdateResponse(responseBody: ResponseBody, responseHeaderData: ResponseHeaderData, boundary: String, callback: RemoteUpdateDownloadCallback) {
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
      callback.onFailure(
        message,
        e
      )
      return
    }

    val extensions = try {
      extensionsBody?.let { JSONObject(it) }
    } catch (e: Exception) {
      val message = "Failed to parse multipart remote update extensions"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(
        message,
        e
      )
      return
    }

    // in v0 compatibility mode require a manifest
    if (configuration.enableExpoUpdatesProtocolV0CompatibilityMode && manifestPartBodyAndHeaders == null) {
      val message = "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the update being a rollback or other directive."
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
      callback.onFailure(message, IOException(message))
      return
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
          override fun onFailure(message: String, e: Exception) {
            if (!didError) {
              didError = true
              callback.onFailure(message, e)
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
          override fun onFailure(message: String, e: Exception) {
            if (!didError) {
              didError = true
              callback.onFailure(message, e)
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
    fun onFailure(message: String, e: Exception)
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
      } catch (e: Exception) {
        callback.onFailure(e.message!!, e)
        return
      }

      callback.onSuccess(UpdateResponsePart.DirectiveUpdateResponsePart(UpdateDirective.fromJSONString(body)))
    } catch (e: Exception) {
      val message = "Failed to parse directive data: ${e.localizedMessage}"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
      callback.onFailure(
        message,
        e
      )
    }
  }

  interface ParseManifestCallback {
    fun onFailure(message: String, e: Exception)
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
      val message = "Failed to parse manifest data: ${e.localizedMessage}"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
      callback.onFailure(
        message,
        e
      )
    }
  }

  fun downloadRemoteUpdate(
    extraHeaders: JSONObject?,
    context: Context,
    callback: RemoteUpdateDownloadCallback
  ) {
    try {
      downloadData(
        createRequestForRemoteUpdate(extraHeaders, configuration, context),
        object : Callback {
          override fun onFailure(call: Call, e: IOException) {
            val message = "Failed to download remote update from URL: ${configuration.updateUrl}: ${e.localizedMessage}"
            logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
            callback.onFailure(
              message,
              e
            )
          }

          @Throws(IOException::class)
          override fun onResponse(call: Call, response: Response) {
            if (!response.isSuccessful) {
              val message = "Failed to download remote update from URL: ${configuration.updateUrl}"
              logger.error(message, UpdatesErrorCode.UpdateFailedToLoad)
              callback.onFailure(
                message,
                Exception(response.body!!.string())
              )
              return
            }

            parseRemoteUpdateResponse(response, callback)
          }
        }
      )
    } catch (e: Exception) {
      val message = "Failed to download remote update from URL: ${configuration.updateUrl}: ${e.localizedMessage}"
      logger.error(message, UpdatesErrorCode.UpdateFailedToLoad, e)
      callback.onFailure(
        message,
        e
      )
    }
  }

  fun downloadAsset(
    asset: AssetEntity,
    destinationDirectory: File?,
    context: Context,
    callback: AssetDownloadCallback
  ) {
    if (asset.url == null) {
      val message = "Could not download asset " + asset.key + " with no URL"
      logger.error(message, UpdatesErrorCode.AssetsFailedToLoad)
      callback.onFailure(Exception(message), asset)
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
        logger.error("Failed to download asset ${asset.key}: ${e.localizedMessage}", UpdatesErrorCode.AssetsFailedToLoad, e)
        callback.onFailure(e, asset)
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
            throw IOException("Manifest download was successful, but signature was incorrect")
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
                throw CertificateException("Invalid certificate for manifest project ID or scope key")
              }
            }

            logger.info("Update code signature verified successfully")
            preManifest.put("isVerified", true)
          }
        }
      } catch (e: Exception) {
        logger.error(e.message!!, UpdatesErrorCode.UpdateCodeSigningError)
        callback.onFailure(e.message!!, e)
        return
      }

      val update = UpdateFactory.getUpdate(preManifest, responseHeaderData, extensions, configuration)
      if (!SelectionPolicies.matchesFilters(update.updateEntity!!, responseHeaderData.manifestFilters)) {
        val message =
          "Downloaded manifest is invalid; provides filters that do not match its content"
        callback.onFailure(message, Exception(message))
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
