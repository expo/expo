import Foundation
import Network

final class SegmentBaseDASHToHLSHelper {
  var onError: ((Error) -> Void)?

  private let mpdURL: URL
  private let headers: [String: String]?
  private let session: URLSession
  private let serverQueue = DispatchQueue(label: "expo.video.segment-base-dash.server")
  private let lock = NSLock()

  private var listener: NWListener?
  private var serverPort: UInt16 = 0
  private var playlistContent: [String: String] = [:]
  private var hasPreparedPlaylists = false

  var masterPlaylistURL: URL {
    URL(string: "http://127.0.0.1:\(serverPort)/master.m3u8")!
  }

  init(mpdURL: URL, headers: [String: String]?) {
    self.mpdURL = mpdURL
    self.headers = headers
    self.session = URLSession(configuration: .default)
    startServer()
  }

  deinit {
    listener?.cancel()
    session.invalidateAndCancel()
  }

  func preparePlaylists() async throws {
    let alreadyPrepared = withLock {
      hasPreparedPlaylists
    }

    if alreadyPrepared {
      return
    }

    do {
      let manifest = try await fetchManifest()
      let playlists = try await buildPlaylistContent(manifest: manifest)

      withLock {
        playlistContent = playlists
        hasPreparedPlaylists = true
      }
    } catch {
      onError?(error)
      throw error
    }
  }

  private func withLock<T>(_ body: () -> T) -> T {
    lock.lock()
    defer {
      lock.unlock()
    }
    return body()
  }

  private func startServer() {
    let readySemaphore = DispatchSemaphore(value: 0)
    var assignedPort: UInt16 = 0

    do {
      let params = NWParameters.tcp
      params.allowLocalEndpointReuse = true
      let listener = try NWListener(using: params, on: .any)
      self.listener = listener

      listener.stateUpdateHandler = { state in
        switch state {
        case .ready:
          if let port = listener.port {
            assignedPort = port.rawValue
          }
          readySemaphore.signal()
        case .failed:
          readySemaphore.signal()
        default:
          break
        }
      }
      listener.newConnectionHandler = { [weak self] connection in
        self?.handleConnection(connection)
      }
      listener.start(queue: serverQueue)
    } catch {
      onError?(error)
      readySemaphore.signal()
    }

    _ = readySemaphore.wait(timeout: .now() + 2)
    serverPort = assignedPort
  }

  private func handleConnection(_ connection: NWConnection) {
    connection.start(queue: serverQueue)
    connection.receive(minimumIncompleteLength: 1, maximumLength: 8192) { [weak self] data, _, _, error in
      guard let self, let data, error == nil else {
        connection.cancel()
        return
      }

      let request = String(data: data, encoding: .utf8) ?? ""
      let path = parseRequestPath(request)
      let content = withLock {
        self.playlistContent[path]
      }

      let response: Data
      if let content {
        let body = Data(content.utf8)
        let header = "HTTP/1.1 200 OK\r\n" +
          "Content-Type: application/vnd.apple.mpegurl\r\n" +
          "Content-Length: \(body.count)\r\n" +
          "Cache-Control: no-cache, no-store\r\n" +
          "Connection: close\r\n" +
          "Access-Control-Allow-Origin: *\r\n\r\n"
        response = Data(header.utf8) + body
      } else {
        let body = Data("Not Found".utf8)
        let header = "HTTP/1.1 404 Not Found\r\n" +
          "Content-Length: \(body.count)\r\n" +
          "Connection: close\r\n\r\n"
        response = Data(header.utf8) + body
      }

      connection.send(content: response, completion: .contentProcessed { _ in
        connection.cancel()
      })
    }
  }

  private func parseRequestPath(_ request: String) -> String {
    guard let firstLine = request.components(separatedBy: "\r\n").first else {
      return ""
    }
    let parts = firstLine.split(separator: " ")
    guard parts.count >= 2 else {
      return ""
    }
    return String(parts[1])
  }

  private func fetchManifest() async throws -> SegmentBaseDASHManifest {
    let (data, _) = try await data(for: mpdURL)
    guard let manifest = SegmentBaseMPDParser(manifestURL: mpdURL).parse(data: data) else {
      throw SegmentBaseDASHError.invalidManifest
    }
    return manifest
  }

  private func buildPlaylistContent(manifest: SegmentBaseDASHManifest) async throws -> [String: String] {
    var playlists: [String: String] = [:]
    var audioGroups: [SegmentBaseRepresentation] = []
    let subtitleGroups: [SegmentBaseSubtitleRepresentation] = manifest.subtitleRepresentations

    for audioRepresentation in manifest.audioRepresentations {
      playlists["/audio-\(audioRepresentation.id).m3u8"] = try await makeMediaPlaylist(
        representation: audioRepresentation,
        isAudioOnly: true
      )
      audioGroups.append(audioRepresentation)
    }

    for subtitleRepresentation in manifest.subtitleRepresentations {
      playlists["/subtitles-\(subtitleRepresentation.id).m3u8"] = makeSubtitlePlaylist(
        subtitle: subtitleRepresentation,
        duration: manifest.duration
      )
    }

    for videoRepresentation in manifest.videoRepresentations {
      playlists["/video-\(videoRepresentation.id).m3u8"] = try await makeMediaPlaylist(
        representation: videoRepresentation,
        isAudioOnly: false
      )
    }

    playlists["/master.m3u8"] = makeMasterPlaylist(
      manifest: manifest,
      audioGroups: audioGroups,
      subtitleGroups: subtitleGroups
    )

    return playlists
  }

  private func makeMasterPlaylist(
    manifest: SegmentBaseDASHManifest,
    audioGroups: [SegmentBaseRepresentation],
    subtitleGroups: [SegmentBaseSubtitleRepresentation]
  ) -> String {
    var lines = [
      "#EXTM3U",
      "#EXT-X-VERSION:7",
      "#EXT-X-INDEPENDENT-SEGMENTS"
    ]

    if !audioGroups.isEmpty {
      for (index, audioGroup) in audioGroups.enumerated() {
        let language = audioGroup.language ?? "und"
        let name = "\(language.uppercased()) \(audioGroup.bandwidth / 1000) kbps"
        var attributes = [
          "TYPE=AUDIO",
          "GROUP-ID=\"audio\"",
          "NAME=\"\(name)\"",
          "LANGUAGE=\"\(language)\"",
          index == 0 ? "DEFAULT=YES" : "DEFAULT=NO",
          "AUTOSELECT=YES",
          "URI=\"http://127.0.0.1:\(serverPort)/audio-\(audioGroup.id).m3u8\""
        ]
        if let channels = audioGroup.channels {
          attributes.append("CHANNELS=\"\(channels)\"")
        }
        lines.append("#EXT-X-MEDIA:" + attributes.joined(separator: ","))
      }
    }

    if !subtitleGroups.isEmpty {
      for (index, subtitle) in subtitleGroups.enumerated() {
        let language = subtitle.language ?? "und"
        let name = language.uppercased()
        lines.append(
          "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"\(name)\",LANGUAGE=\"\(language)\",DEFAULT=\(index == 0 ? "YES" : "NO"),AUTOSELECT=YES,URI=\"http://127.0.0.1:\(serverPort)/subtitles-\(subtitle.id).m3u8\""
        )
      }
    }

    let defaultAudioCodec = audioGroups.first?.codecs
    for videoRepresentation in manifest.videoRepresentations {
      var attributes = [
        "BANDWIDTH=\(videoRepresentation.bandwidth)"
      ]
      if let width = videoRepresentation.width, let height = videoRepresentation.height {
        attributes.append("RESOLUTION=\(width)x\(height)")
      }

      let codecs = [videoRepresentation.codecs, defaultAudioCodec].compactMap { $0 }.joined(separator: ",")
      if !codecs.isEmpty {
        attributes.append("CODECS=\"\(codecs)\"")
      }
      if !audioGroups.isEmpty {
        attributes.append("AUDIO=\"audio\"")
      }
      if !subtitleGroups.isEmpty {
        attributes.append("SUBTITLES=\"subs\"")
      }

      lines.append("#EXT-X-STREAM-INF:" + attributes.joined(separator: ","))
      lines.append("http://127.0.0.1:\(serverPort)/video-\(videoRepresentation.id).m3u8")
    }

    return lines.joined(separator: "\n")
  }

  private func makeMediaPlaylist(
    representation: SegmentBaseRepresentation,
    isAudioOnly: Bool
  ) async throws -> String {
    let segments = try await fetchSegments(for: representation)
    let targetDuration = max(Int(ceil(segments.map(\.duration).max() ?? 1)), 1)

    var lines = [
      "#EXTM3U",
      "#EXT-X-VERSION:7",
      "#EXT-X-PLAYLIST-TYPE:VOD",
      "#EXT-X-TARGETDURATION:\(targetDuration)",
      "#EXT-X-MAP:URI=\"\(representation.url.absoluteString)\",BYTERANGE=\"\(representation.initializationRange.length)@\(representation.initializationRange.start)\""
    ]

    if isAudioOnly {
      lines.append("#EXT-X-INDEPENDENT-SEGMENTS")
    }

    for segment in segments {
      lines.append("#EXTINF:\(formatDuration(segment.duration)),")
      lines.append("#EXT-X-BYTERANGE:\(segment.byteRange.length)@\(segment.byteRange.start)")
      lines.append(representation.url.absoluteString)
    }

    lines.append("#EXT-X-ENDLIST")
    return lines.joined(separator: "\n")
  }

  private func makeSubtitlePlaylist(subtitle: SegmentBaseSubtitleRepresentation, duration: Double) -> String {
    let targetDuration = max(Int(ceil(duration)), 1)
    return [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "#EXT-X-PLAYLIST-TYPE:VOD",
      "#EXT-X-TARGETDURATION:\(targetDuration)",
      "#EXTINF:\(formatDuration(duration)),",
      subtitle.url.absoluteString,
      "#EXT-X-ENDLIST"
    ].joined(separator: "\n")
  }

  private func fetchSegments(for representation: SegmentBaseRepresentation) async throws -> [SegmentByteRange] {
    var request = URLRequest(url: representation.url)
    request.timeoutInterval = 10
    request.setValue(
      "bytes=\(representation.indexRange.start)-\(representation.indexRange.start + representation.indexRange.length - 1)",
      forHTTPHeaderField: "Range"
    )
    headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }

    let (data, _) = try await session.data(for: request)
    return try SegmentBaseSidxParser.parse(
      indexData: data,
      indexRangeStart: representation.indexRange.start
    )
  }

  private func data(for url: URL) async throws -> (Data, URLResponse) {
    var request = URLRequest(url: url)
    request.timeoutInterval = 10
    headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
    return try await session.data(for: request)
  }

  private func formatDuration(_ duration: Double) -> String {
    if duration.rounded(.towardZero) == duration {
      return String(Int(duration))
    }
    return String(format: "%.6f", duration)
  }
}
