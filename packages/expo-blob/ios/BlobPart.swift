import ExpoModulesCore

enum BlobPart {
  case string(String)
  case blob(Blob)
  case data(Data)
}

extension BlobPart {
  func size() -> Int {
    switch self {
    case .string(let str):
      return str.lengthOfBytes(using: .utf8)
    case .data(let data):
      return data.count
    case .blob(let blob):
      return blob.size
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
    }
  }
}
func toNativeNewlines(_ str: String) -> String {
    let nativeEnding = "\n"
    var s = str.replacingOccurrences(of: "\r\n", with: nativeEnding)
    s = s.replacingOccurrences(of: "\r", with: nativeEnding)
    return s
}
