import Foundation
import ExpoModulesCore

public class ExpoBlob: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlob")

    Class(Blob.self) {
      Constructor { (blobParts: [EitherOfThree<String, Blob, TypedArray>]?, options: BlobOptions?) in
        let endings = options?.endings ?? .transparent
        let blobPartsProcessed = processBlobParts(blobParts, endings: endings)
        return Blob(blobParts: blobPartsProcessed, options: options ?? BlobOptions())
      }

      Property("size") { (blob: Blob) in
        blob.size
      }

      Property("type") { (blob: Blob) in
        blob.type
      }

      Function("slice") { (blob: Blob, start: Int?, end: Int?, contentType: String?) in
        let blobSize = blob.size
        let safeStart = start ?? 0
        let safeEnd = end ?? blobSize

        let relativeStart = safeStart < 0 ? max(blobSize + safeStart, 0) : min(safeStart, blobSize)
        let relativeEnd = safeEnd < 0 ? max(blobSize + safeEnd, 0) : min(safeEnd, blobSize)

        return blob.slice(start: relativeStart, end: relativeEnd, contentType: contentType ?? "")
      }

      AsyncFunction("text") { (blob: Blob) async -> String in
        await blob.text()
      }

      AsyncFunction("bytes") { (blob: Blob) async -> Data in
        let bytes = await blob.bytes()
        return Data(bytes)
      }
    }
  }
}
