import ExpoModulesCore
import Foundation

// `@unchecked Sendable`: the `@JS(.concurrent)` members send the blob off the JavaScript thread, which
// Swift 6 mode allows only for a `Sendable` shared object. Its parts and options don't change after `init`.
@SharedObject
internal final class Blob: SharedObject, @unchecked Sendable {
  let blobParts: [BlobPart]
  let options: BlobOptions

  init(parts: [BlobPart], options: BlobOptions) {
    self.blobParts = parts
    self.options = options
  }

  @JS
  init(blobParts: [BlobPartInput]?, options: BlobOptions?) {
    let options = options ?? BlobOptions()
    self.blobParts = processBlobParts(blobParts, endings: options.endings)
    self.options = options
  }

  // `size` and `type` are `nonisolated` so the native helpers below can read them off the JavaScript thread.
  @JS
  nonisolated var size: Int {
    return blobParts.reduce(0) { $0 + $1.size() }
  }

  @JS
  nonisolated var type: String {
    return options.type
  }

  override func getAdditionalMemoryPressure() -> Int {
    return size
  }

  @JS
  func slice(start: Int? = nil, end: Int? = nil, contentType: String? = nil) -> Blob {
    let blobSize = size
    let safeStart = start ?? 0
    let safeEnd = end ?? blobSize

    let relativeStart = safeStart < 0 ? max(blobSize + safeStart, 0) : min(safeStart, blobSize)
    let relativeEnd = safeEnd < 0 ? max(blobSize + safeEnd, 0) : min(safeEnd, blobSize)

    return slice(from: relativeStart, to: relativeEnd, contentType: contentType ?? "")
  }

  func slice(from start: Int, to end: Int, contentType: String) -> Blob {
    let span = max(end - start, 0)
    let typeString = contentType

    if span == 0 {
      return Blob(parts: [], options: BlobOptions(type: typeString, endings: self.options.endings))
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
          dataSlice.append(.data(Data(subUtf8)))
        case .data(let data):
          let subData = data.subdata(in: partStart..<partEnd)
          dataSlice.append(.data(subData))
        case .blob(let blob):
          let subBlob = blob.slice(from: partStart, to: partEnd, contentType: blob.type)
          dataSlice.append(.blob(subBlob))
        }
      }

      currentPos += partSize
      remaining -= length
    }

    return Blob(parts: dataSlice, options: BlobOptions(type: typeString, endings: self.options.endings))
  }

  @JS(.concurrent)
  func text() async -> String {
    let allBytes = await self.bytes()
    let data = Data(allBytes)
    // swiftlint:disable:next optional_data_string_conversion - we need a fallback mechanism to handle invalid UTF-8 sequences properly.
    return String(data: data, encoding: .utf8) ?? String(decoding: allBytes, as: UTF8.self)
  }

  @JS("bytes", .concurrent)
  func bytesData() async -> Data {
    return Data(await bytes())
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
  case transparent
  case native
}

@Record
struct BlobOptions {
  var type: String = ""
  var endings: EndingType = .transparent
}
