package expo.modules.developmentclient.launcher.manifest

import android.util.Log
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import java.io.Reader
import java.lang.reflect.Type
import kotlin.reflect.full.declaredMemberProperties

/**
 * A representation of the android specific properties such as `primaryColor` or status bar configuration.
 * Note that this class doesn't contain fields which are also defined in the main section of `app.json`
 * and can be overridden by the [DevelopmentClientManifest.android] section, like [DevelopmentClientManifest.backgroundColor].
 * Those fields are combined during deserialization and the final value is written to the [DevelopmentClientManifest] object.
 */
class DevelopmentClientAndroidManifestSection

data class DevelopmentClientStatusBarSection(
  val barStyle: DevelopmentClientStatusBarStyle?,
  val backgroundColor: String?,
  val hidden: Boolean?,
  val translucent: Boolean?
)

data class DevelopmentClientManifest(
  val name: String,
  val slug: String,
  val bundleUrl: String,
  val hostUri: String,
  val mainModuleName: String,

  val orientation: DevelopmentClientOrientation?,

  val android: DevelopmentClientAndroidManifestSection?,

  val userInterfaceStyle: DevelopmentClientUserInterface?,
  val backgroundColor: String?,
  val primaryColor: String?,

  val androidStatusBar: DevelopmentClientStatusBarSection?
) {
  /**
   * Class which contains all fields that the user can override in the android section.
   */
  private data class DevelopmentClientOverriddenProperties(
    val userInterfaceStyle: DevelopmentClientUserInterface?,
    val backgroundColor: String?
  )

  private class DevelopmentClientManifestDeserializer : JsonDeserializer<DevelopmentClientManifest> {
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): DevelopmentClientManifest {
      with(Gson()) {
        val jsonObject = json.asJsonObject
        val baseManifest = fromJson(jsonObject, DevelopmentClientManifest::class.java)
        if (jsonObject.has("android")) {
          val overriddenProperties = fromJson(jsonObject.getAsJsonObject("android"), DevelopmentClientOverriddenProperties::class.java)
          applyOverriddenProperties(baseManifest, overriddenProperties)
        }
        return baseManifest
      }
    }

    private fun applyOverriddenProperties(baseManifest: DevelopmentClientManifest, overriddenProperties: DevelopmentClientOverriddenProperties) {
      for (field in DevelopmentClientOverriddenProperties::class.declaredMemberProperties) {
        try {
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
    fun fromJson(jsonReader: Reader): DevelopmentClientManifest {
      return GsonBuilder()
        .registerTypeAdapter(DevelopmentClientManifest::class.java, DevelopmentClientManifestDeserializer())
        .create()
        .fromJson(jsonReader, DevelopmentClientManifest::class.java)
    }
  }
}

