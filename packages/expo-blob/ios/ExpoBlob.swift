import Foundation
import ExpoModulesCore

public class ExpoBlob: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlob")

    Class(Blob.self) {
      Constructor { (blobParts: [EitherOfThree<String, Blob, TypedArray>]?, options: BlobOptions?) in
        let blobPartsProcessed: [BlobPart]? = blobParts?.map { part in
          if let part: String = part.get() {
            return .string(part)
          } else if let part: Blob = part.get() {
            return .blob(part)
          } else if let part: TypedArray = part.get() {
            return .typedArray(part)
          }
          return .string("")
        }
        return Blob(blobParts: blobPartsProcessed ?? [], options: options ?? BlobOptions())
      }
      
      Property("size") { (blob: Blob) in
        blob.size
      }
      
      Property("type") { (blob: Blob) in
        blob.type
      }
      
      Function("slice") { (blob: Blob, start: Int?, end: Int?, contentType: String?) in
        blob.slice(start: start ?? 0, end: end, contentType: contentType ?? "")
      }
      
      Function("syncText") { (blob: Blob) in
        blob.text()
      }
      
      AsyncFunction("text") { (blob: Blob) in
        blob.text()
      }
      
      AsyncFunction("bytes") { (blob: Blob) async in
        await blob.bytes()
      }
    }
  }
}
