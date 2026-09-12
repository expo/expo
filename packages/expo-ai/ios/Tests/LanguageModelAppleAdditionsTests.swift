import CoreGraphics
import Foundation
import ImageIO
import Testing

#if !LANGUAGE_MODELS_INTEGRATION_RUNNER
@testable import ExpoAI
#endif

@Suite("Apple image requests and usage")
struct LanguageModelAppleAdditionsTests {
  @Test
  func imageOptionsRejectRemoteOrAmbiguousReferences() throws {
    for uri in [
      "https://example.test/image.png", "data:image/png;base64,AA", "file://server/image.png", "file:///tmp/image.png?x=1", "file:///tmp/image.png#fragment",
      "file:///tmp/%00image.png", "file:///tmp/%0aimage.png"
    ] {
      #expect(throws: LanguageModelException.self) {
        try LanguageModelRequestOptions(json: Self.options([["uri": uri, "label": "receipt"]]))
      }
    }
    for label in ["", "bad\nlabel", String(repeating: "x", count: 129)] {
      #expect(throws: LanguageModelException.self) {
        try LanguageModelRequestOptions(json: Self.options([["uri": "file:///tmp/image.png", "label": label]]))
      }
    }
    #expect(throws: LanguageModelException.self) {
      try LanguageModelRequestOptions(json: Self.options(Array(repeating: ["uri": "file:///tmp/image.png", "label": "receipt"], count: 2)))
    }
    #expect(throws: LanguageModelException.self) {
      try LanguageModelRequestOptions(json: Self.options((0..<9).map { ["uri": "file:///tmp/image.png", "label": "image-\($0)"] }))
    }
    let valid = try LanguageModelRequestOptions(json: Self.options([["uri": "file:///tmp/image.png", "label": "receipt"]]))
    #expect(valid.images.count == 1)
    #expect(valid.images.first?.label == "receipt")
  }

  @Test
  func builtinsRequireMatchingPendingCallAndRunOnce() async throws {
    let calls = AsyncStream<String>.makeStream()
    let request = LanguageModelRequest(
      id: "request",
      maximumToolCalls: 1,
      builtinTools: ["expo_ocr": .ocr],
      images: [.init(url: URL(fileURLWithPath: "/tmp/never-read.png"), label: "receipt")],
      onText: { _ in },
      onTool: { id, _, _ in calls.continuation.yield(id) }
    )
    defer {
      request.finish()
      calls.continuation.finish()
    }
    #expect(throws: LanguageModelException.self) {
      try request.beginBuiltin(callId: "forged", kind: .ocr, imageLabel: "receipt", cancel: {})
    }
    let result = Task { try await request.callTool(name: "expo_ocr", argumentsJSON: "{\"image\":\"receipt\"}") }
    let callId = try #require(await calls.stream.first(where: { _ in true }))
    #expect(throws: LanguageModelException.self) {
      try request.beginBuiltin(callId: callId, kind: .barcode, imageLabel: "receipt", cancel: {})
    }
    #expect(throws: LanguageModelException.self) {
      try request.beginBuiltin(callId: callId, kind: .ocr, imageLabel: "file:///tmp/secret", cancel: {})
    }
    let cancellations = CancellationCounter()
    let image = try request.beginBuiltin(callId: callId, kind: .ocr, imageLabel: "receipt", cancel: { cancellations.increment() })
    #expect(image.url.path == "/tmp/never-read.png")
    #expect(throws: LanguageModelException.self) {
      try request.beginBuiltin(callId: callId, kind: .ocr, imageLabel: "receipt", cancel: {})
    }
    request.cancel()
    #expect(cancellations.count == 1)
    await #expect(throws: LanguageModelException.self) { try await result.value }
    #expect(!request.resolve(callId: callId, output: "late", error: nil))
    #expect(throws: LanguageModelException.self) { try request.checkBuiltin(callId: callId) }
  }

  @Test
  func userToolNamesDoNotGrantBuiltinExecution() async throws {
    let calls = AsyncStream<String>.makeStream()
    let request = LanguageModelRequest(
      id: "ordinary",
      maximumToolCalls: 1,
      images: [.init(url: URL(fileURLWithPath: "/tmp/never-read.png"), label: "receipt")],
      onText: { _ in },
      onTool: { id, _, _ in calls.continuation.yield(id) }
    )
    defer {
      request.finish()
      calls.continuation.finish()
    }
    let result = Task { try await request.callTool(name: "expo_ocr", argumentsJSON: "{\"image\":\"receipt\"}") }
    let callId = try #require(await calls.stream.first(where: { _ in true }))
    #expect(throws: LanguageModelException.self) {
      try request.beginBuiltin(callId: callId, kind: .ocr, imageLabel: "receipt", cancel: {})
    }
    #expect(request.resolve(callId: callId, output: "ordinary handler", error: nil))
    #expect(try await result.value == "ordinary handler")
  }

  @Test
  func unknownImageDoesNotEmitToolCall() async throws {
    let emissions = CancellationCounter()
    let request = LanguageModelRequest(
      id: "unknown-image", maximumToolCalls: 1, builtinTools: ["expo_ocr": .ocr],
      images: [.init(url: URL(fileURLWithPath: "/tmp/never-read.png"), label: "receipt")],
      onText: { _ in }, onTool: { _, _, _ in emissions.increment() })
    defer { request.finish() }
    await #expect(throws: LanguageModelException.self) {
      try await request.callTool(name: "expo_ocr", argumentsJSON: "{\"image\":\"missing\"}")
    }
    #expect(emissions.count == 0)
    #expect(request.pendingCount == 0)
  }

  @Test
  func imageSnapshotsSurviveFileReplacement() throws {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    defer { try? FileManager.default.removeItem(at: directory) }
    let url = directory.appendingPathComponent("image.png")
    try Self.writeImage(width: 1, url: url)
    let image = LanguageModelImage(url: url, label: "image-1")
    let request = LanguageModelRequest(id: "first", maximumToolCalls: 0, images: [image], onText: { _ in }, onTool: { _, _, _ in })
    defer { request.finish() }
    let first = try request.imageContent(for: image)
    try Self.writeImage(width: 2, url: url)
    let retained = try request.imageContent(for: image)
    #expect(first === retained)
    #expect(retained.image.width == 1)
    let next = LanguageModelRequest(id: "next", maximumToolCalls: 0, images: [image], onText: { _ in }, onTool: { _, _, _ in })
    defer { next.finish() }
    #expect(try next.imageContent(for: image).image.width == 2)
    try FileManager.default.removeItem(at: url)
    #expect(try request.imageContent(for: image).image.width == 1)
  }

  @Test
  func unknownUsageIsNotReportedAsZero() throws {
    let data = try JSONEncoder().encode(LanguageModelUsage(contextTokens: 42))
    let object = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
    #expect(object["inputTokens"] is NSNull)
    #expect(object["outputTokens"] is NSNull)
    #expect(object["contextTokens"] as? Int == 42)
    let measured = try JSONEncoder().encode(LanguageModelUsage(inputTokens: 10, outputTokens: 0, cachedInputTokens: 3, reasoningTokens: 0))
    let values = try #require(JSONSerialization.jsonObject(with: measured) as? [String: Any])
    #expect(values["outputTokens"] as? Int == 0)
    #expect(values["cachedInputTokens"] as? Int == 3)
  }

  @Test
  func availabilityCapabilitiesRetainRequiredNullFields() throws {
    let data = try JSONEncoder().encode(ExpoAIModule.Capabilities(contextTokens: nil))
    let object = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
    #expect(object.keys.contains("model"))
    #expect(object["model"] is NSNull)
    #expect(object.keys.contains("contextTokens"))
    #expect(object["contextTokens"] is NSNull)
  }

  private static func options(_ images: [[String: String]]) throws -> String {
    // JSONSerialization produces UTF-8.
    // swiftlint:disable:next optional_data_string_conversion
    String(decoding: try JSONSerialization.data(withJSONObject: ["images": images]), as: UTF8.self)
  }

  private static func writeImage(width: Int, url: URL) throws {
    let context = try #require(
      CGContext(
        data: nil,
        width: width,
        height: 1,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      )
    )
    context.setFillColor(CGColor(gray: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: 1))
    let image = try #require(context.makeImage())
    let destination = try #require(CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil))
    CGImageDestinationAddImage(destination, image, nil)
    #expect(CGImageDestinationFinalize(destination))
  }

  private final class CancellationCounter: @unchecked Sendable {
    private let lock = NSLock()
    private var value = 0
    func increment() { lock.withLock { value += 1 } }
    var count: Int { lock.withLock { value } }
  }
}
