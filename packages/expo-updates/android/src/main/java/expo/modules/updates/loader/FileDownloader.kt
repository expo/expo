package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.loader.Crypto.RSASignatureListener
import expo.modules.updates.manifest.ManifestFactory
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.SelectionPolicies
import okhttp3.*
import okio.Buffer
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.util.*
import kotlin.coroutines.suspendCoroutine
import kotlin.math.min

open class FileDownloader(context: Context) {
  private val client = OkHttpClient.Builder().cache(getCache(context)).build()

  data class FileDownloadResult(val file: File, val hash: ByteArray)

  data class AssetDownloadResult(val assetEntity: AssetEntity, val isNew: Boolean)

  private fun getCache(context: Context): Cache {
    val cacheSize = 50 * 1024 * 1024 // 50 MiB
    return Cache(getCacheDirectory(context), cacheSize.toLong())
  }

  private fun getCacheDirectory(context: Context): File {
    return File(context.cacheDir, "okhttp")
  }

  private suspend fun downloadFileToPath(request: Request, destination: File): FileDownloadResult {
    val response = downloadDataSus(request)
    if (!response.isSuccessful) {
      throw Exception("Network request failed: " + response.body()!!.string())
    }

    try {
      response.body()!!.byteStream().use { inputStream ->
        val hash = UpdatesUtils.sha256AndWriteToFile(inputStream, destination)
        return FileDownloadResult(destination, hash)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to download file to destination $destination", e)
      throw e
    }
  }

  internal suspend fun parseManifestResponseSus(response: Response, configuration: UpdatesConfiguration): UpdateManifest {
    val contentType = response.header("content-type") ?: ""
    val regex = Regex("multipart/.*boundary=\"?([^\"]+)\"?")
    val matchResult = regex.matchEntire(contentType)
    return if (matchResult !== null) {
      val boundary = matchResult.groupValues[1]
      parseMultipartManifestResponse(response, boundary, configuration)
    } else {
      parseManifest(response.body()!!.string(), response.headers(), null, configuration)
    }
  }

  private suspend fun parseMultipartManifestResponse(response: Response, boundary: String, configuration: UpdatesConfiguration): UpdateManifest {
    val bodyReader = ExpoMultipartStreamReader(
      response.body()!!.source(),
      boundary
    )

    var manifestBodyAndHeaders: Pair<String, Map<String, String>>? = null
    var extensionsBody: String? = null

    val contentDispositionNameFieldRegex = Regex(".*name=\"?([^\"]+)\"?")

    val completed = bodyReader.readAllParts(
      object : ExpoMultipartStreamReader.ChunkListener {
        @Throws(IOException::class)
        override fun onChunkComplete(
          headers: Map<String, String>?,
          body: Buffer,
          isLastChunk: Boolean
        ) {
          val headersWithLowercaseKeys = headers?.mapKeys { (k, _) -> k.toLowerCase() } ?: return
          val contentDisposition = headersWithLowercaseKeys["content-disposition"] ?: return
          when (contentDispositionNameFieldRegex.matchEntire(contentDisposition)?.groupValues?.get(1)) {
            "manifest" -> manifestBodyAndHeaders = Pair(body.readUtf8(), headers)
            "extensions" -> extensionsBody = body.readUtf8()
          }
        }

        override fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long) {}
      })

    if (!completed) {
      throw IOException("Could not read multipart manifest response")
    }

    if (manifestBodyAndHeaders == null) {
      throw IOException("Multipart manifest response missing manifest part")
    }

    val extensions = try {
      extensionsBody?.let { JSONObject(it) }
    } catch (e: Exception) {
      throw IOException("Failed to parse multipart manifest extensions", e)
    }

    return parseManifest(manifestBodyAndHeaders!!.first, Headers.of(manifestBodyAndHeaders!!.second), extensions, configuration)
  }

  private suspend fun parseManifest(manifestBody: String, manifestHeaders: Headers, extensions: JSONObject?, configuration: UpdatesConfiguration): UpdateManifest {
    try {
      val updateResponseJson = extractUpdateResponseJson(manifestBody, configuration)
      val isSignatureInBody =
        updateResponseJson.has("manifestString") && updateResponseJson.has("signature")
      val signature = if (isSignatureInBody) {
        updateResponseJson.getNullable("signature")
      } else {
        manifestHeaders["expo-manifest-signature"]
      }

      /**
       * The updateResponseJson is just the manifest when it is unsigned, or the signature is sent as a header.
       * If the signature is in the body, the updateResponseJson looks like:
       * {
       *   manifestString: string;
       *   signature: string;
       * }
       */
      val manifestString =
        if (isSignatureInBody) updateResponseJson.getString("manifestString") else manifestBody
      val preManifest = JSONObject(manifestString)

      // XDL serves unsigned manifests with the `signature` key set to "UNSIGNED".
      // We should treat these manifests as unsigned rather than signed with an invalid signature.
      val isUnsignedFromXDL = "UNSIGNED" == signature
      if (signature != null && !isUnsignedFromXDL) {
        val isValid = Crypto.verifyPublicRSASignatureSus(
          manifestString,
          signature,
          this@FileDownloader,
        )
        if (isValid) {
          try {
            return createManifest(preManifest, manifestHeaders, extensions,true, configuration)
          } catch (e: Exception) {
            throw Error("Failed to parse manifest data", e)
          }
        } else {
          throw Error("Manifest signature is invalid; aborting")
        }
      } else {
        return createManifest(preManifest, manifestHeaders, extensions,false, configuration)
      }
    } catch (e: Exception) {
      throw Error(
        "Failed to parse manifest data",
        e
      )
    }
  }

  suspend fun downloadManifestSus(
    configuration: UpdatesConfiguration,
    extraHeaders: JSONObject?,
    context: Context
  ): UpdateManifest {
    try {
      val response = downloadDataSus(createRequestForManifest(configuration, extraHeaders, context))
      if (!response.isSuccessful) {
        throw Exception(response.body()!!.string())
      }

      return parseManifestResponseSus(response, configuration)
    } catch (e: Exception) {
      throw Error("Failed to download manifest from URL ${configuration.updateUrl}", e)
    }
  }

  suspend fun downloadAssetSus(
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
      asset.downloadTime = Date()
      asset.relativePath = filename
      asset.hash = result.hash
      AssetDownloadResult(asset, true)
    }
  }

  suspend fun downloadDataSus(request: Request): Response {
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

    @Throws(Exception::class)
    private fun createManifest(
      preManifest: JSONObject,
      headers: Headers,
      extensions: JSONObject?,
      isVerified: Boolean,
      configuration: UpdatesConfiguration,
    ): UpdateManifest {
      if (configuration.expectsSignedManifest) {
        preManifest.put("isVerified", isVerified)
      }
      val updateManifest = ManifestFactory.getManifest(preManifest, headers, extensions, configuration)
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

    private fun createRequestForAsset(assetEntity: AssetEntity, configuration: UpdatesConfiguration): Request {
      return Request.Builder()
        .url(assetEntity.url!!.toString())
        .header("Expo-Platform", "android")
        .header("Expo-API-Version", "1")
        .header("Expo-Updates-Environment", "BARE")
        .apply {
          for ((key, value) in configuration.requestHeaders) {
            header(key, value)
          }
        }
        .apply {
          assetEntity.headers?.let { headers -> headers.keys().asSequence().forEach { key ->
            header(key, headers.require(key))
          } }
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
        .build()
    }
  }
}
