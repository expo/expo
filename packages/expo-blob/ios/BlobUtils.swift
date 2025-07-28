import ExpoModulesCore

func proccessBlobParts(_ blobParts: [EitherOfThree<String, Blob, TypedArray>]?, endings: EndingType) -> [BlobPart] {
  return blobParts?.map { part in
    if let part: String = part.get() {
      let str = (endings == .native) ? toNativeNewlines(part) : part
      return .string(str)
    }
    if let part: Blob = part.get() {
      return .blob(part)
    }
    if let part: TypedArray = part.get() {
      let copiedData = Data(bytes: part.rawPointer, count: part.byteLength)
      return .data(copiedData)
    }
    return .string("")
  } ?? []
}

func toNativeNewlines(_ str: String) -> String {
  let nativeEnding = "\n"
  var s = str.replacingOccurrences(of: "\r\n", with: nativeEnding)
  s = s.replacingOccurrences(of: "\r", with: nativeEnding)
  return s
}
