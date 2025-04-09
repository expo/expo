package expo.modules.apploader

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log

object AppLoaderProvider {
  private val loaders: MutableMap<String, HeadlessAppLoader> = HashMap()

  @JvmStatic
  fun getLoader(name: String, context: Context): HeadlessAppLoader? {
    if (!loaders.containsKey(name)) {
      try {
        createLoader(name, context)
      } catch (e: Exception) {
        Log.e("Expo", "Cannot initialize app loader. " + e.message)
        e.printStackTrace()
        return null
      }
    }
    return loaders[name]
  }

  private fun createLoader(name: String, context: Context) {
    val loaderClass: Class<out HeadlessAppLoader>
    try {
      val loaderClassName = context.packageManager.getApplicationInfo(
        context.packageName,
        PackageManager.GET_META_DATA
      ).metaData.getString(
        "org.unimodules.core.AppLoader#$name"
      ) ?: throw IllegalStateException("Unable to instantiate AppLoader!")

      loaderClass = Class.forName(loaderClassName) as Class<out HeadlessAppLoader>
      loaders[name] = loaderClass
        .getDeclaredConstructor(Context::class.java)
        .newInstance(context) as HeadlessAppLoader
    } catch (e: PackageManager.NameNotFoundException) {
      throw IllegalStateException("Unable to instantiate AppLoader!", e)
    }
  }

  fun interface Callback {
    fun onComplete(success: Boolean, exception: Exception?)
  }
}
