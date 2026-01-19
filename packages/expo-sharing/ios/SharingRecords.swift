import ExpoModulesCore

internal final class FilePermissionException: Exception {
  override var reason: String {
    "You don't have access to the provided file"
  }
}

internal final class MissingCurrentViewControllerException: Exception {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal final class UnsupportedTypeException: Exception {
  override var reason: String {
    "Could not share file since there were no apps registered for its type"
  }
}

internal final class FilePermissionModuleException: Exception {
  override var reason: String {
    "File permission module not found"
  }
}

enum ExpoShareType: String, Enumerable {
  case text
  case url
  case audio
  case image
  case video
  case file

  var isFileOrMedia: Bool {
    switch self {
    case .file, .audio, .image, .video:
      return true
    default:
      return false
    }
  }
}

enum ExpoContentType: String, Enumerable {
  case text
  case audio
  case image
  case video
  case file
  case website

  static func from(mimeType: String) -> ExpoContentType {
    let lowerMime = mimeType.lowercased()

    if lowerMime.contains("text/html") || lowerMime.contains("application/xhtml+xml") {
      return .website
    }

    if lowerMime.starts(with: "image") { return .image }
    if lowerMime.starts(with: "video") { return .video }
    if lowerMime.starts(with: "audio") { return .audio }
    if lowerMime.starts(with: "text") { return .text }

    return .file
  }
}

struct ExpoSharePayload: Record {
  @Field var value: String = ""
  @Field var shareType: ExpoShareType = .text
  @Field var mimeType: String = "text/plain"

  init() {}

  init(from payload: SharePayload) {
    self.shareType = ExpoShareType(rawValue: payload.type.rawValue) ?? .text
    self.value = payload.value
    self.mimeType = payload.mimeType
  }
}

// swiftlint:disable redundant_optional_initialization
struct ExpoResolvedSharePayload: Record {
  @Field var value: String = ""
  @Field var shareType: ExpoShareType = .text
  @Field var mimeType: String = "text/plain"

  @Field var contentUri: URL? = nil
  @Field var contentType: ExpoContentType? = nil
  @Field var contentSize: Int? = nil
  @Field var contentMimeType: String? = nil
  @Field var originalName: String? = nil

  static func resolve(from payload: SharePayload) async throws -> Self {
    let expoSharePayload = ExpoSharePayload(from: payload)

    if payload.type == .url, let url = URL(string: payload.value) {
      let contentDetails = try await resolveUrlContentDetails(url: url)
      return Self.init(
        // Base payload
        value: expoSharePayload.value,
        shareType: expoSharePayload.shareType,
        mimeType: expoSharePayload.mimeType,
        // Resolved data
        contentUri: contentDetails.uri,
        contentType: contentDetails.type,
        contentSize: contentDetails.size,
        contentMimeType: contentDetails.mimeType,
        originalName: contentDetails.originalName
      )
    }

    if expoSharePayload.shareType.isFileOrMedia {
      let contentType: ExpoContentType = ExpoContentType(rawValue: payload.type.rawValue) ?? .file
      let contentUri = URL(string: payload.value)

      return Self.init(
        value: expoSharePayload.value,
        shareType: expoSharePayload.shareType,
        mimeType: expoSharePayload.mimeType,
        contentUri: contentUri,
        contentType: contentType,
        contentSize: payload.metadata?.size,
        contentMimeType: payload.mimeType,
        originalName: payload.metadata?.originalName
      )
    }

    // text/fallback for unexpected types
    return Self.init(
      value: expoSharePayload.value,
      shareType: expoSharePayload.shareType,
      mimeType: expoSharePayload.mimeType
    )
  }
}
// swiftlint:enable redundant_optional_initialization
