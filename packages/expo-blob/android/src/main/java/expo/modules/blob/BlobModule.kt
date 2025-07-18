package expo.modules.blob

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BlobModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoBlob")

        Class(Blob::class) {
            Constructor() { blobParts: List<BlobPart>, options: BlobOptionsBag? ->
                val type = options?.type ?: DEFAULT_TYPE
                val endings = options?.endings ?: EndingType.TRANSPARENT
                Blob(blobParts.internal(endings == EndingType.NATIVE), type)
            }

            Property("size") { blob: Blob ->
                blob.size
            }

            Property("type") { blob: Blob ->
                blob.type
            }

            Function("slice") { blob: Blob, start: Int?, end: Int?, contentType: String? ->
                var sliceStart: Int = start ?: 0
                var sliceEnd: Int = end ?: 0
                if (sliceStart < 0) {
                    sliceStart = blob.size + sliceStart
                }
                if (sliceEnd < 0) {
                    sliceEnd = blob.size + sliceEnd
                }
                blob.slice(sliceStart, sliceEnd, contentType ?: "")
            }

            AsyncFunction("bytes") { blob: Blob ->
                blob.text().toByteArray()
            }

            AsyncFunction("text") { blob: Blob ->
                blob.text()
            }

            Function("syncText") { blob: Blob ->
                blob.text()
            }
        }
    }
}
