package expo.modules.video.utils

import android.content.Context

const val EXPO_VIDEO_ICON_PREFIX = "expo_video_icon_"

fun getIconNameResId(context: Context, iconName: String): Int? {
  var resId: Int

  val packageName = context.packageName

  val baseResourceName = filenameToBasename(iconName)

  val resourceNameWithExpoVideoPlugin = "${EXPO_VIDEO_ICON_PREFIX}${baseResourceName}"

  resId = context.resources.getIdentifier(
    resourceNameWithExpoVideoPlugin,
    "drawable",
    packageName
  )

  if(resId == 0){
    resId = context.resources.getIdentifier(
      baseResourceName,
      "drawable",
      packageName
    )
  }

  if(resId == 0){
    return null
  }

  return resId
}

private fun filenameToBasename(filename: String): String {
  if (!filename.contains(".")) {
    return filename
  }

  return filename.substring(0, filename.lastIndexOf('.'))
}