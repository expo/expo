package expo.modules.medialibrary.next.objects.query

import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.types.Either
import expo.modules.medialibrary.next.objects.wrappers.MediaType

@OptIn(EitherType::class)
class MediaStoreQueryFormatter {
  companion object {
    fun parse(value: Either<MediaType, Int>): String {
      if (value.`is`(MediaType::class)) {
        return parse(value.get(MediaType::class))
      }
      return parse(value.get(Int::class))
    }

    fun parse(value: Int): String {
      return value.toString()
    }

    fun parse(value: MediaType): String {
      return value.toMediaStoreValue().toString()
    }
  }
}
