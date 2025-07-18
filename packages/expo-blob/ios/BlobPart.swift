import ExpoModulesCore

enum BlobPart {
  case string(String)
  case blob(Blob)
  case data(Data)
  case typedArray(TypedArray)
}

extension BlobPart {
  func text() -> String {
    switch self {
      case .string(let str):
        return str
      case .data(let data):
        return String(decoding: data, as: UTF8.self)
      case .blob(let blob):
        return blob.text()
      case .typedArray(let typedArray):
        return String(decoding: Data(bytes: typedArray.rawPointer, count: typedArray.byteLength), as: UTF8.self)
    }
  }
  
  func size() -> Int {
    switch self {
    case .string(let str):
      return str.lengthOfBytes(using: .utf8)
    case .data(let data):
      return data.count
    case .blob(let blob):
      return blob.size
    case .typedArray(let typedArray):
      return typedArray.byteLength
    }
  }
  
  func bytes() async -> [UInt8] {
    switch self {
      case .string(let str):
        return [UInt8](str.utf8)
      case .data(let data):
        return [UInt8](data)
      case .blob(let blob):
        return await blob.bytes()
      case .typedArray(let typedArray):
        let data = Data(bytes: typedArray.rawPointer, count: typedArray.byteLength)
        return [UInt8](data)
    }
  }
}
