package expo.modules.blob

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.max
import kotlin.math.min

class BlobModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlob")

    Class(Blob::class) {
      Constructor { blobParts: List<BlobPart>?, options: BlobOptionsBag? ->
        makeBlob(blobParts, options)
      }

      Property("size") { blob: Blob ->
        blob.size
      }

      Property("type") { blob: Blob ->
        blob.type
      }

      Function("slice") { blob: Blob, start: Int?, end: Int?, contentType: String? ->
        var sliceStart: Int = start ?: 0
        var sliceEnd: Int = end ?: blob.size
        if (sliceStart < 0) {
          sliceStart = max(blob.size + sliceStart, 0)
        } else {
          sliceStart = min(sliceStart, blob.size)
        }
        if (sliceEnd < 0) {
          sliceEnd = max(blob.size + sliceEnd, 0)
        } else {
          sliceEnd = min(sliceEnd, blob.size)
        }
        blob.slice(sliceStart, sliceEnd, contentType ?: "")
      }

      AsyncFunction("bytes") { blob: Blob ->
        blob.bytes()
      }

      AsyncFunction("text") { blob: Blob ->
        blob.bytes().decodeToString()
      }
    }
  }
}
