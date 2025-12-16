extension FourCharCode {
  func toCorrectedString() -> String {
    switch toString() {
    case "avc1": // H264 videos
      return "avc"
    case "hev1": // H265 videos
      return "hevc"
    default:
      return self.toString()
    }
  }

  func toString() -> String {
    let bytes: [CChar] = [
      CChar((self >> 24) & 0xff),
      CChar((self >> 16) & 0xff),
      CChar((self >> 8) & 0xff),
      CChar(self & 0xff),
      0
    ]
    let result = String(cString: bytes)
    let characterSet = CharacterSet.whitespaces
    return result.trimmingCharacters(in: characterSet)
  }
}
