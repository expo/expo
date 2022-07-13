package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.jsonutils.require
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.selectionpolicy.SelectionPolicies
import okhttp3.*
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
import expo.modules.updates.codesigning.ValidationResult
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.manifest.*
import java.security.cert.CertificateException

open class FileDownloader(private val client: OkHttpClient) {
  constructor(context: Context) : this(OkHttpClient.Builder().cache(getCache(context)).build())

  interface FileDownloadCallback {
    fun onFailure(e: Exception)
    fun onSuccess(file: File, hash: ByteArray)
  }

  interface ManifestDownloadCallback {
    fun onFailure(message: String, e: Exception)
    fun onSuccess(updateManifest: UpdateManifest)
  }

  interface AssetDownloadCallback {
    fun onFailure(e: Exception, assetEntity: AssetEntity)
    fun onSuccess(assetEntity: AssetEntity, isNew: Boolean)
  }

  private fun downloadFileAndVerifyHashAndWriteToPath(
    request: Request,
    expectedBase64URLEncodedSHA256Hash: String?,
    destination: File,
    callback: FileDownloadCallback
  ) {
    downloadData(
      request,
      object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          callback.onFailure(e)
        }

        @Throws(IOException::class)
        override fun onResponse(call: Call, response: Response) {
          if (!response.isSuccessful) {
            callback.onFailure(
              Exception(
                "Network request failed: " + response.body!!
                  .string()
              )
            )
            return
          }
          try {
            response.body!!.byteStream().use { inputStream ->
              val hash = UpdatesUtils.verifySHA256AndWriteToFile(inputStream, destination, expectedBase64URLEncodedSHA256Hash)
              callback.onSuccess(destination, hash)
            }
          } catch (e: Exception) {
            Log.e(TAG, "Failed to download file to destination $destination", e)
            callback.onFailure(e)
          }
        }
      }
    )
  }

  internal fun parseManifestResponse(response: Response, configuration: UpdatesConfiguration, callback: ManifestDownloadCallback) {
    val contentType = response.header("content-type") ?: ""
    val isMultipart = contentType.startsWith("multipart/", ignoreCase = true)
    if (isMultipart) {
      val boundaryParameter = ParameterParser().parse(contentType, ';')["boundary"]
      if (boundaryParameter == null) {
        callback.onFailure(
          "Missing boundary in multipart manifest content-type",
          IOException("Missing boundary in multipart manifest content-type")
        )
        return
      }

      parseMultipartManifestResponse(response, boundaryParameter, configuration, callback)
    } else {
      val responseHeaders = response.headers
      val manifestHeaderData = ManifestHeaderData(
        protocolVersion = responseHeaders["expo-protocol-version"],
        manifestFilters = responseHeaders["expo-manifest-filters"],
        serverDefinedHeaders = responseHeaders["expo-server-defined-headers"],
        manifestSignature = responseHeaders["expo-manifest-signature"],
        signature = responseHeaders["expo-signature"]
      )

      parseManifest(response.body!!.string(), manifestHeaderData, null, null, configuration, callback)
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

  private fun parseMultipartManifestResponse(response: Response, boundary: String, configuration: UpdatesConfiguration, callback: ManifestDownloadCallback) {
    var manifestPartBodyAndHeaders: Pair<String, Headers>? = null
    var extensionsBody: String? = null
    var certificateChainString: String? = null

    val multipartStream = MultipartStream(response.body!!.byteStream(), boundary.toByteArray())

    try {
      var nextPart = multipartStream.skipPreamble()
      while (nextPart) {
        val headers = parseHeaders(multipartStream.readHeaders())

        // always read the body to progress the reader
        val output = ByteArrayOutputStream()
        multipartStream.readBodyData(output)

        val contentDispositionValue = headers.get("content-disposition")
        if (contentDispositionValue != null) {
          val contentDispositionParameterMap = ParameterParser().parse(contentDispositionValue, ';')
          val contentDispositionName = contentDispositionParameterMap["name"]
          if (contentDispositionName != null) {
            when (contentDispositionName) {
              "manifest" -> manifestPartBodyAndHeaders = Pair(output.toString(), headers)
              "extensions" -> extensionsBody = output.toString()
              "certificate_chain" -> certificateChainString = output.toString()
            }
          }
        }
        nextPart = multipartStream.readBoundary()
      }
    } catch (e: Exception) {
      callback.onFailure(
        "Error while reading multipart manifest response",
        e
      )
      return
    }

    if (manifestPartBodyAndHeaders == null) {
      callback.onFailure("Multipart manifest response missing manifest part", IOException("Malformed multipart manifest response"))
      return
    }

    val extensions = try {
      extensionsBody?.let { JSONObject(it) }
    } catch (e: Exception) {
      callback.onFailure(
        "Failed to parse multipart manifest extensions",
        e
      )
      return
    }

    val responseHeaders = response.headers
    val manifestHeaderData = ManifestHeaderData(
      protocolVersion = responseHeaders["expo-protocol-version"],
      manifestFilters = responseHeaders["expo-manifest-filters"],
      serverDefinedHeaders = responseHeaders["expo-server-defined-headers"],
      manifestSignature = responseHeaders["expo-manifest-signature"],
      signature = manifestPartBodyAndHeaders.second["expo-signature"]
    )

    parseManifest(manifestPartBodyAndHeaders.first, manifestHeaderData, extensions, certificateChainString, configuration, callback)
  }

  private fun parseManifest(
    manifestBody: String,
    manifestHeaderData: ManifestHeaderData,
    extensions: JSONObject?,
    certificateChainFromManifestResponse: String?,
    configuration: UpdatesConfiguration,
    callback: ManifestDownloadCallback
  ) {
    try {
      val updateResponseJson = extractUpdateResponseJson(manifestBody, configuration)
      val isSignatureInBody =
        updateResponseJson.has("manifestString") && updateResponseJson.has("signature")
      val signature = if (isSignatureInBody) {
        updateResponseJson.getNullable("signature")
      } else {
        manifestHeaderData.manifestSignature
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
        manifestBody
      }
      val preManifest = JSONObject(manifestString)

      // XDL serves unsigned manifests with the `signature` key set to "UNSIGNED".
      // We should treat these manifests as unsigned rather than signed with an invalid signature.
      val isUnsignedFromXDL = "UNSIGNED" == signature
      if (signature != null && !isUnsignedFromXDL) {
        verifyExpoPublicRSASignature(
          this@FileDownloader,
          manifestString,
          signature,
          object : RSASignatureListener {
            override fun onError(exception: Exception, isNetworkError: Boolean) {
              callback.onFailure("Could not validate signed manifest", exception)
            }

            override fun onCompleted(isValid: Boolean) {
              if (isValid) {
                try {
                  checkCodeSigningAndCreateManifest(manifestBody, preManifest, manifestHeaderData, extensions, certificateChainFromManifestResponse, true, configuration, callback)
                } catch (e: Exception) {
                  callback.onFailure("Failed to parse manifest data", e)
                }
              } else {
                callback.onFailure(
                  "Manifest signature is invalid; aborting",
                  Exception("Manifest signature is invalid")
                )
              }
            }
          }
        )
      } else {
        checkCodeSigningAndCreateManifest(manifestBody, preManifest, manifestHeaderData, extensions, certificateChainFromManifestResponse, false, configuration, callback)
      }
    } catch (e: Exception) {
      callback.onFailure(
        "Failed to parse manifest data",
        e
      )
    }
  }

  fun downloadManifest(
    configuration: UpdatesConfiguration,
    extraHeaders: JSONObject?,
    context: Context,
    callback: ManifestDownloadCallback
  ) {
    try {
      downloadData(
        createRequestForManifest(configuration, extraHeaders, context),
        object : Callback {
          override fun onFailure(call: Call, e: IOException) {
            callback.onFailure(
              "Failed to download manifest from URL: " + configuration.updateUrl,
              e
            )
          }

          @Throws(IOException::class)
          override fun onResponse(call: Call, response: Response) {
            if (!response.isSuccessful) {
              callback.onFailure(
                "Failed to download manifest from URL: " + configuration.updateUrl,
                Exception(
                  response.body!!.string()
                )
              )
              return
            }

            parseManifestResponse(response, configuration, callback)
          }
        }
      )
    } catch (e: Exception) {
      callback.onFailure(
        "Failed to download manifest from URL " + configuration.updateUrl.toString(),
        e
      )
    }
  }

  fun downloadAsset(
    asset: AssetEntity,
    destinationDirectory: File?,
    configuration: UpdatesConfiguration,
    context: Context,
    callback: AssetDownloadCallback
  ) {
    if (asset.url == null) {
      callback.onFailure(Exception("Could not download asset " + asset.key + " with no URL"), asset)
      return
    }
    val filename = UpdatesUtils.createFilenameForAsset(asset)
    val path = File(destinationDirectory, filename)
    if (path.exists()) {
      asset.relativePath = filename
      callback.onSuccess(asset, false)
    } else {
      try {
        downloadFileAndVerifyHashAndWriteToPath(
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
        callback.onFailure(e, asset)
      }
    }
  }

  fun downloadData(request: Request, callback: Callback) {
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
      manifestHeaderData: ManifestHeaderData,
      extensions: JSONObject?,
      certificateChainFromManifestResponse: String?,
      isVerified: Boolean,
      configuration: UpdatesConfiguration,
      callback: ManifestDownloadCallback
    ) {
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
            manifestHeaderData.signature,
            bodyString.toByteArray(),
            certificateChainFromManifestResponse,
          )
          if (signatureValidationResult.validationResult == ValidationResult.INVALID) {
            throw IOException("Manifest download was successful, but signature was incorrect")
          }

          if (signatureValidationResult.validationResult != ValidationResult.SKIPPED) {
            val manifestForProjectInformation = ManifestFactory.getManifest(
              preManifest,
              manifestHeaderData,
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

            preManifest.put("isVerified", true)
          }
        }
      } catch (e: Exception) {
        callback.onFailure(e.message!!, e)
        return
      }

      val updateManifest = ManifestFactory.getManifest(preManifest, manifestHeaderData, extensions, configuration)
      if (!SelectionPolicies.matchesFilters(updateManifest.updateEntity!!, updateManifest.manifestFilters)) {
        val message =
          "Downloaded manifest is invalid; provides filters that do not match its content"
        callback.onFailure(message, Exception(message))
      } else {
        callback.onSuccess(updateManifest)
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
          if (configuration.sdkVersion != null && configuration.sdkVersion!!.split(",").contains(sdkVersion)
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

    internal fun createRequestForAsset(
      assetEntity: AssetEntity,
      configuration: UpdatesConfiguration,
      context: Context,
    ): Request {
      return Request.Builder()
        .url(assetEntity.url!!.toString())
        .apply {
          assetEntity.extraRequestHeaders?.let { headers ->
            headers.keys().asSequence().forEach { key ->
              header(key, headers.require(key))
            }
          }
        }
        .header("Expo-Platform", "android")
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

    internal fun createRequestForManifest(
      configuration: UpdatesConfiguration,
      extraHeaders: JSONObject?,
      context: Context
    ): Request {
      return Request.Builder()
        .url(configuration.updateUrl.toString())
        .apply {
          // apply extra headers before anything else, so they don't override preset headers
          if (extraHeaders != null) {
            val keySet = extraHeaders.keys()
            while (keySet.hasNext()) {
              val key = keySet.next()
              header(key, extraHeaders.optString(key, ""))
            }
          }
        }
        .header("Accept", "multipart/mixed,application/expo+json,application/json")
        .header("Expo-Platform", "android")
        .header("Expo-API-Version", "1")
        .header("Expo-Updates-Environment", "BARE")
        .header("Expo-JSON-Error", "true")
        .header("Expo-Accept-Signature", configuration.expectsSignedManifest.toString())
        .header("EAS-Client-ID", EASClientID(context).uuid.toString())
        .apply {
          val runtimeVersion = configuration.runtimeVersion
          val sdkVersion = configuration.sdkVersion
          if (runtimeVersion != null && runtimeVersion.isNotEmpty()) {
            header("Expo-Runtime-Version", runtimeVersion)
          } else if (sdkVersion != null && sdkVersion.isNotEmpty()) {
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

    fun getExtraHeaders(
      database: UpdatesDatabase,
      configuration: UpdatesConfiguration,
      launchedUpdate: UpdateEntity?,
      embeddedUpdate: UpdateEntity?
    ): JSONObject {
      val extraHeaders =
        ManifestMetadata.getServerDefinedHeaders(database, configuration) ?: JSONObject()

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
