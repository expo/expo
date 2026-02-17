/// Resolves a variant stream's URL relative to the main Playlist URL.
func resolveMediaUrl(pathLine: String, mainUrl: URL) -> URL? {
  let cleanedPath = pathLine.trimmingCharacters(in: .whitespacesAndNewlines)

  if let absoluteURL = URL(string: cleanedPath), absoluteURL.scheme != nil {
    return absoluteURL
  }

  return URL(string: cleanedPath, relativeTo: mainUrl)
}

// Based on the track URL and the main playlist URL generates a
// RFC 8216 - compliant <URI> https://datatracker.ietf.org/doc/html/rfc8216#section-4.3.4.2
// Which we use as the track id
func extractHlsTrackId(trackUrl: URL, mainUrl: URL) -> String {
  let mainBaseString = mainUrl.deletingLastPathComponent().absoluteString
  let trackString = trackUrl.absoluteString

  if trackString.hasPrefix(mainBaseString) {
    // mainUrl: "https://test.com/video/masterManifest.m3u8"
    // Track: "https://test.com/video/playlist/manifest1.m3u8"
    // Result: "playlist/manifest1.m3u8"
    return String(trackString.dropFirst(mainBaseString.count))
  }

  return trackString.trimmingCharacters(in: .whitespacesAndNewlines)
}
