import ExpoModulesCore

@Union
enum BlobPartInput {
  case string(String)
  case blob(Blob)
  case typedArray(TypedArray)
}

func processBlobParts(_ blobParts: [BlobPartInput]?, endings: EndingType) -> [BlobPart] {
  return blobParts?.map { part in
    switch part {
    case .string(let str):
      return .string((endings == .native) ? toNativeNewlines(str) : str)
    case .blob(let blob):
      return .blob(blob)
    case .typedArray(let typedArray):
      // TODO: Consider optimization to avoid copying TypedArray data while preventing early GC
      // This would require careful lifetime management and architectural changes
      let copiedData = Data(bytes: typedArray.rawPointer, count: typedArray.byteLength)
      return .data(copiedData)
    }
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
