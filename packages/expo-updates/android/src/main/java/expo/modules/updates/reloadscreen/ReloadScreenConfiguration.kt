package expo.modules.updates.reloadscreen

import android.net.Uri
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import androidx.core.graphics.toColorInt

data class ReloadScreenOptions(
  @Field val backgroundColor: String?,
  @Field val image: ReloadScreenImageSource?,
  @Field val imageResizeMode: ImageResizeMode?,
  @Field val imageFullScreen: Boolean?,
  @Field val fade: Boolean?,
  @Field val spinner: SpinnerOptions?
) : Record

data class ReloadScreenImageSource(
  @Field val url: Uri? = null,
  @Field val width: Double? = null,
  @Field val height: Double? = null,
  @Field val scale: Double? = null
) : Record

data class SpinnerOptions(
  @Field val enabled: Boolean? = null,
  @Field val color: String? = null,
  @Field val size: SpinnerSize? = null
) : Record

data class ReloadScreenConfiguration(
  val backgroundColor: Int,
  val image: ReloadScreenImageSource?,
  val imageResizeMode: ImageResizeMode,
  val imageFullScreen: Boolean,
  val fade: Boolean,
  val spinner: SpinnerConfiguration
) {
  companion object {
    fun fromOptions(options: ReloadScreenOptions?): ReloadScreenConfiguration {
      val hasImage = options?.image != null

      return ReloadScreenConfiguration(
        backgroundColor = options?.backgroundColor?.toColorInt() ?: "#ffffff".toColorInt(),
        image = options?.image,
        imageResizeMode = options?.imageResizeMode ?: ImageResizeMode.CONTAIN,
        imageFullScreen = options?.imageFullScreen ?: false,
        fade = options?.fade ?: false,
        spinner = SpinnerConfiguration(
          enabled = options?.spinner?.enabled ?: !hasImage,
          color = options?.spinner?.color?.toColorInt() ?: "#007aff".toColorInt(),
          size = options?.spinner?.size ?: SpinnerSize.MEDIUM
        )
      )
    }
  }
}

data class SpinnerConfiguration(
  val enabled: Boolean,
  val color: Int,
  val size: SpinnerSize
)

enum class ImageResizeMode(val value: String) : Enumerable {
  CONTAIN("contain"),
  COVER("cover"),
  CENTER("center"),
  STRETCH("stretch")
}

enum class SpinnerSize(val value: String) : Enumerable {
  SMALL("small"),
  MEDIUM("medium"),
  LARGE("large");

  fun getSize(): Int = when (this) {
    SMALL -> 24
    MEDIUM -> 48
    LARGE -> 72
  }
}
