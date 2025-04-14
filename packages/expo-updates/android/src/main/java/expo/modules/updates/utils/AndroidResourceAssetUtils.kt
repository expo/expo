// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.updates.utils

import android.annotation.SuppressLint
import android.content.Context
import androidx.core.net.toUri
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.updates.db.entity.AssetEntity
import java.io.IOException

/**
 * Helpers for Android embedded assets and resources
 */
internal object AndroidResourceAssetUtils {
  private const val ANDROID_EMBEDDED_URL_BASE_ASSET = "file:///android_asset/"
  private const val ANDROID_EMBEDDED_URL_BASE_RESOURCE = "file:///android_res/"

  /**
   * Create an embedded asset filename in `file:///android_res/` or `file:///android_asset/` format
   */
  fun createEmbeddedFilenameForAsset(asset: AssetEntity): String? {
    val fileExtension = asset.getFileExtension()
    if (asset.embeddedAssetFilename != null) {
      return "${ANDROID_EMBEDDED_URL_BASE_ASSET}${asset.embeddedAssetFilename}$fileExtension"
    }
    if (asset.resourcesFolder != null && asset.resourcesFilename != null) {
      return "${ANDROID_EMBEDDED_URL_BASE_RESOURCE}${asset.resourcesFolder}${getDrawableSuffix(asset.scale)}/${asset.resourcesFilename}$fileExtension"
    }
    return null
  }

  /**
   * Return whether the filePath is an Android asset or resource
   */
  fun isAndroidResourceAsset(filePath: String): Boolean {
    return filePath.startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE) ||
      filePath.startsWith(ANDROID_EMBEDDED_URL_BASE_ASSET)
  }

  /**
   * Check a given file name is existed in Android embedded assets
   */
  fun isAndroidAssetExisted(context: Context, name: String) = try {
    context.assets.open(name).close()
    true
  } catch (e: IOException) {
    false
  }

  /**
   * Check a given resource folder and filename is existed in Android embedded resources
   */
  @SuppressLint("DiscouragedApi")
  fun isAndroidResourceExisted(context: Context, resourceFolder: String, resourceFilename: String): Boolean {
    return context.resources.getIdentifier(
      resourceFilename,
      resourceFolder,
      context.packageName
    ) != 0
  }

  /**
   * Check if given filePath matches and exists in the Android embedded assets or resources
   */
  fun isAndroidAssetOrResourceExisted(context: Context, filePath: String): Boolean {
    val (embeddedAssetFilename, resourceFolder, resourceFilename) = parseAndroidResponseAssetFromPath(filePath)
    return when {
      embeddedAssetFilename != null -> isAndroidAssetExisted(context, embeddedAssetFilename)
      resourceFolder != null && resourceFilename != null -> isAndroidResourceExisted(context, resourceFolder, resourceFilename)
      else -> {
        false
      }
    }
  }

  /**
   * Data structure for Android embedded asset and resource
   */
  data class AndroidResourceAsset(
    val embeddedAssetFilename: String?,
    val resourcesFolder: String?,
    val resourceFilename: String?
  )

  /**
   * Parse a file path and return as `AndroidResourceAsset`
   */
  fun parseAndroidResponseAssetFromPath(filePath: String): AndroidResourceAsset {
    if (filePath.startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
      val uri = filePath.toUri()
      val pathSegments = uri.pathSegments
      if (pathSegments.size < 3) {
        throw InvalidArgumentException("Invalid resource file path: $filePath")
      }
      // Strip any qualifiers after a dash, for example "drawable-xhdpi" becomes "drawable"
      val resourcesFolder = pathSegments[1].substringBefore('-')
      // Strip file extension for resource name
      val resourceFilename = pathSegments[2].substringBeforeLast('.', pathSegments[2])
      return AndroidResourceAsset(null, resourcesFolder, resourceFilename)
    }
    if (filePath.startsWith(ANDROID_EMBEDDED_URL_BASE_ASSET)) {
      val embeddedAssetFilename = filePath.substringAfterLast('/')
      return AndroidResourceAsset(embeddedAssetFilename, null, null)
    }
    return AndroidResourceAsset(null, null, null)
  }

  private fun getDrawableSuffix(scale: Float?): String {
    return when (scale) {
      0.75f -> "-ldpi"
      1f -> "-mdpi"
      1.5f -> "-hdpi"
      2f -> "-xhdpi"
      3f -> "-xxhdpi"
      4f -> "-xxxhdpi"
      else -> ""
    }
  }
}
