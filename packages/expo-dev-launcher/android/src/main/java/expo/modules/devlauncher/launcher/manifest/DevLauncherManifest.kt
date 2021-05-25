package expo.modules.devlauncher.launcher.manifest

import android.util.Log
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import java.io.Reader
import java.lang.reflect.Type
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.jvm.isAccessible

/**
 * A representation of the android specific properties such as `primaryColor` or status bar configuration.
 * Note that this class doesn't contain fields which are also defined in the main section of `app.json`
 * and can be overridden by the [DevLauncherManifest.android] section, like [DevLauncherManifest.backgroundColor].
 * Those fields are combined during deserialization and the final value is written to the [DevLauncherManifest] object.
 */
class DevLauncherAndroidManifestSection

data class DevLauncherStatusBarSection(
  val barStyle: DevLauncherStatusBarStyle?,
  val backgroundColor: String?,
  val hidden: Boolean?,
  val translucent: Boolean?
)

data class DevLauncherManifestDeveloperSection(
  val tool: String?
)

data class DevLauncherManifest(
  val name: String,
  val slug: String,
  val bundleUrl: String,
  val hostUri: String,
  val mainModuleName: String,
  val version: String,

  val orientation: DevLauncherOrientation?,

  val android: DevLauncherAndroidManifestSection?,

  val developer: DevLauncherManifestDeveloperSection?,

  val userInterfaceStyle: DevLauncherUserInterface?,
  val backgroundColor: String?,
  val primaryColor: String?,

  val androidStatusBar: DevLauncherStatusBarSection?
) {
  var rawData: String? = null
    private set

  fun isUsingDeveloperTool(): Boolean {
    return this.developer?.tool != null
  }

  /**
   * Class which contains all fields that the user can override in the android section.
   */
  private data class DevLauncherOverriddenProperties(
    val userInterfaceStyle: DevLauncherUserInterface?,
    val backgroundColor: String?
  )

  private class DevLauncherManifestDeserializer : JsonDeserializer<DevLauncherManifest> {

    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): DevLauncherManifest {
      with(Gson()) {
        val jsonObject = json.asJsonObject
        val baseManifest = fromJson(jsonObject, DevLauncherManifest::class.java)
        if (jsonObject.has("android")) {
          val overriddenProperties = fromJson(jsonObject.getAsJsonObject("android"), DevLauncherOverriddenProperties::class.java)
          applyOverriddenProperties(baseManifest, overriddenProperties)
        }
        return baseManifest
      }
    }

    private fun applyOverriddenProperties(baseManifest: DevLauncherManifest, overriddenProperties: DevLauncherOverriddenProperties) {
      for (field in DevLauncherOverriddenProperties::class.declaredMemberProperties) {
        try {
          // It shouldn't be needed, but when we try to run this code on JVM (unit test)
          // we get `IllegalAccessException`.
          field.isAccessible = true
          val overriddenValue = field.get(overriddenProperties) ?: continue
          val baseField = baseManifest::class.java.getDeclaredField(field.name)
          baseField.isAccessible = true
          baseField.set(baseManifest, overriddenValue)
        } catch (e: Exception) {
          Log.w("DevelopmentClient", "Could't apply overridden property ${field.name}", e)
        }
      }
    }
  }

  companion object {
    fun fromJson(jsonReader: Reader): DevLauncherManifest {
      val manifestString = jsonReader.readText()
      return GsonBuilder()
        .registerTypeAdapter(DevLauncherManifest::class.java, DevLauncherManifestDeserializer())
        .create()
        .fromJson(manifestString, DevLauncherManifest::class.java)
        .apply {
          rawData = manifestString
        }
    }
  }
}

