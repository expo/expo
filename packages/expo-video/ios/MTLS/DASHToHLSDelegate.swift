import Foundation
import AVFoundation
import Network
import os.log

private let log = os.Logger(subsystem: "expo.video.dash", category: "DASHToHLS")

// MARK: - Data Model

struct DASHRepresentation {
  let id: String
  let bandwidth: Int
  let width: Int?
  let height: Int?
  let codecs: String
  let initTemplate: String      // e.g. "../live-md-v/ID-init.m4v"
  let mediaTemplate: String     // e.g. "../live-md-v/ID-$Time$.m4v"
  let segments: [(t: Int64, d: Int64, mediaNumber: Int?)]
  let timescale: Int
  // FB predictive rewind attributes from <SegmentTimeline>
  let predictiveMedia: String?           // FBPredictedMedia — URL template using $Number$
  let predictiveMediaStartNumber: Int?   // FBPredictedMediaStartNumber
  let predictiveMediaEndNumber: Int?     // FBPredictedMediaEndNumber
  let averageDuration: Int64?            // FBAverageDuration (in timescale units)
}

struct DASHManifest {
  let type: String              // "dynamic" for live, "static" for VOD
  let minimumUpdatePeriod: TimeInterval
  let baseUrl: URL
  let videoRepresentations: [DASHRepresentation]
  let audioRepresentations: [DASHRepresentation]
  var isLive: Bool { type == "dynamic" }
}

// MARK: - MPD Parser

final class MPDParser: NSObject, XMLParserDelegate {
  private let baseUrl: URL

  private var manifest: DASHManifest?
  private var currentAdaptationSet: (mimeType: String, maxWidth: Int?, maxHeight: Int?)?
  private var currentRepresentation: (id: String, bandwidth: Int, width: Int?, height: Int?, codecs: String, mimeType: String)?
  private var currentSegmentTemplate: (timescale: Int, initTemplate: String, mediaTemplate: String)?
  private var currentSegments: [(t: Int64, d: Int64, mediaNumber: Int?)] = []
  private var mpdType: String = "static"
  private var mpdMinUpdatePeriod: TimeInterval = 0

  // FB predictive rewind attributes parsed from <SegmentTimeline>
  private var currentPredictiveMedia: String?
  private var currentPredictiveStartNumber: Int?
  private var currentPredictiveEndNumber: Int?
  private var currentAverageDuration: Int64?

  private var videoReps: [DASHRepresentation] = []
  private var audioReps: [DASHRepresentation] = []

  init(baseUrl: URL) {
    self.baseUrl = baseUrl
  }

  func parse(data: Data) -> DASHManifest? {
    let parser = XMLParser(data: data)
    parser.shouldResolveExternalEntities = false  // defense-in-depth against XXE
    parser.delegate = self
    parser.parse()
    return manifest
  }

  // MARK: XMLParserDelegate

  func parser(_ parser: XMLParser, didStartElement elementName: String,
              namespaceURI: String?, qualifiedName qName: String?,
              attributes attributeDict: [String: String] = [:]) {
    switch elementName {
    case "MPD":
      mpdType = attributeDict["type"] ?? "static"
      mpdMinUpdatePeriod = parseDuration(attributeDict["minimumUpdatePeriod"] ?? "")

    case "AdaptationSet":
      let mimeType = attributeDict["mimeType"] ?? attributeDict["contentType"] ?? ""
      currentAdaptationSet = (
        mimeType: mimeType,
        maxWidth: attributeDict["maxWidth"].flatMap(Int.init),
        maxHeight: attributeDict["maxHeight"].flatMap(Int.init)
      )

    case "Representation":
      let id = attributeDict["id"] ?? ""
      let bandwidth = Int(attributeDict["bandwidth"] ?? "0") ?? 0
      let width = attributeDict["width"].flatMap(Int.init) ?? currentAdaptationSet?.maxWidth
      let height = attributeDict["height"].flatMap(Int.init) ?? currentAdaptationSet?.maxHeight
      let codecs = attributeDict["codecs"] ?? ""
      // mimeType can be on Representation or AdaptationSet
      let mimeType = attributeDict["mimeType"] ?? currentAdaptationSet?.mimeType ?? ""
      currentRepresentation = (id: id, bandwidth: bandwidth, width: width, height: height, codecs: codecs, mimeType: mimeType)

    case "SegmentTemplate":
      let timescale = Int(attributeDict["timescale"] ?? "1") ?? 1
      let initTemplate = attributeDict["initialization"] ?? ""
      let mediaTemplate = attributeDict["media"] ?? ""
      currentSegmentTemplate = (timescale: timescale, initTemplate: initTemplate, mediaTemplate: mediaTemplate)
      currentSegments = []

    case "SegmentTimeline":
      // Parse FB predictive rewind attributes
      currentPredictiveMedia = attributeDict["FBPredictedMedia"]
      currentPredictiveStartNumber = Int(attributeDict["FBPredictedMediaStartNumber"] ?? "")
      currentPredictiveEndNumber = Int(attributeDict["FBPredictedMediaEndNumber"] ?? "")
      currentAverageDuration = Int64(attributeDict["FBAverageDuration"] ?? "")
      if currentPredictiveMedia != nil {
        log.info("[DASHToHLS] Found FB predictive attributes: start=\(self.currentPredictiveStartNumber ?? -1) end=\(self.currentPredictiveEndNumber ?? -1) avgDur=\(self.currentAverageDuration ?? -1)")
      }

    case "S":
      let t = Int64(attributeDict["t"] ?? "0") ?? 0
      let d = Int64(attributeDict["d"] ?? "0") ?? 0
      let r = Int(attributeDict["r"] ?? "0") ?? 0

      // r attribute means "repeat r times" (so r+1 total segments)
      // Keep up to 900 segments (~30 min at 2s each) for DVR seekback.
      // AVPlayer needs a substantial segment window to show the scrub bar.
      if r > 0 {
        let totalCount = r + 1
        let keepCount = min(totalCount, 900)
        let startIdx = totalCount - keepCount
        for i in startIdx..<totalCount {
          let segT = t > 0 ? t + Int64(i) * d : (currentSegments.last.map { $0.t + $0.d } ?? 0) + Int64(i) * d
          currentSegments.append((t: segT, d: d, mediaNumber: nil))
        }
      } else {
        let segT: Int64
        if t > 0 {
          segT = t
        } else if let last = currentSegments.last {
          segT = last.t + last.d
        } else {
          segT = 0
        }
        currentSegments.append((t: segT, d: d, mediaNumber: nil))
      }

    default:
      break
    }
  }

  func parser(_ parser: XMLParser, didEndElement elementName: String,
              namespaceURI: String?, qualifiedName qName: String?) {
    switch elementName {
    case "Representation":
      guard let rep = currentRepresentation,
            let seg = currentSegmentTemplate else { break }

      // If FB predictive attributes are present, synthesize rewind segments
      let finalSegments = synthesizePredictiveSegments(
        explicitSegments: currentSegments,
        predictiveMedia: currentPredictiveMedia,
        startNumber: currentPredictiveStartNumber,
        endNumber: currentPredictiveEndNumber,
        averageDuration: currentAverageDuration
      )

      let dashRep = DASHRepresentation(
        id: rep.id,
        bandwidth: rep.bandwidth,
        width: rep.width,
        height: rep.height,
        codecs: rep.codecs,
        initTemplate: seg.initTemplate,
        mediaTemplate: seg.mediaTemplate,
        segments: finalSegments,
        timescale: seg.timescale,
        predictiveMedia: currentPredictiveMedia,
        predictiveMediaStartNumber: currentPredictiveStartNumber,
        predictiveMediaEndNumber: currentPredictiveEndNumber,
        averageDuration: currentAverageDuration
      )

      // Check mimeType from Representation first, then AdaptationSet
      let mimeType = rep.mimeType.isEmpty ? (currentAdaptationSet?.mimeType ?? "") : rep.mimeType
      if mimeType.contains("video") {
        videoReps.append(dashRep)
      } else if mimeType.contains("audio") {
        audioReps.append(dashRep)
      }
      currentRepresentation = nil

    case "SegmentTemplate":
      // Keep currentSegmentTemplate and currentSegments alive for the Representation end
      break

    case "AdaptationSet":
      currentAdaptationSet = nil
      currentSegmentTemplate = nil
      currentSegments = []
      currentPredictiveMedia = nil
      currentPredictiveStartNumber = nil
      currentPredictiveEndNumber = nil
      currentAverageDuration = nil

    case "MPD":
      manifest = DASHManifest(
        type: mpdType,
        minimumUpdatePeriod: mpdMinUpdatePeriod,
        baseUrl: baseUrl,
        videoRepresentations: videoReps,
        audioRepresentations: audioReps
      )

    default:
      break
    }
  }

  // MARK: - Predictive Rewind

  /// Synthesizes rewind segments from FB predictive attributes.
  /// If attributes are present, generates segments for [startNumber, endNumber - explicitCount]
  /// using FBAverageDuration for timestamps and FBPredictedMedia with $Number$ for URLs.
  private func synthesizePredictiveSegments(
    explicitSegments: [(t: Int64, d: Int64, mediaNumber: Int?)],
    predictiveMedia: String?,
    startNumber: Int?,
    endNumber: Int?,
    averageDuration: Int64?
  ) -> [(t: Int64, d: Int64, mediaNumber: Int?)] {
    guard let predictiveMedia, !predictiveMedia.isEmpty,
          let startNumber, startNumber > 0,
          let endNumber, endNumber > 0,
          let averageDuration, averageDuration > 0,
          !explicitSegments.isEmpty else {
      return explicitSegments
    }

    let explicitCount = explicitSegments.count
    // The explicit <S> entries correspond to the last `explicitCount` segments,
    // ending at endNumber. So segments before (endNumber - explicitCount + 1)
    // are "predictive" — addressable by $Number$ but not in the manifest.
    let lastImpliedNumber = endNumber - explicitCount
    let totalRewindSegments = lastImpliedNumber - startNumber + 1

    guard totalRewindSegments > 0 else {
      return explicitSegments
    }

    log.info("[DASHToHLS] Synthesizing \(totalRewindSegments) predictive rewind segments (numbers \(startNumber)...\(lastImpliedNumber))")

    // Compute start time: anchor from the first explicit segment's time
    let firstExplicitT = explicitSegments[0].t
    var startTime = firstExplicitT - averageDuration * Int64(totalRewindSegments)
    if startTime < 0 {
      startTime = 0
    }

    var rewindSegments: [(t: Int64, d: Int64, mediaNumber: Int?)] = []
    rewindSegments.reserveCapacity(totalRewindSegments)

    for i in 0..<totalRewindSegments {
      let t = startTime + Int64(i) * averageDuration
      let number = startNumber + i
      rewindSegments.append((t: t, d: averageDuration, mediaNumber: number))
    }

    return rewindSegments + explicitSegments
  }

  /// Parses ISO 8601 duration (e.g. "PT1S", "PT2.0S", "PT0H1M30S") to seconds.
  private func parseDuration(_ str: String) -> TimeInterval {
    guard str.hasPrefix("PT") else { return 0 }
    let body = String(str.dropFirst(2))
    var seconds: Double = 0

    if let sRange = body.range(of: "S") {
      let before = body[body.startIndex..<sRange.lowerBound]
      // Find the start of the seconds value (after H or M if present)
      let sStr: String
      if let mIdx = before.lastIndex(of: "M") {
        sStr = String(before[before.index(after: mIdx)...])
      } else if let hIdx = before.lastIndex(of: "H") {
        sStr = String(before[before.index(after: hIdx)...])
      } else {
        sStr = String(before)
      }
      seconds += Double(sStr) ?? 0
    }
    if let mRange = body.range(of: "M") {
      let before = body[body.startIndex..<mRange.lowerBound]
      let mStr: String
      if let hIdx = before.lastIndex(of: "H") {
        mStr = String(before[before.index(after: hIdx)...])
      } else {
        mStr = String(before)
      }
      seconds += (Double(mStr) ?? 0) * 60
    }
    if let hRange = body.range(of: "H") {
      let hStr = String(body[body.startIndex..<hRange.lowerBound])
      seconds += (Double(hStr) ?? 0) * 3600
    }
    return seconds
  }
}

// MARK: - HLS Generator

enum HLSGenerator {
  /// Generates a master m3u8 playlist from parsed DASH representations.
  /// `variantUrlFor` resolves each representation to a variant playlist URL.
  /// If nil, uses the default scheme-based resolver.
  static func masterPlaylist(manifest: DASHManifest, scheme: String,
                              variantUrlFor: ((DASHRepresentation) -> String)? = nil) -> String {
    let resolveUrl: (DASHRepresentation) -> String = variantUrlFor ?? { rep in
      variantPlaylistUrl(rep: rep, baseUrl: manifest.baseUrl, scheme: scheme)
    }
    var lines = ["#EXTM3U", "#EXT-X-VERSION:7", "#EXT-X-INDEPENDENT-SEGMENTS"]

    // Audio group
    if let audioRep = manifest.audioRepresentations.first {
      let audioUri = resolveUrl(audioRep)
      var mediaAttrs = "TYPE=AUDIO,GROUP-ID=\"audio\",NAME=\"default\",DEFAULT=YES,AUTOSELECT=YES"
      if !audioRep.codecs.isEmpty {
        mediaAttrs += ",CODECS=\"\(audioRep.codecs)\""
      }
      mediaAttrs += ",URI=\"\(audioUri)\""
      lines.append("#EXT-X-MEDIA:\(mediaAttrs)")
    }

    // Video variants sorted by bandwidth (ascending)
    let sortedVideo = manifest.videoRepresentations.sorted { $0.bandwidth < $1.bandwidth }
    for rep in sortedVideo {
      var attrs = "BANDWIDTH=\(rep.bandwidth)"
      if let w = rep.width, let h = rep.height {
        attrs += ",RESOLUTION=\(w)x\(h)"
      }
      if !rep.codecs.isEmpty {
        var codecsList = rep.codecs
        if let audioCodec = manifest.audioRepresentations.first?.codecs, !audioCodec.isEmpty {
          codecsList += ",\(audioCodec)"
        }
        attrs += ",CODECS=\"\(codecsList)\""
      }
      if !manifest.audioRepresentations.isEmpty {
        attrs += ",AUDIO=\"audio\""
      }
      let uri = resolveUrl(rep)
      lines.append("#EXT-X-STREAM-INF:\(attrs)")
      lines.append(uri)
    }

    return lines.joined(separator: "\n") + "\n"
  }

  /// Generates a media (variant) m3u8 playlist for a single representation.
  static func mediaPlaylist(rep: DASHRepresentation, baseUrl: URL,
                            scheme: String, isLive: Bool,
                            mediaSequence: Int) -> String {
    guard !rep.segments.isEmpty else {
      return "#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-TARGETDURATION:2\n#EXT-X-ENDLIST\n"
    }

    let maxDuration = rep.segments.map { Double($0.d) / Double(rep.timescale) }.max() ?? 2.0
    let targetDuration = Int(ceil(maxDuration))

    var lines = [
      "#EXTM3U",
      "#EXT-X-VERSION:7",
      "#EXT-X-TARGETDURATION:\(targetDuration)",
      "#EXT-X-MEDIA-SEQUENCE:\(mediaSequence)",
    ]

    // For live streams, add #EXT-X-START so AVPlayer knows where to begin
    // playback relative to the end of the playlist. Negative offset means
    // "start N seconds before the end" (live edge minus buffer).
    if isLive {
      lines.append("#EXT-X-START:TIME-OFFSET=-6,PRECISE=YES")
    }

    // For live streams with a large DVR window (>30 segments, ~1 minute),
    // use EVENT type so AVPlayer shows a full scrubber. This tells AVPlayer
    // the content has a definite start and growing end.
    // For non-live, use VOD type for full seekability.
    if !isLive {
      lines.append("#EXT-X-PLAYLIST-TYPE:VOD")
    } else if rep.segments.count > 30 {
      lines.append("#EXT-X-PLAYLIST-TYPE:EVENT")
    }

    // Init segment — use https:// so AVPlayer fetches directly from CDN.
    // CDN URLs are self-authenticating (signed query strings), so no proxy needed.
    // Using the custom scheme for segments causes CoreMediaErrorDomain -12881
    // because AVPlayer can't create fMP4 format descriptions via resource loader.
    let initUrl = resolveSegmentUrl(template: rep.initTemplate, repId: rep.id,
                                     time: nil, number: nil,
                                     predictiveMedia: nil,
                                     baseUrl: baseUrl, scheme: "https")
    lines.append("#EXT-X-MAP:URI=\"\(initUrl)\"")

    // Media segments — also use https:// for direct CDN fetch.
    // Add #EXT-X-PROGRAM-DATE-TIME on the first segment so AVPlayer can
    // compute the seekable DVR range and display the scrub bar for live streams.
    // Anchor the last segment's date to now (wall clock) and compute earlier
    // segment dates by subtracting durations backward. DASH media timestamps
    // can produce dates in year 1970 which confuse AVPlayer's live edge detection.
    let dateFormatter = ISO8601DateFormatter()
    dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    // Compute total duration of all segments to anchor the first segment's date
    let totalDuration = rep.segments.reduce(0.0) { $0 + Double($1.d) / Double(rep.timescale) }
    let firstSegmentDate = Date().addingTimeInterval(-totalDuration)

    for (index, seg) in rep.segments.enumerated() {
      let duration = Double(seg.d) / Double(rep.timescale)
      // Emit #EXT-X-PROGRAM-DATE-TIME on every segment so AVPlayer's live DVR
      // scrubber can accurately compute the seekable window, especially when
      // the first segment changes on each playlist refresh.
      let segmentDate = firstSegmentDate.addingTimeInterval(
        rep.segments.prefix(index).reduce(0.0) { $0 + Double($1.d) / Double(rep.timescale) }
      )
      lines.append("#EXT-X-PROGRAM-DATE-TIME:\(dateFormatter.string(from: segmentDate))")

      // For predictive segments (with mediaNumber), use the predictive media
      // template with $Number$ substitution. For explicit segments, use the
      // standard media template with $Time$.
      let segUrl = resolveSegmentUrl(
        template: rep.mediaTemplate, repId: rep.id,
        time: seg.t, number: seg.mediaNumber,
        predictiveMedia: rep.predictiveMedia,
        baseUrl: baseUrl, scheme: "https"
      )
      lines.append(String(format: "#EXTINF:%.3f,", duration))
      lines.append(segUrl)
    }

    if !isLive {
      lines.append("#EXT-X-ENDLIST")
    }

    return lines.joined(separator: "\n") + "\n"
  }

  // MARK: - Private

  /// Creates a variant playlist URL using the custom scheme.
  /// Format: expo-dash://host/base-path/variant-{repId}.m3u8?query
  private static func variantPlaylistUrl(rep: DASHRepresentation, baseUrl: URL, scheme: String) -> String {
    var components = URLComponents()
    components.scheme = scheme
    components.host = baseUrl.host
    // Use the MPD's directory as the base path
    let basePath = (baseUrl.path as NSString).deletingLastPathComponent
    components.path = basePath + "/variant-\(rep.id).m3u8"
    components.query = baseUrl.query
    return components.url?.absoluteString ?? "\(scheme)://\(baseUrl.host ?? "")/variant-\(rep.id).m3u8"
  }

  /// Resolves a segment URL template and rewrites it to the custom scheme.
  /// If `number` is non-nil and `predictiveMedia` is provided, uses the
  /// predictive template with $Number$ substitution instead of $Time$.
  private static func resolveSegmentUrl(template: String, repId: String,
                                         time: Int64?, number: Int?,
                                         predictiveMedia: String?,
                                         baseUrl: URL, scheme: String) -> String {
    var resolved: String

    if let number, let predictiveMedia, !predictiveMedia.isEmpty {
      // Predictive segment: use FBPredictedMedia template with $Number$
      resolved = predictiveMedia
        .replacingOccurrences(of: "$Number$", with: "\(number)")
        .replacingOccurrences(of: "$RepresentationID$", with: repId)
    } else {
      // Standard segment: use media template with $Time$
      resolved = template
        .replacingOccurrences(of: "$RepresentationID$", with: repId)
      if let time = time {
        resolved = resolved.replacingOccurrences(of: "$Time$", with: "\(time)")
      }
    }

    // Use URL.deletingLastPathComponent() which properly handles query strings
    let mpdDir = baseUrl.deletingLastPathComponent()

    guard let absoluteSegUrl = URL(string: resolved, relativeTo: mpdDir) else {
      return "\(scheme)://\(baseUrl.host ?? "")/\(resolved)"
    }

    // Validate that the resolved URL points to a known CDN host.
    // Prevents a compromised MPD from redirecting segment fetches (with
    // CDN auth tokens) to an attacker-controlled host.
    let allowedSuffixes = ["fbcdn.net", "facebook.com", "fb.com", "facebookcomet.com"]
    if let host = absoluteSegUrl.host,
       !allowedSuffixes.contains(where: { host == $0 || host.hasSuffix(".\($0)") }) {
      log.warning("[DASHToHLS] blocked segment URL with untrusted host: \(host)")
      return ""
    }

    // Build the result URL with custom scheme
    // Merge segment template query params with MPD auth tokens (oh, oe)
    var components = URLComponents()
    components.scheme = scheme
    components.host = absoluteSegUrl.host
    components.path = absoluteSegUrl.path
    // Start with segment's own query params, then add MPD's auth tokens
    var queryItems = URLComponents(url: absoluteSegUrl.absoluteURL, resolvingAgainstBaseURL: true)?.queryItems ?? []
    // Add MPD auth tokens (oh, oe, etc.) that aren't already in the segment URL
    let existingKeys = Set(queryItems.map { $0.name })
    if let mpdItems = URLComponents(url: baseUrl, resolvingAgainstBaseURL: false)?.queryItems {
      for item in mpdItems where !existingKeys.contains(item.name) {
        queryItems.append(item)
      }
    }
    components.queryItems = queryItems.isEmpty ? nil : queryItems
    return components.url?.absoluteString ?? "\(scheme)://\(baseUrl.host ?? "")\(absoluteSegUrl.path)"
  }
}

// MARK: - DASHToHLSDelegate

/// AVAssetResourceLoaderDelegate that converts DASH MPD manifests to HLS m3u8 on-the-fly.
///
/// When AVPlayer encounters a URL with the `expo-dash` custom scheme, this delegate:
/// 1. For the initial request: fetches the CDN DASH .mpd, parses it, generates HLS master m3u8
/// 2. For variant playlist requests: generates media m3u8 from the parsed manifest
/// 3. For segment requests: rewrites the scheme back to https:// and proxies the binary data
///
/// CDN segment URLs are self-authenticating (signed query strings), so no mTLS or cookies needed.
final class DASHToHLSDelegate: NSObject, AVAssetResourceLoaderDelegate {
  static let scheme = "expo-dash"
  #if DEBUG
  private static let countLock = NSLock()
  private static var _callCount: Int = 0
  static var delegateCallCount: Int {
    countLock.lock()
    let val = _callCount
    countLock.unlock()
    return val
  }
  private static func incrementCallCount() {
    countLock.lock()
    _callCount += 1
    countLock.unlock()
  }
  #endif

  private let mpdUrl: URL
  private var cachedManifest: DASHManifest?
  private var firstSegmentTimestamps: [String: Int64] = [:]  // repId -> first segment t
  private let session: URLSession
  private let lock = NSLock()

  init(mpdUrl: URL) {
    self.mpdUrl = mpdUrl
    self.session = URLSession(configuration: .default)
    super.init()
  }

  deinit {
    session.invalidateAndCancel()
  }

  // MARK: - AVAssetResourceLoaderDelegate

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest
  ) -> Bool {
    #if DEBUG
    DASHToHLSDelegate.incrementCallCount()
    log.debug("[DASHToHLS] shouldWaitForLoadingOfRequestedResource count=\(DASHToHLSDelegate.delegateCallCount)")
    #endif
    guard let requestUrl = loadingRequest.request.url else {
      return false
    }

    log.info("[DASHToHLS] request: \(requestUrl.absoluteString)")

    // Determine request type from URL path
    let path = requestUrl.path

    if path.hasSuffix(".m3u8") && !path.contains("variant-") {
      // Master playlist request — fetch MPD, convert to master m3u8
      handleMasterPlaylistRequest(loadingRequest: loadingRequest)
      return true
    } else if path.contains("variant-") && path.hasSuffix(".m3u8") {
      // Variant/media playlist request
      handleVariantPlaylistRequest(loadingRequest: loadingRequest, url: requestUrl)
      return true
    } else {
      // Segment request — proxy to CDN
      handleSegmentRequest(loadingRequest: loadingRequest, url: requestUrl)
      return true
    }
  }

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    didCancel loadingRequest: AVAssetResourceLoadingRequest
  ) {
    // Cancellation is handled by URLSession task cancellation
  }

  // MARK: - Request Handlers

  private func handleMasterPlaylistRequest(loadingRequest: AVAssetResourceLoadingRequest) {
    Task {
      do {
        let manifest = try await fetchAndParseManifest()
        let m3u8 = HLSGenerator.masterPlaylist(manifest: manifest, scheme: Self.scheme)
        log.info("[DASHToHLS] generated master m3u8 (\(m3u8.count) bytes) with \(manifest.videoRepresentations.count) video + \(manifest.audioRepresentations.count) audio reps")

        let data = Data(m3u8.utf8)
        if let contentInfoRequest = loadingRequest.contentInformationRequest {
          contentInfoRequest.contentType = "public.m3u8-playlist"
          contentInfoRequest.contentLength = Int64(data.count)
          contentInfoRequest.isByteRangeAccessSupported = false
        }
        loadingRequest.dataRequest?.respond(with: data)
        loadingRequest.finishLoading()
      } catch {
        log.error("[DASHToHLS] master playlist error: \(error.localizedDescription)")
        loadingRequest.finishLoading(with: error)
      }
    }
  }

  private func handleVariantPlaylistRequest(loadingRequest: AVAssetResourceLoadingRequest, url: URL) {
    Task {
      do {
        // Extract rep ID from URL: variant-{repId}.m3u8
        let filename = (url.path as NSString).lastPathComponent
        guard let repId = extractRepId(from: filename) else {
          throw DASHError.invalidVariantUrl(filename)
        }

        // Re-fetch manifest for live streams to get latest segments
        let manifest = try await fetchAndParseManifest()
        let allReps = manifest.videoRepresentations + manifest.audioRepresentations
        guard let rep = allReps.first(where: { $0.id == repId }) else {
          throw DASHError.representationNotFound(repId)
        }

        // Track media sequence: number of segments removed from start
        let mediaSequence: Int
        lock.lock()
        if let firstT = firstSegmentTimestamps[repId] {
          if let currentFirstT = rep.segments.first?.t, currentFirstT > firstT {
            // Segments have been removed from the start — compute how many
            mediaSequence = rep.segments.isEmpty ? 0 :
              Int((currentFirstT - firstT) / max(rep.segments.first?.d ?? 1, 1))
          } else {
            mediaSequence = 0
          }
        } else {
          firstSegmentTimestamps[repId] = rep.segments.first?.t ?? 0
          mediaSequence = 0
        }
        lock.unlock()

        let m3u8 = HLSGenerator.mediaPlaylist(
          rep: rep,
          baseUrl: manifest.baseUrl,
          scheme: Self.scheme,
          isLive: manifest.isLive,
          mediaSequence: mediaSequence
        )

        log.info("[DASHToHLS] generated variant m3u8 for rep \(repId) (\(rep.segments.count) segments, seq=\(mediaSequence), live=\(manifest.isLive))")

        let data = Data(m3u8.utf8)
        if let contentInfoRequest = loadingRequest.contentInformationRequest {
          contentInfoRequest.contentType = "public.m3u8-playlist"
          contentInfoRequest.contentLength = Int64(data.count)
          contentInfoRequest.isByteRangeAccessSupported = false
        }
        loadingRequest.dataRequest?.respond(with: data)
        loadingRequest.finishLoading()
      } catch {
        log.error("[DASHToHLS] variant playlist error: \(error.localizedDescription)")
        loadingRequest.finishLoading(with: error)
      }
    }
  }

  private func handleSegmentRequest(loadingRequest: AVAssetResourceLoadingRequest, url: URL) {
    // Rewrite expo-dash:// -> https:// and fetch from CDN
    var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
    components?.scheme = "https"
    guard let httpsUrl = components?.url else {
      loadingRequest.finishLoading(with: DASHError.invalidSegmentUrl(url.absoluteString))
      return
    }

    log.info("[DASHToHLS] fetching segment: \(httpsUrl.absoluteString.prefix(120))")

    let task = session.dataTask(with: URLRequest(url: httpsUrl)) { data, response, error in
      if let error = error {
        log.error("[DASHToHLS] segment fetch error: \(error.localizedDescription)")
        loadingRequest.finishLoading(with: error)
        return
      }

      guard let data = data else {
        loadingRequest.finishLoading(with: DASHError.noData)
        return
      }

      if let httpResponse = response as? HTTPURLResponse {
        log.info("[DASHToHLS] segment response: status=\(httpResponse.statusCode) size=\(data.count) mime=\(httpResponse.mimeType ?? "nil") url=\(httpsUrl.absoluteString.prefix(80))")

        if httpResponse.statusCode != 200 {
          let preview = String(data: data.prefix(200), encoding: .utf8) ?? "<binary>"
          log.error("[DASHToHLS] segment HTTP error \(httpResponse.statusCode): \(preview)")
          loadingRequest.finishLoading(with: DASHError.httpError(httpResponse.statusCode))
          return
        }
      }

      loadingRequest.dataRequest?.respond(with: data)
      loadingRequest.finishLoading()
    }
    task.resume()
  }

  // MARK: - Manifest Fetching

  private func fetchAndParseManifest() async throws -> DASHManifest {
    // For live streams, always re-fetch to get new segments.
    // For VOD, use cached manifest.
    lock.lock()
    let cached = cachedManifest
    lock.unlock()

    if let cached, !cached.isLive {
      return cached
    }

    let (data, response) = try await session.data(from: mpdUrl)

    if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
      // Stream may have ended — if we have a cached manifest, mark it as ended
      if let cached {
        let ended = DASHManifest(
          type: "static",
          minimumUpdatePeriod: 0,
          baseUrl: cached.baseUrl,
          videoRepresentations: cached.videoRepresentations,
          audioRepresentations: cached.audioRepresentations
        )
        lock.lock()
        cachedManifest = ended
        lock.unlock()
        return ended
      }
      throw DASHError.httpError(httpResponse.statusCode)
    }

    // Log MPD preview for debugging FB predictive attributes
    if let preview = String(data: data.prefix(2048), encoding: .utf8) {
      log.info("[DASHToHLS] MPD preview:\n\(preview)")
    }

    guard let manifest = MPDParser(baseUrl: mpdUrl).parse(data: data) else {
      throw DASHError.parseError
    }

    lock.lock()
    cachedManifest = manifest
    lock.unlock()

    return manifest
  }

  // MARK: - Helpers

  /// Extracts rep ID from "variant-{repId}.m3u8"
  private func extractRepId(from filename: String) -> String? {
    guard filename.hasPrefix("variant-"), filename.hasSuffix(".m3u8") else { return nil }
    let start = filename.index(filename.startIndex, offsetBy: 8)  // "variant-".count
    let end = filename.index(filename.endIndex, offsetBy: -5)     // ".m3u8".count
    guard start < end else { return nil }
    return String(filename[start..<end])
  }
}

// MARK: - Errors

enum DASHError: LocalizedError {
  case parseError
  case httpError(Int)
  case invalidVariantUrl(String)
  case representationNotFound(String)
  case invalidSegmentUrl(String)
  case noData

  var errorDescription: String? {
    switch self {
    case .parseError: return "Failed to parse DASH MPD manifest"
    case .httpError(let code): return "MPD fetch returned HTTP \(code)"
    case .invalidVariantUrl(let url): return "Invalid variant URL: \(url)"
    case .representationNotFound(let id): return "Representation not found: \(id)"
    case .invalidSegmentUrl(let url): return "Invalid segment URL: \(url)"
    case .noData: return "No data received for segment"
    }
  }
}

// MARK: - Local HTTP Server DASH-to-HLS Helper

/// Fetches a DASH MPD, converts it to HLS m3u8, and serves the playlists via
/// a lightweight local HTTP server on 127.0.0.1. AVPlayer loads from
/// http://127.0.0.1:<port>/master.m3u8, giving its native HLS parser full
/// control over seekableTimeRanges, LIVE badge, and DVR scrub bar.
/// Segments use absolute https:// CDN URLs — AVPlayer fetches them directly.
final class DASHToHLSFileHelper {
  private let mpdUrl: URL
  private let session: URLSession
  private var updateTimer: Timer?
  private var cachedManifest: DASHManifest?
  private var firstSegmentTimestamps: [String: Int64] = [:]
  /// Accumulated segments across MPD refreshes, keyed by representation ID.
  /// Used as fallback when FB predictive attributes are absent — grows the
  /// DVR window beyond what the CDN provides in a single MPD.
  private var accumulatedSegments: [String: [(t: Int64, d: Int64, mediaNumber: Int?)]] = [:]
  private let lock = NSLock()

  // Local HTTP server
  private var listener: NWListener?
  private var serverPort: UInt16 = 0
  private var playlistContent: [String: String] = [:]
  private let serverQueue = DispatchQueue(label: "expo.video.dash.server")

  var masterPlaylistUrl: URL {
    return URL(string: "http://127.0.0.1:\(serverPort)/master.m3u8")!
  }

  init(mpdUrl: URL) {
    self.mpdUrl = mpdUrl
    self.session = URLSession(configuration: .default)

    // Start local HTTP server synchronously — wait for port assignment
    let readySemaphore = DispatchSemaphore(value: 0)
    var assignedPort: UInt16 = 0

    do {
      let params = NWParameters.tcp
      params.allowLocalEndpointReuse = true
      let newListener = try NWListener(using: params, on: .any)
      self.listener = newListener

      newListener.stateUpdateHandler = { state in
        if case .ready = state, let port = newListener.port {
          assignedPort = port.rawValue
          readySemaphore.signal()
        } else if case .failed = state {
          readySemaphore.signal()
        }
      }
      newListener.newConnectionHandler = { [weak self] conn in
        self?.handleConnection(conn)
      }
      newListener.start(queue: serverQueue)
    } catch {
      log.error("[DASHServer] failed to create listener: \(error)")
      readySemaphore.signal()
    }

    _ = readySemaphore.wait(timeout: .now() + 2.0)
    self.serverPort = assignedPort
    log.info("[DASHServer] listening on port \(assignedPort)")
  }

  deinit {
    updateTimer?.invalidate()
    listener?.cancel()
    session.invalidateAndCancel()
  }

  // MARK: - HTTP Server

  private func handleConnection(_ connection: NWConnection) {
    connection.start(queue: serverQueue)
    connection.receive(minimumIncompleteLength: 1, maximumLength: 8192) { [weak self] data, _, _, error in
      guard let self, let data, error == nil else {
        connection.cancel()
        return
      }

      let request = String(data: data, encoding: .utf8) ?? ""
      let path = self.parseRequestPath(request)

      self.lock.lock()
      let content = self.playlistContent[path]
      self.lock.unlock()

      let response: Data
      if let content {
        let body = Data(content.utf8)
        let header = "HTTP/1.1 200 OK\r\nContent-Type: application/vnd.apple.mpegurl\r\nContent-Length: \(body.count)\r\nCache-Control: no-cache, no-store\r\nConnection: close\r\nAccess-Control-Allow-Origin: *\r\n\r\n"
        response = Data(header.utf8) + body
      } else {
        let body = Data("Not Found".utf8)
        let header = "HTTP/1.1 404 Not Found\r\nContent-Length: \(body.count)\r\nConnection: close\r\n\r\n"
        response = Data(header.utf8) + body
        log.warning("[DASHServer] 404 for path: \(path)")
      }

      connection.send(content: response, completion: .contentProcessed { _ in
        connection.cancel()
      })
    }
  }

  private func parseRequestPath(_ request: String) -> String {
    guard let firstLine = request.split(separator: "\r\n", maxSplits: 1).first else { return "" }
    let parts = firstLine.split(separator: " ")
    guard parts.count >= 2 else { return "" }
    return String(parts[1])
  }

  // MARK: - Playlist Management

  /// Fetches the MPD manifest and generates initial m3u8 playlists.
  /// Must be awaited before AVPlayer starts loading the HTTP URL.
  func fetchAndWriteInitialPlaylists() async {
    await fetchAndUpdatePlaylists()
  }

  /// Starts a 2-second periodic timer that re-fetches the MPD and updates
  /// the in-memory playlists so AVPlayer picks up new live segments.
  func startLiveUpdatesTimer() {
    lock.lock()
    let isLive = cachedManifest?.isLive == true
    lock.unlock()
    guard isLive else { return }
    // Timer must be scheduled on a run loop
    DispatchQueue.main.async { [weak self] in
      self?.updateTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
        Task { await self?.fetchAndUpdatePlaylists() }
      }
    }
  }

  private func fetchAndUpdatePlaylists() async {
    do {
      let (data, response) = try await session.data(from: mpdUrl)

      if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
        // Stream may have ended — mark as VOD if we have a cached manifest
        lock.lock()
        let cached = cachedManifest
        lock.unlock()
        if let cached {
          let ended = DASHManifest(
            type: "static", minimumUpdatePeriod: 0, baseUrl: cached.baseUrl,
            videoRepresentations: cached.videoRepresentations,
            audioRepresentations: cached.audioRepresentations
          )
          updatePlaylistContent(manifest: ended)
          await MainActor.run { updateTimer?.invalidate() }
        }
        return
      }

      // Log MPD preview to inspect FB predictive attributes
      if let preview = String(data: data.prefix(2048), encoding: .utf8) {
        log.info("[DASHServer] MPD preview:\n\(preview)")
      }

      guard let manifest = MPDParser(baseUrl: mpdUrl).parse(data: data) else {
        log.error("[DASHServer] Failed to parse MPD")
        return
      }

      lock.lock()
      cachedManifest = manifest
      lock.unlock()
      updatePlaylistContent(manifest: manifest)

    } catch {
      log.error("[DASHServer] MPD fetch error: \(error.localizedDescription)")
    }
  }

  private func updatePlaylistContent(manifest: DASHManifest) {
    let port = serverPort
    let master = HLSGenerator.masterPlaylist(manifest: manifest, scheme: "http") { rep in
      "http://127.0.0.1:\(port)/variant-\(rep.id).m3u8"
    }
    var content: [String: String] = ["/master.m3u8": master]

    let allReps = manifest.videoRepresentations + manifest.audioRepresentations
    for rep in allReps {
      // If predictive attributes are present, the parser already synthesized
      // the full DVR window. Otherwise, accumulate segments across refreshes
      // as a fallback to grow the DVR window beyond the CDN's sliding window.
      let effectiveRep: DASHRepresentation
      if manifest.isLive && rep.predictiveMedia == nil {
        effectiveRep = accumulateSegments(rep: rep)
      } else {
        effectiveRep = rep
      }
      let variant = HLSGenerator.mediaPlaylist(
        rep: effectiveRep, baseUrl: manifest.baseUrl,
        scheme: "https", isLive: manifest.isLive,
        mediaSequence: 0
      )
      content["/variant-\(effectiveRep.id).m3u8"] = variant
    }

    lock.lock()
    playlistContent = content
    lock.unlock()

    let segCount = allReps.first.map { accumulatedSegments[$0.id]?.count ?? $0.segments.count } ?? 0
    let hasPredictive = allReps.first?.predictiveMedia != nil
    log.info("[DASHServer] updated playlists: \(manifest.videoRepresentations.count) video + \(manifest.audioRepresentations.count) audio reps, \(segCount) segments, live=\(manifest.isLive), predictive=\(hasPredictive)")
  }

  /// Merges new segments from an MPD refresh into the accumulated list.
  /// Returns a new DASHRepresentation with the full accumulated segment list.
  private func accumulateSegments(rep: DASHRepresentation) -> DASHRepresentation {
    lock.lock()
    var existing = accumulatedSegments[rep.id] ?? []
    lock.unlock()

    // Find the highest timestamp we already have
    let lastKnownT = existing.last?.t ?? -1

    // Append only new segments (those with t > lastKnownT)
    for seg in rep.segments where seg.t > lastKnownT {
      existing.append(seg)
    }

    // Cap at 1800 segments (~60 min at 2s each) to limit memory
    if existing.count > 1800 {
      existing = Array(existing.suffix(1800))
    }

    lock.lock()
    accumulatedSegments[rep.id] = existing
    lock.unlock()

    return DASHRepresentation(
      id: rep.id,
      bandwidth: rep.bandwidth,
      width: rep.width,
      height: rep.height,
      codecs: rep.codecs,
      initTemplate: rep.initTemplate,
      mediaTemplate: rep.mediaTemplate,
      segments: existing,
      timescale: rep.timescale,
      predictiveMedia: rep.predictiveMedia,
      predictiveMediaStartNumber: rep.predictiveMediaStartNumber,
      predictiveMediaEndNumber: rep.predictiveMediaEndNumber,
      averageDuration: rep.averageDuration
    )
  }

  private func computeMediaSequence(rep: DASHRepresentation) -> Int {
    lock.lock()
    defer { lock.unlock() }
    if let firstT = firstSegmentTimestamps[rep.id] {
      if let currentFirstT = rep.segments.first?.t, currentFirstT > firstT {
        return Int((currentFirstT - firstT) / max(rep.segments.first?.d ?? 1, 1))
      }
      return 0
    } else {
      firstSegmentTimestamps[rep.id] = rep.segments.first?.t ?? 0
      return 0
    }
  }
}
