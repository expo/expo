package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.manifest.ManifestFactory
import expo.modules.updates.manifest.ManifestHeaderData
import expo.modules.updates.manifest.UpdateManifest
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
import android.util.Base64
import kotlin.coroutines.suspendCoroutine

open class FileDownloader(private val client: OkHttpClient) {
  constructor(context: Context) : this(OkHttpClient.Builder().cache(getCache(context)).build())

  data class FileDownloadResult(val file: File, val hash: ByteArray)

  data class AssetDownloadResult(val assetEntity: AssetEntity, val isNew: Boolean)

  private suspend fun downloadFileToPath(request: Request, destination: File): FileDownloadResult {
    val response = downloadData(request)
    if (!response.isSuccessful) {
      throw Exception("Network request failed: " + response.body()!!.string())
    }

    try {
      return response.body()!!.byteStream().use { inputStream ->
        val hash = UpdatesUtils.sha256AndWriteToFile(inputStream, destination)
        FileDownloadResult(destination, hash)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to download file to destination $destination", e)
      throw e
    }
  }

  internal suspend fun parseManifestResponse(response: Response, configuration: UpdatesConfiguration): UpdateManifest {
    val contentType = response.header("content-type") ?: ""
    val isMultipart = contentType.startsWith("multipart/", ignoreCase = true)
    if (isMultipart) {
      val boundaryParameter = ParameterParser().parse(contentType, ';')["boundary"]
        ?: throw IOException("Missing boundary in multipart manifest content-type")

      return parseMultipartManifestResponse(response, boundaryParameter, configuration)
    } else {
      val responseHeaders = response.headers()
      val manifestHeaderData = ManifestHeaderData(
        protocolVersion = responseHeaders["expo-protocol-version"],
        manifestFilters = responseHeaders["expo-manifest-filters"],
        serverDefinedHeaders = responseHeaders["expo-server-defined-headers"],
        manifestSignature = responseHeaders["expo-manifest-signature"],
        signature = responseHeaders["expo-signature"]
      )

      return parseManifest(response.body()!!.string(), manifestHeaderData, null, configuration)
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
    return Headers.of(headers)
  }

  private suspend fun parseMultipartManifestResponse(response: Response, boundary: String, configuration: UpdatesConfiguration): UpdateManifest {
    var manifestPartBodyAndHeaders: Pair<String, Headers>? = null
    var extensionsBody: String? = null

    val multipartStream = MultipartStream(response.body()!!.byteStream(), boundary.toByteArray())

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
            }
          }
        }
        nextPart = multipartStream.readBoundary()
      }
    } catch (e: Exception) {
      throw IOException("Error while reading multipart manifest response", e)
    }

    if (manifestPartBodyAndHeaders == null) {
      throw IOException("Malformed multipart manifest response")
    }

    val extensions = try {
      extensionsBody?.let { JSONObject(it) }
    } catch (e: Exception) {
      throw IOException("Failed to parse multipart manifest extensions", e)
    }

    val responseHeaders = response.headers()
    val manifestHeaderData = ManifestHeaderData(
      protocolVersion = responseHeaders["expo-protocol-version"],
      manifestFilters = responseHeaders["expo-manifest-filters"],
      serverDefinedHeaders = responseHeaders["expo-server-defined-headers"],
      manifestSignature = responseHeaders["expo-manifest-signature"],
      signature = manifestPartBodyAndHeaders.second["expo-signature"]
    )

    return parseManifest(manifestPartBodyAndHeaders.first, manifestHeaderData, extensions, configuration)
  }

  private suspend fun parseManifest(manifestBody: String, manifestHeaderData: ManifestHeaderData, extensions: JSONObject?, configuration: UpdatesConfiguration): UpdateManifest {
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
        val isValid = Crypto.verifyExpoPublicRSASignature(this@FileDownloader, manifestString, signature)
        if (isValid) {
          try {
            return createManifest(manifestBody, preManifest, manifestHeaderData, extensions, true, configuration)
          } catch (e: Exception) {
            throw Error("Failed to parse manifest data", e)
          }
        } else {
          throw Error("Manifest signature is invalid; aborting")
        }
      } else {
        return createManifest(manifestBody, preManifest, manifestHeaderData, extensions, false, configuration)
      }
    } catch (e: Exception) {
      throw IOException("Failed to parse manifest data", e)
    }
  }

  suspend fun downloadManifest(
    configuration: UpdatesConfiguration,
    extraHeaders: JSONObject?,
    context: Context,
  ): UpdateManifest {
    try {
      val response = downloadData(createRequestForManifest(configuration, extraHeaders, context))
      if (!response.isSuccessful) {
        throw Exception(response.body()!!.string())
      }
      return parseManifestResponse(response, configuration)
    } catch (e: Exception) {
      throw IOException(
        "Failed to download manifest from URL " + configuration.updateUrl.toString(),
        e
      )
    }
  }

  suspend fun downloadAsset(
    asset: AssetEntity,
    destinationDirectory: File?,
    configuration: UpdatesConfiguration,
  ): AssetDownloadResult {
    if (asset.url == null) {
      throw Exception("Could not download asset " + asset.key + " with no URL")
    }
    val filename = UpdatesUtils.createFilenameForAsset(asset)
    val path = File(destinationDirectory, filename)
    return if (path.exists()) {
      asset.relativePath = filename
      AssetDownloadResult(asset, false)
    } else {
      val result = downloadFileToPath(createRequestForAsset(asset, configuration), path)

      // base64url - https://datatracker.ietf.org/doc/html/rfc4648#section-5
      val hashBase64String = Base64.encodeToString(result.hash, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
      val expectedAssetHash = asset.expectedHash?.toLowerCase(Locale.ROOT)
      if (expectedAssetHash != null && expectedAssetHash != hashBase64String) {
        throw Exception("Asset hash invalid: ${asset.key}; expectedHash: $expectedAssetHash; actualHash: $hashBase64String")
      }

      asset.downloadTime = Date()
      asset.relativePath = filename
      asset.hash = result.hash
      AssetDownloadResult(asset, true)
    }
  }

  suspend fun downloadData(request: Request): Response {
    return suspendCoroutine { cont ->
      client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          // retry once
          client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
              cont.resumeWith(Result.failure(e))
            }
            override fun onResponse(call: Call, response: Response) {
              cont.resumeWith(Result.success(response))
            }
          })
        }

        override fun onResponse(call: Call, response: Response) {
          cont.resumeWith(Result.success(response))
        }
      })
    }
  }

  companion object {
    private val TAG = FileDownloader::class.java.simpleName

    // Standard line separator for HTTP.
    private const val CRLF = "\r\n"

    @Throws(Exception::class)
    private fun createManifest(
      bodyString: String,
      preManifest: JSONObject,
      manifestHeaderData: ManifestHeaderData,
      extensions: JSONObject?,
      isVerified: Boolean,
      configuration: UpdatesConfiguration,
    ): UpdateManifest {
      try {
        configuration.codeSigningConfiguration?.let {
          val isSignatureValid = Crypto.isSignatureValid(
            it,
            Crypto.parseSignatureHeader(manifestHeaderData.signature),
            bodyString.toByteArray()
          )
          if (!isSignatureValid) {
            throw IOException("Manifest download was successful, but signature was incorrect")
          }
        }
      } catch (e: Exception) {
        throw IOException("Downloaded manifest signature is invalid", e)
      }

      if (configuration.expectsSignedManifest) {
        preManifest.put("isVerified", isVerified)
      }
      val updateManifest = ManifestFactory.getManifest(preManifest, manifestHeaderData, extensions, configuration)
      if (!SelectionPolicies.matchesFilters(updateManifest.updateEntity!!, updateManifest.manifestFilters)) {
        throw Exception("Downloaded manifest is invalid; provides filters that do not match its content")
      } else {
        return updateManifest
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

    internal fun createRequestForAsset(assetEntity: AssetEntity, configuration: UpdatesConfiguration): Request {
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
        .apply {
          val runtimeVersion = configuration.runtimeVersion
          val sdkVersion = configuration.sdkVersion
          if (runtimeVersion != null && runtimeVersion.isNotEmpty()) {
            header("Expo-Runtime-Version", runtimeVersion)
          } else {
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
            header("expo-expects-signature", Crypto.createAcceptSignatureHeader(it))
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
  }
}
