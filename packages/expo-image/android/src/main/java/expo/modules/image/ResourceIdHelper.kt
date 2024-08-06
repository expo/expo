package expo.modules.image

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import java.util.*

object ResourceIdHelper {
  private val idMap = mutableMapOf<String, Int>()

  @SuppressLint("DiscouragedApi")
  private fun getResourceRawId(context: Context, name: String): Int {
    if (name.isEmpty()) {
      return -1
    }

    val normalizedName = name.lowercase(Locale.ROOT).replace("-", "_")
    synchronized(this) {
      val id = idMap[normalizedName]
      if (id != null) {
        return id
      }

      return context
        .resources
        .getIdentifier(normalizedName, "raw", context.packageName)
        .also {
          idMap[normalizedName] = it
        }
    }
  }

  fun getResourceUri(context: Context, name: String): Uri? {
    val drawableUri = ResourceDrawableIdHelper.instance.getResourceDrawableUri(context, name)
    if (drawableUri != Uri.EMPTY) {
      return drawableUri
    }

    val resId = getResourceRawId(context, name)
    return if (resId > 0) {
      Uri.Builder().scheme("res").path(resId.toString()).build()
    } else {
      null
    }
  }
}
