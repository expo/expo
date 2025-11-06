package expo.modules.contacts.next.extensions

import android.content.ContentProviderResult
import expo.modules.contacts.next.UnableToExtractIdFromUriException

fun Array<ContentProviderResult>.extractId(): String {
  val uri = requireNotNull(this[0].uri)
  return uri.lastPathSegment
    ?: throw UnableToExtractIdFromUriException(uri)
}
