import Foundation
import ExpoModulesCore

public class Blob: SharedObject {
  var blobParts: [BlobPart]
  var options: BlobOptions

  init(blobParts: [BlobPart]?, options: BlobOptions?) {
    self.blobParts = blobParts ?? []
    self.options = options ?? BlobOptions()
  }

  var size: Int {
    return blobParts.reduce(0) { $0 + $1.size() }
  }

  var type: String {
    return options.type
  }

  func slice(start: Int, end: Int, contentType: String) -> Blob {
    let span = max(end - start, 0)
    let typeString = contentType

    if span == 0 {
      return Blob(blobParts: [], options: BlobOptions(type: typeString, endings: self.options.endings))
    }

    var dataSlice: [BlobPart] = []
    var currentPos = 0
    var remaining = span

    for part in blobParts {
      let partSize = part.size()

      if currentPos + partSize <= start {
        currentPos += partSize
        continue
      }

      if remaining <= 0 {
        break
      }

      let partStart = max(0, start - currentPos)
      let partEnd = min(partSize, partStart + remaining)
      let length = partEnd - partStart

      if length <= 0 {
        currentPos += partSize
        continue
      }

      if partStart == 0 && partEnd == partSize {
        dataSlice.append(part)
      } else {
        switch part {
          case .string(let str):
            let utf8 = Array(str.utf8)
            let subUtf8 = Array(utf8[partStart..<partEnd])
            if let subStr = String(bytes: subUtf8, encoding: .utf8) {
              dataSlice.append(.string(subStr))
            }
          case .data(let data):
            let subData = data.subdata(in: partStart..<partEnd)
            dataSlice.append(.data(subData))
          case .blob(let blob):
            let subBlob = blob.slice(start: partStart, end: partEnd, contentType: blob.type)
            dataSlice.append(.blob(subBlob))
        }
      }

      currentPos += partSize
      remaining -= length
    }

    return Blob(blobParts: dataSlice, options: BlobOptions(type: typeString, endings: self.options.endings))
  }

  func text() -> String {
    return blobParts.reduce("") { $0 + $1.text() }
  }

  func bytes() async -> [UInt8] {
    var result: [UInt8] = []
    for part in blobParts {
      result.append(contentsOf: await part.bytes())
    }
    return result
  }
}

enum EndingType: String, Enumerable {
  case transparent = "transparent"
  case native = "native"
}

struct BlobOptions: Record {
  @Field
  var type: String = ""
  @Field
  var endings: EndingType = .transparent
}
