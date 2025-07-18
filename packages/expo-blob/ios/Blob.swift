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
  
  func slice(start: Int = 0, end: Int? = nil, contentType: String? = nil) -> Blob {
    let blobSize = self.size
    var relativeStart = start
  
    if relativeStart < 0 {
      relativeStart = max(blobSize + relativeStart, 0)
    } else {
      relativeStart = min(relativeStart, blobSize - 1)
    }

    var relativeEnd = (end ?? blobSize) - 1
    if relativeEnd < 0 {
      relativeEnd = max(blobSize + relativeEnd - 1, 0)
    } else {
      relativeEnd = min(relativeEnd, blobSize - 1)
    }

    let span = max(relativeEnd - relativeStart, 0)
    if span == 0 {
      return Blob(blobParts: [], options: BlobOptions(type: type, endings: self.options.endings))
    }

    var dataSlice: [BlobPart] = []
    var currentPos = 0
    var remaining = span + 1

    for part in blobParts {
      let partSize = part.size()
      if currentPos + partSize <= relativeStart {
        currentPos += partSize
        continue
      }
      if remaining <= 0 {
        break
      }
      let partStart = max(0, relativeStart - currentPos)
      let partEnd = min(partSize, partStart + remaining)
      let length = partEnd - partStart
      if length <= 0 {
        currentPos += partSize
        continue
      }

      switch part {
        case .string(let str):
          let utf8 = Array(str.utf8)
          let subUtf8 = Array(utf8[partStart..<partStart+length])
          if let subStr = String(bytes: subUtf8, encoding: .utf8) {
            dataSlice.append(.string(subStr))
          }
          
        case .data(let data):
          let subData = data.subdata(in: partStart..<partStart+length)
          dataSlice.append(.data(subData))
          
        case .typedArray(let typedArray):
          if partStart == 0 && length == typedArray.byteLength {
            dataSlice.append(.typedArray(typedArray))
          } else {
            let data = Data(bytes: typedArray.rawPointer, count: typedArray.byteLength)
            let subData = data.subdata(in: partStart..<partStart+length)
            dataSlice.append(.data(subData))
          }
        
        case .blob(let blob):
          let subBlob = blob.slice(start: partStart, end: partStart + length)
          dataSlice.append(.blob(subBlob))
      }
        currentPos += partSize
        remaining -= length
    }
  
    return Blob(blobParts: dataSlice, options: BlobOptions(type: type, endings: self.options.endings))
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

