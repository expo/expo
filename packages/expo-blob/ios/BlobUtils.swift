import ExpoModulesCore

func processBlobParts(_ blobParts: [EitherOfThree<String, Blob, TypedArray>]?, endings: EndingType) -> [BlobPart] {
  return blobParts?.map { part in
    if let part: String = part.get() {
      let str = (endings == .native) ? toNativeNewlines(part) : part
      return .string(str)
    }
    if let part: Blob = part.get() {
      return .blob(part)
    }
    if let part: TypedArray = part.get() {
      // TODO: Consider optimization to avoid copying TypedArray data while preventing early GC
      // This would require careful lifetime management and architectural changes
      let copiedData = Data(bytes: part.rawPointer, count: part.byteLength)
      return .data(copiedData)
    }
    return .string("")
  } ?? []
}

func toNativeNewlines(_ str: String) -> String {
  var result = ""
  let nativeEnding = "\n"

  for char in str {
    if char == "\r\n" {
      result.append(nativeEnding)
    } else if char == "\r" {
      result.append(nativeEnding)
    } else if char == "\n" {
      result.append(char)
    } else {
      result.append(char)
    }
  }

  return result
}
