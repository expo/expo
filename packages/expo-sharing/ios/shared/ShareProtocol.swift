import Foundation

struct SharePayload: Codable {
  let type: ShareType
  let value: String
  let mimeType: String
  let metadata: ShareMetadata?
}

struct ShareMetadata: Codable {
  let originalName: String?
  let size: Int?
}

enum ShareType: String, Codable {
  case text
  case url
  case audio
  case image
  case video
  case file
}
