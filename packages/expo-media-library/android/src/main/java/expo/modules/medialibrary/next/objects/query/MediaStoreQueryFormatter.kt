package expo.modules.medialibrary.next.objects.query

import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.types.Either
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.records.AssetField
import kotlin.time.DurationUnit
import kotlin.time.toDuration

@OptIn(EitherType::class)
class MediaStoreQueryFormatter {
  companion object {
    fun parse(field: AssetField, value: Either<MediaType, Long>): String {
      if (value.`is`(MediaType::class)) {
        return parse(value.get(MediaType::class))
      }
      return parse(field, value.get(Long::class))
    }

    fun parse(field: AssetField, value: Long): String {
      if (field == AssetField.MODIFICATION_TIME) {
        return value.toDuration(DurationUnit.MILLISECONDS).inWholeSeconds.toString()
      }
      return value.toString()
    }

    fun parse(value: MediaType): String {
      return value.toMediaStoreValue().toString()
    }
  }
}
