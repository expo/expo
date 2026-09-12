import Foundation

/// All mutable state is protected by the lock. Every callback belongs to this
/// request, so a delayed native tool can never attach itself to a later request.
internal final class LanguageModelRequest: @unchecked Sendable {
  let id: String
  private let maximumToolCalls: Int
  private let onText: @Sendable (String) -> Void
  private let onTool: @Sendable (String, String, String) -> Void
  private let lock = NSRecursiveLock()
  private var task: Task<String, Error>?
  private var terminalError: LanguageModelException?
  private var isFinished = false
  private var toolCalls = 0
  private var pending: [String: PendingTool] = [:]
  private let builtinTools: [String: LanguageModelBuiltinTool]
  private let images: [String: LanguageModelImage]
  private var responseUsage = LanguageModelUsage()
  private var imageSnapshots: [String: LanguageModelImageContent] = [:]
  private var acceptHistory: (@Sendable () -> Void)?
  private var resultReady = false

  private struct PendingTool {
    let continuation: CheckedContinuation<String, Error>
    let builtin: LanguageModelBuiltinTool?
    let imageLabel: String?
    var didStart = false
    var cancelExecution: (@Sendable () -> Void)?
  }

  init(
    id: String,
    maximumToolCalls: Int,
    builtinTools: [String: LanguageModelBuiltinTool] = [:],
    images: [LanguageModelImage] = [],
    onText: @escaping @Sendable (String) -> Void,
    onTool: @escaping @Sendable (String, String, String) -> Void
  ) {
    self.id = id
    self.maximumToolCalls = maximumToolCalls
    self.builtinTools = builtinTools
    self.images = Dictionary(uniqueKeysWithValues: images.map { ($0.label, $0) })
    self.onText = onText
    self.onTool = onTool
  }

  func bind(_ task: Task<String, Error>) {
    lock.withLock {
      if terminalError != nil || isFinished { task.cancel() } else { self.task = task }
    }
  }

  func checkActive() throws {
    try lock.withLock {
      if let terminalError { throw terminalError }
      guard !isFinished else { throw LanguageModelException.cancelled() }
      if Task.isCancelled { throw LanguageModelException.cancelled() }
    }
  }

  func emitText(_ text: String) throws {
    try lock.withLock {
      try checkActive()
      onText(text)
    }
  }

  func callTool(name: String, argumentsJSON: String) async throws -> String {
    try checkActive()
    let callId = UUID().uuidString
    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        lock.withLock {
          do {
            try checkActive()
            guard toolCalls < maximumToolCalls else {
              throw LanguageModelException("ERR_TOOL_CALL_LIMIT", "The request reached its maximum number of tool calls.")
            }
            let arguments = try LanguageModelJSON.decode(argumentsJSON)
            if builtinTools[name] != nil {
              guard let imageLabel = arguments.object?["image"]?.string, images[imageLabel] != nil else {
                throw LanguageModelException("ERR_TOOL_EXECUTION", "The image tool selected an unknown current-request image label.")
              }
            }
            toolCalls += 1
            pending[callId] = PendingTool(
              continuation: continuation,
              builtin: builtinTools[name],
              imageLabel: arguments.object?["image"]?.string
            )
            onTool(callId, name, argumentsJSON)
          } catch {
            continuation.resume(throwing: error)
          }
        }
      }
    } onCancel: {
      self.reject(callId: callId, error: LanguageModelException.cancelled())
    }
  }

  func resolve(callId: String, output: String?, error: String?) -> Bool {
    lock.withLock {
      guard terminalError == nil, !isFinished,
        let tool = pending.removeValue(forKey: callId)
      else { return false }
      tool.cancelExecution?()
      let continuation = tool.continuation
      if let error {
        continuation.resume(throwing: LanguageModelException("ERR_TOOL_EXECUTION", error))
      } else if let output {
        continuation.resume(returning: output)
      } else {
        continuation.resume(throwing: LanguageModelException.invalid("A tool reply needs output or error."))
      }
      return true
    }
  }

  private func reject(callId: String, error: Error) {
    lock.withLock {
      let tool = pending.removeValue(forKey: callId)
      tool?.cancelExecution?()
      tool?.continuation.resume(throwing: terminalError ?? error)
    }
  }

  func cancel(_ error: LanguageModelException = .cancelled()) {
    lock.withLock {
      guard terminalError == nil, !isFinished || resultReady else { return }
      terminalError = error
      acceptHistory = nil
      resultReady = false
      imageSnapshots.removeAll()
      task?.cancel()
      let callbacks = Array(pending.values)
      pending.removeAll()
      for callback in callbacks {
        callback.cancelExecution?()
        callback.continuation.resume(throwing: error)
      }
    }
  }

  func finish() {
    lock.withLock {
      isFinished = true
      task = nil
      if !resultReady { acceptHistory = nil }
      imageSnapshots.removeAll()
      let callbacks = Array(pending.values)
      pending.removeAll()
      for callback in callbacks {
        callback.cancelExecution?()
        callback.continuation.resume(throwing: LanguageModelException.cancelled())
      }
    }
  }

  /// Keep the completed native history provisional until JavaScript validates and
  /// accepts this exact result. Dropping the closure also releases staged images.
  func stageHistory(_ accept: @escaping @Sendable () -> Void) throws {
    try lock.withLock {
      try checkActive()
      acceptHistory = accept
    }
  }

  func prepareResult() throws {
    try lock.withLock {
      try checkActive()
      resultReady = true
    }
  }

  func acceptResult() -> Bool {
    lock.withLock {
      guard resultReady, terminalError == nil else { return false }
      resultReady = false
      let accept = acceptHistory
      acceptHistory = nil
      accept?()
      return true
    }
  }

  func imageContent(for image: LanguageModelImage) throws -> LanguageModelImageContent {
    if let content = lock.withLock({ imageSnapshots[image.label] }) { return content }
    try checkActive()
    let content: LanguageModelImageContent
    do { content = try LanguageModelImageContent(url: image.url) } catch { throw LanguageModelException.invalid("The image file could not be decoded.") }
    return try lock.withLock {
      try checkActive()
      if let existing = imageSnapshots[image.label] { return existing }
      imageSnapshots[image.label] = content
      return content
    }
  }

  func beginBuiltin(
    callId: String,
    kind: LanguageModelBuiltinTool,
    imageLabel: String,
    cancel: @escaping @Sendable () -> Void
  ) throws -> LanguageModelImage {
    try lock.withLock {
      try checkActive()
      guard var tool = pending[callId], tool.builtin == kind, tool.imageLabel == imageLabel,
        !tool.didStart, let image = images[imageLabel]
      else {
        throw LanguageModelException("ERR_TOOL_EXECUTION", "The built-in tool has no matching active image call.")
      }
      tool.didStart = true
      tool.cancelExecution = cancel
      pending[callId] = tool
      return image
    }
  }

  func checkBuiltin(callId: String) throws {
    try lock.withLock {
      try checkActive()
      guard pending[callId]?.didStart == true else { throw LanguageModelException.cancelled() }
    }
  }

  func recordUsage(_ usage: LanguageModelUsage) throws {
    try lock.withLock {
      try checkActive()
      responseUsage = usage
    }
  }

  var usage: LanguageModelUsage { lock.withLock { responseUsage } }

  var pendingCount: Int { lock.withLock { pending.count } }
}
