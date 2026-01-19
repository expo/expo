struct ContentDetails {
  var uri: URL?
  var type: ExpoContentType?
  var size: Int?
  var mimeType: String?
  var originalName: String?
}

internal func resolveUrlContentDetails(url: URL) async throws -> ContentDetails {
  let request = URLRequest(url: url)

  // Allows us to get just the http response header without unnecessarily downloading data.
  // This may seem like a weird way of doing this, but:
  // 1. Doing:
  //   var request = URLRequest(url: url)
  //   request.httpMethod = "HEAD"
  // Does not work with some sources that require redirects. For example: lorem picsum urls - https://picsum.photos/id/237/200/300
  // 2. We could use "GET" http method with a URLSessionTaskDelegate, which cancels after receiving the response, but
  //    the delegate doesn't work with the async-await syntax https://forums.swift.org/t/how-to-call-urlsession-cache-handler-delegate-method-in-async-await/66473/6.
  //    Using the old completion-based API works, but would require a lot of boilerplate.
  let (_, response) = try await URLSession.shared.bytes(for: request)

  guard let httpResponse = response as? HTTPURLResponse else {
    throw FailedToFetchURLContentDetailsException((url, "Invalid Response \(response)"))
  }

  let mimeType = httpResponse.mimeType ?? "text/plain"
  let expoContentType = ExpoContentType.from(mimeType: mimeType)
  var contentSize = Int(httpResponse.expectedContentLength)

  if let contentLengthString = httpResponse.allHeaderFields["Content-Length"] as? String, let contentLength = Int(contentLengthString) {
    contentSize = contentLength
  }

  return ContentDetails(
    uri: httpResponse.url ?? url,
    type: expoContentType,
    size: contentSize,
    mimeType: mimeType,
    originalName: httpResponse.suggestedFilename
  )
}
