import Foundation

internal enum LanguageModelImageTools {
  static func execute(
    request: LanguageModelRequest,
    callId: String,
    kind: LanguageModelBuiltinTool,
    imageLabel: String
  ) async throws -> String {
    guard #available(iOS 18.0, macOS 15.0, *) else {
      throw LanguageModelException("ERR_UNSUPPORTED_FEATURE", "Image tools require the Swift Vision API.")
    }
    // The stable JSON contract uses Swift Vision requests on both OS versions.
    // Apple's iOS 27 Tool wrappers expose opaque arguments and PromptRepresentable output.
    let cancellation = VisionTaskCancellation()
    let image = try request.beginBuiltin(
      callId: callId,
      kind: kind,
      imageLabel: imageLabel,
      cancel: { cancellation.cancel() }
    )
    let task = Task {
      try request.checkBuiltin(callId: callId)
      let content = try request.imageContent(for: image)
      try request.checkBuiltin(callId: callId)
      do {
        let output = try await LanguageModelVision.perform(kind: kind, content: content)
        try request.checkBuiltin(callId: callId)
        return output
      } catch {
        try request.checkBuiltin(callId: callId)
        throw LanguageModelException("ERR_TOOL_EXECUTION", error.localizedDescription)
      }
    }
    cancellation.bind(task)
    return try await withTaskCancellationHandler {
      try await task.value
    } onCancel: {
      cancellation.cancel()
    }
  }

  /// Covers cancellation both before the child task is bound and while Vision is
  /// executing. Each holder belongs to a single approved, pending native tool call.
  private final class VisionTaskCancellation: @unchecked Sendable {
    private let lock = NSLock()
    private var task: Task<String, Error>?
    private var isCancelled = false

    func bind(_ task: Task<String, Error>) {
      lock.withLock {
        if isCancelled { task.cancel() } else { self.task = task }
      }
    }

    func cancel() {
      lock.withLock {
        isCancelled = true
        task?.cancel()
        task = nil
      }
    }
  }
}
