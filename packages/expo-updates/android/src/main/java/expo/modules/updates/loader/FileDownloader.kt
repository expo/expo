package expo.modules.updates.loader

import android.content.Context
import android.net.Uri
import android.util.Log
import expo.modules.jsonutils.getNullable
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.loader.Crypto.RSASignatureListener
import expo.modules.updates.manifest.ManifestFactory
import expo.modules.updates.manifest.ManifestResponse
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

open class FileDownloader(context: Context) {
  private val client = OkHttpClient.Builder().cache(getCache(context)).build()

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

  private fun getCache(context: Context): Cache {
    val cacheSize = 50 * 1024 * 1024 // 50 MiB
    return Cache(getCacheDirectory(context), cacheSize.toLong())
  }

  private fun getCacheDirectory(context: Context): File {
    return File(context.cacheDir, "okhttp")
  }

  private fun downloadFileToPath(request: Request, destination: File, callback: FileDownloadCallback) {
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
                "Network request failed: " + response.body()!!
                  .string()
              )
            )
            return
          }
          try {
            response.body()!!.byteStream().use { inputStream ->
              val hash = UpdatesUtils.sha256AndWriteToFile(inputStream, destination)
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

  fun downloadManifest(
    configuration: UpdatesConfiguration,
    extraHeaders: JSONObject?,
    context: Context,
    callback: ManifestDownloadCallback
  ) {
    try {
      downloadData(
        setHeadersForManifestUrl(configuration, extraHeaders, context),
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
                  response.body()!!.string()
                )
              )
              return
            }
            try {
              val updateResponseBody = response.body()!!.string()
              val updateResponseJson = extractUpdateResponseJson(updateResponseBody, configuration)
              val isSignatureInBody = updateResponseJson.has("manifestString") && updateResponseJson.has("signature")
              val signature = if (isSignatureInBody) {
                updateResponseJson.getNullable("signature")
              } else {
                response.header("expo-manifest-signature", null)
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
                if (isSignatureInBody) updateResponseJson.getString("manifestString") else updateResponseBody
              val preManifest = JSONObject(manifestString)

              // XDL serves unsigned manifests with the `signature` key set to "UNSIGNED".
              // We should treat these manifests as unsigned rather than signed with an invalid signature.
              val isUnsignedFromXDL = "UNSIGNED" == signature
              if (signature != null && !isUnsignedFromXDL) {
                Crypto.verifyPublicRSASignature(
                  manifestString,
                  signature,
                  this@FileDownloader,
                  object : RSASignatureListener {
                    override fun onError(exception: Exception, isNetworkError: Boolean) {
                      callback.onFailure("Could not validate signed manifest", exception)
                    }

                    override fun onCompleted(isValid: Boolean) {
                      if (isValid) {
                        try {
                          createManifest(preManifest, response, true, configuration, callback)
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
                createManifest(preManifest, response, false, configuration, callback)
              }
            } catch (e: Exception) {
              callback.onFailure("Failed to parse manifest data", e)
            }
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
        downloadFileToPath(
          setHeadersForUrl(asset.url!!, configuration),
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

    @Throws(Exception::class)
    private fun createManifest(
      preManifest: JSONObject,
      response: Response,
      isVerified: Boolean,
      configuration: UpdatesConfiguration,
      callback: ManifestDownloadCallback
    ) {
      if (configuration.expectsSignedManifest) {
        preManifest.put("isVerified", isVerified)
      }
      val updateManifest = ManifestFactory.getManifest(preManifest, ManifestResponse(response), configuration)
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

    private fun setHeadersForUrl(url: Uri, configuration: UpdatesConfiguration): Request {
      return Request.Builder()
        .url(url.toString())
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

    internal fun setHeadersForManifestUrl(
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
        .header("Accept", "application/expo+json,application/json")
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
