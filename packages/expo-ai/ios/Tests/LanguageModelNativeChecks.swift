import ExpoModulesCore
import Foundation
#if !LANGUAGE_MODELS_INTEGRATION_RUNNER
@testable import ExpoAI
#endif

internal enum LanguageModelNativeChecks {
  static func require(_ condition: Bool, _ message: String) throws {
    if !condition { throw LanguageModelException("ERR_TEST_FAILED", message) }
  }

  @MainActor
  static func bridge() async throws {
    let fixture = BridgeFixture()
    defer { fixture.close() }
    try fixture.evaluate("expo.modules.ExpoAI.getAvailabilityAsync(['en'], 'en').then(value => { globalThis.availability = JSON.parse(value); });")
    try await fixture.wait("globalThis.availability !== undefined")
    if #available(iOS 26.0, macOS 26.0, *) {
      try require(try fixture.boolean("['available', 'unavailable', 'not-ready'].includes(availability.status)"), "Invalid native availability response")
    } else {
      try require(try fixture.boolean("availability.status === 'unavailable' && availability.reason === 'unsupported-os'"), "Older OS availability must fail gracefully")
    }
    print("Native availability: \(try fixture.string("JSON.stringify(availability)"))")
    try fixture.evaluate("globalThis.checks = []; globalThis.last = null;")
    try fixture.evaluate("""
      expo.modules.ExpoAI.createSessionAsync('{}').then(session => {
        globalThis.session = session;
        checks.push(session instanceof expo.modules.ExpoAI.LanguageModelSession);
        session.addListener('onText', event => checks.push(event.requestId === 'roundtrip' && event.text === 'partial'));
        session.addListener('onToolCall', event => {
          globalThis.last = event;
          checks.push(event.requestId === 'roundtrip' && event.name === 'lookup' && JSON.parse(event.argumentsJSON).query === 'note');
          checks.push(session.resolveTool(event.callId, 'from JavaScript', null));
          checks.push(!session.resolveTool(event.callId, 'duplicate', null));
        });
        return session.generateAsync('roundtrip', 'tool', '{"stream":true,"maximumToolCalls":1}');
      }).then(value => { globalThis.result = value; }, error => { globalThis.failure = String(error); });
      """)
    try await fixture.wait("typeof globalThis.result === 'string' || !!globalThis.failure")
    try require(try fixture.string("String(globalThis.failure || '')") == "", "Unexpected bridge failure")
    try require(try fixture.string("result") == "from JavaScript", "The JS tool reply did not return to native generation")
    try require(try fixture.boolean("checks.length === 5 && checks.every(Boolean)"), "Class, snapshot, tool arguments, or duplicate reply checks failed")
    try require(try fixture.boolean("session.acceptResult('roundtrip')"), "The bridge result was not ready for acceptance")

    // The inference seam also verifies schema options and raw structured snapshots
    // travel through Expo; this does not execute Foundation Models inference.
    try fixture.evaluate("""
      session.removeAllListeners('onText');
      globalThis.structured = null;
      globalThis.structuredSnapshot = null;
      session.addListener('onText', event => { globalThis.structuredSnapshot = JSON.parse(event.text); });
      session.generateAsync('structured', 'structured', JSON.stringify({
        stream: true,
        schema: { type: 'object', properties: { category: { type: 'string' } }, required: ['category'], additionalProperties: false }
      })).then(value => { globalThis.structured = JSON.parse(value); }, error => { globalThis.failure = String(error); });
      """)
    try await fixture.wait("globalThis.structured !== null || !!globalThis.failure")
    try require(try fixture.boolean("structured.category === 'note' && structuredSnapshot.category === 'note'"), "Structured schema/result/snapshot round trip failed")
    try require(try fixture.boolean("session.acceptResult('structured')"), "The structured result was not ready for acceptance")

    // Exercise the optional metadata bridge with a backend that reports no token
    // counts. Unknown values must cross Hermes as null, never fabricated zeroes.
    try fixture.evaluate("""
      globalThis.metadata = null;
      session.generateWithMetadataAsync('metadata', 'structured', JSON.stringify({
        schema: { type: 'object', properties: { category: { type: 'string' } }, required: ['category'], additionalProperties: false }
      })).then(value => { globalThis.metadata = JSON.parse(value); }, error => { globalThis.failure = String(error); });
      """)
    try await fixture.wait("globalThis.metadata !== null || !!globalThis.failure")
    try require(try fixture.boolean("JSON.parse(metadata.text).category === 'note' && metadata.usage.inputTokens === null && metadata.usage.outputTokens === null"), "Metadata response or unknown token counts did not survive the bridge")
    try require(try fixture.boolean("session.acceptResult('metadata')"), "The metadata result was not ready for acceptance")

    try fixture.evaluate("""
      globalThis.builtinFailure = null;
      session.executeBuiltinToolAsync('forged-call', 'ocr', 'receipt')
        .then(() => { globalThis.builtinFailure = 'unexpected success'; }, error => { globalThis.builtinFailure = error.code; });
      """)
    try await fixture.wait("globalThis.builtinFailure !== null")
    try require(try fixture.string("builtinFailure") == "ERR_TOOL_EXECUTION", "An unapproved image tool call crossed the native bridge")

    // Cancellation must settle a native callback even when JavaScript never replies.
    try fixture.evaluate("""
      session.removeAllListeners('onToolCall');
      session.removeAllListeners('onText');
      globalThis.failure = null;
      session.addListener('onToolCall', event => {
        globalThis.last = event;
        session.cancel(event.requestId);
      });
      session.generateAsync('cancelled', 'tool', '{"maximumToolCalls":1}')
        .then(() => { globalThis.failure = 'unexpected success'; }, error => { globalThis.failure = error.code; });
      """)
    try await fixture.wait("globalThis.failure !== null")
    try require(try fixture.string("failure") == "ERR_REQUEST_CANCELLED", "Cancellation did not reject the JS promise")
    try require(try fixture.boolean("!session.resolveTool(last.callId, 'late', null)"), "Late cancellation reply was accepted")

    // A delayed reply from an old request must not resolve the active request.
    try fixture.evaluate("""
      session.removeAllListeners('onToolCall');
      globalThis.oldCallId = last.callId;
      globalThis.result = null;
      session.addListener('onToolCall', event => {
        globalThis.oldRejected = !session.resolveTool(oldCallId, 'stale', null);
        session.resolveTool(event.callId, 'fresh', null);
      });
      session.generateAsync('next-request', 'tool', '{"maximumToolCalls":1}').then(value => { globalThis.result = value; });
      """)
    try await fixture.wait("globalThis.result !== null")
    try require(try fixture.boolean("oldRejected && result === 'fresh'"), "Old request callback targeted a newer request")
    try require(try fixture.boolean("session.acceptResult('next-request')"), "The reused session result was not ready for acceptance")

    // Test native budget enforcement without relying on the JS wrapper.
    try fixture.evaluate("""
      globalThis.failure = null;
      session.generateAsync('limit', 'tool', '{"maximumToolCalls":0}')
        .then(() => { globalThis.failure = 'unexpected success'; }, error => { globalThis.failure = error.code; });
      """)
    try await fixture.wait("globalThis.failure !== null")
    try require(try fixture.string("failure") == "ERR_TOOL_CALL_LIMIT", "Native tool budget was not enforced")

    // Releasing a JS SharedObject disposes native work and ignores the eventual reply.
    try fixture.evaluate("""
      session.removeAllListeners('onToolCall');
      globalThis.failure = null;
      session.addListener('onToolCall', event => { globalThis.last = event; session.release(); });
      session.generateAsync('released', 'tool', '{"maximumToolCalls":1}')
        .then(() => { globalThis.failure = 'unexpected success'; }, error => { globalThis.failure = error.code; });
      """)
    try await fixture.wait("globalThis.failure !== null")
    try require(try fixture.string("failure") == "ERR_SESSION_DISPOSED", "SharedObject.release did not dispose native work")
  }

  static func lifecycle() async throws {
    let registry = RequestCapture()
    let backend = CapturingBackend(capture: registry)
    let session = LanguageModelSession(backend: backend)
    let pending = Task { try await session.generate(requestId: "first", prompt: "", optionsJSON: "{\"maximumToolCalls\":1}") }
    let request = await registry.next()
    do {
      _ = try await session.generate(requestId: "busy", prompt: "", optionsJSON: "{}")
      throw LanguageModelException("ERR_TEST_FAILED", "Concurrent generation succeeded")
    } catch let error as LanguageModelException { try require(error.code == "ERR_SESSION_BUSY", "Wrong concurrent request error") }
    session.dispose()
    do { _ = try await pending.value; throw LanguageModelException("ERR_TEST_FAILED", "Disposed generation succeeded") }
    catch let error as LanguageModelException { try require(error.code == "ERR_SESSION_DISPOSED", "Wrong disposal error") }
    try require(request.pendingCount == 0, "Disposal left a native continuation pending")
    session.dispose()

    let preCancelled = LanguageModelSession(backend: backend)
    preCancelled.cancel(requestId: "before")
    do {
      _ = try await preCancelled.generate(requestId: "before", prompt: "", optionsJSON: "{}")
      throw LanguageModelException("ERR_TEST_FAILED", "A pre-cancelled request started")
    }
    catch let error as LanguageModelException {
      try require(error.code == "ERR_REQUEST_CANCELLED", "Cancel before AsyncFunction dispatch failed")
    }

    let overflowSession = LanguageModelSession(backend: backend)
    let overflowPending = Task {
      try await overflowSession.generate(requestId: "overflow-active", prompt: "", optionsJSON: "{\"maximumToolCalls\":1}")
    }
    let overflowRequest = await registry.next()
    for index in 0...128 { overflowSession.cancel(requestId: "unmatched-\(index)") }
    do {
      _ = try await overflowPending.value
      throw LanguageModelException("ERR_TEST_FAILED", "Cancellation overflow left active work alive")
    } catch let error as LanguageModelException {
      try require(error.code == "ERR_SESSION_DISPOSED", "Cancellation overflow must fail closed")
    }
    try require(overflowRequest.pendingCount == 0, "Cancellation overflow left a native continuation pending")
    do {
      _ = try await overflowSession.generate(requestId: "unmatched-128", prompt: "", optionsJSON: "{}")
      throw LanguageModelException("ERR_TEST_FAILED", "Cancellation overflow allowed a cancelled queued request to start")
    } catch let error as LanguageModelException {
      try require(error.code == "ERR_SESSION_DISPOSED", "Cancellation overflow did not dispose the session")
    }
  }

  static func resultAcceptance() async throws {
    let backend = HistoryBackend()
    let session = LanguageModelSession(backend: backend)
    defer { session.dispose() }
    try require(!session.acceptResult(requestId: "first"), "An unfinished result was accepted")
    _ = try await session.generate(requestId: "first", prompt: "accepted", optionsJSON: "{}")
    try require(backend.turns.isEmpty, "Generation committed history before JavaScript acceptance")
    try require(!session.acceptResult(requestId: "wrong"), "A different result ID was accepted")
    try require(session.acceptResult(requestId: "first"), "The ready result could not be accepted")
    try require(!session.acceptResult(requestId: "first"), "A result was accepted twice")
    session.discardResult(requestId: "first")
    try require(backend.turns == ["accepted"], "Discarding an accepted result erased history")

    _ = try await session.generate(requestId: "discard", prompt: "rejected", optionsJSON: "{}")
    session.discardResult(requestId: "discard")
    try require(!session.acceptResult(requestId: "discard"), "A discarded result was accepted")
    _ = try await session.generate(requestId: "stale", prompt: "unaccepted", optionsJSON: "{}")
    do {
      _ = try await session.generate(requestId: "busy", prompt: "must not run", optionsJSON: "{}")
      throw LanguageModelException("ERR_TEST_FAILED", "A ready result did not retain session ownership")
    } catch let error as LanguageModelException {
      try require(error.code == "ERR_SESSION_BUSY", "A provisional result returned the wrong busy error")
    }
    session.discardResult(requestId: "stale")
    let next = try await session.generate(requestId: "next", prompt: "latest", optionsJSON: "{}")
    try require(next == "accepted|latest", "An unaccepted result entered the next prompt")
    try require(!session.acceptResult(requestId: "stale"), "A superseded result was accepted")
    try require(session.acceptResult(requestId: "next"), "A stale acceptance altered the ready result")
    try require(backend.turns == ["accepted", "latest"], "Successful native history was not preserved")

    _ = try await session.generate(requestId: "cancel", prompt: "cancelled", optionsJSON: "{}")
    session.cancel(requestId: "cancel")
    try require(!session.acceptResult(requestId: "cancel"), "A cancelled ready result was accepted")
    try require(backend.turns == ["accepted", "latest"], "Cancellation changed committed history")
    _ = try await session.generate(requestId: "dispose", prompt: "disposed", optionsJSON: "{}")
    session.dispose()
    try require(!session.acceptResult(requestId: "dispose"), "Disposal left a result ready for acceptance")
    try require(backend.turns.isEmpty, "Disposal retained accepted native history")
  }

  static func discardWhileActive() async throws {
    let capture = RequestCapture()
    let backend = HistoryBackend(capture: capture)
    let session = LanguageModelSession(backend: backend)
    defer { session.dispose() }
    let pending = Task {
      try await session.generate(requestId: "active", prompt: "waiting", optionsJSON: "{\"maximumToolCalls\":1}")
    }
    let request = await capture.next()
    try require(!session.acceptResult(requestId: "active"), "An active result was accepted before completion")
    session.discardResult(requestId: "wrong")
    try request.checkActive()
    session.discardResult(requestId: "active")
    do {
      _ = try await pending.value
      throw LanguageModelException("ERR_TEST_FAILED", "Discarded active work completed")
    } catch let error as LanguageModelException {
      try require(error.code == "ERR_REQUEST_CANCELLED", "Active discard returned the wrong error")
    }
    try require(!session.acceptResult(requestId: "active"), "Discarded work staged a late result")
    try require(request.pendingCount == 0 && backend.turns.isEmpty, "Discard left tool work or history behind")
    for index in 0..<256 { session.discardResult(requestId: "unknown-\(index)") }
    _ = try await session.generate(requestId: "fresh", prompt: "fresh", optionsJSON: "{}")
    try require(session.acceptResult(requestId: "fresh"), "Unknown discards exhausted cancellation bookkeeping")
  }

  @MainActor
  static func resultAcceptanceBridge() async throws {
    let backend = HistoryBackend()
    let fixture = BridgeFixture(backend: backend)
    defer { fixture.close() }
    try fixture.evaluate("""
      globalThis.historyCheck = null;
      expo.modules.ExpoAI.createSessionAsync('{}').then(async session => {
        globalThis.session = session;
        const first = await session.generateWithMetadataAsync('accepted', 'accepted', '{}');
        const results = [JSON.parse(first).text === 'accepted', !session.acceptResult('wrong'), session.acceptResult('accepted'), !session.acceptResult('accepted')];
        await session.generateAsync('discarded', 'discarded', '{}');
        session.discardResult('discarded');
        results.push(!session.acceptResult('discarded'));
        results.push(await session.generateAsync('next', 'next', '{}') === 'accepted|next');
        results.push(session.acceptResult('next'));
        await session.generateAsync('disposed', 'disposed', '{}');
        session.dispose();
        results.push(!session.acceptResult('disposed'));
        globalThis.historyCheck = results;
      }).catch(error => { globalThis.historyFailure = String(error); });
      """)
    try await fixture.wait("globalThis.historyCheck !== null || globalThis.historyFailure !== undefined")
    try require(try fixture.boolean("historyCheck?.length === 8 && historyCheck.every(Boolean)"), "Result acceptance did not survive the real Expo bridge")
    try require(backend.turns.isEmpty, "Bridge disposal retained accepted native history")
  }

  @MainActor
  static func pausedScheduler() async throws {
    let capture = RequestCapture()
    let fixture = BridgeFixture(backend: CapturingBackend(capture: capture))
    defer { fixture.close() }
    try fixture.startPendingTool(requestId: "paused")
    try await fixture.wait("globalThis.last !== undefined")
    let request = await capture.next()
    try fixture.pauseScheduler()
    try await fixture.waitForQueuedCallback()

    // Preserve queued callbacks while the JS thread is busy longer than the
    // former watchdog. Lack of scheduler progress is not runtime destruction.
    try await Task.sleep(for: .milliseconds(2400))
    do { try request.checkActive() }
    catch {
      throw LanguageModelException("ERR_TEST_FAILED", "A paused JS scheduler disposed a live request: \(error)")
    }
    try require(request.pendingCount == 1, "A paused scheduler lost the pending tool continuation")

    fixture.resumeScheduler()
    try fixture.evaluate("session.resolveTool(last.callId, 'resumed reply', null);")
    try await fixture.wait("globalThis.result !== undefined || globalThis.failure !== undefined")
    try require(try fixture.boolean("result === 'resumed reply' && globalThis.failure === undefined"), "Resuming the scheduler did not complete the tool reply")
    try await fixture.verifySessionReuse()
  }

  @MainActor
  static func cancellationWhileSchedulerPaused(dispose: Bool = false) async throws {
    let capture = RequestCapture()
    let fixture = BridgeFixture(backend: CapturingBackend(capture: capture))
    defer { fixture.close() }
    try fixture.startPendingTool(requestId: "paused-cancellation")
    try await fixture.wait("globalThis.last !== undefined")
    let request = await capture.next()
    let session = try fixture.nativeSession()
    try fixture.pauseScheduler()
    try await fixture.waitForQueuedCallback()

    // Cancellation/disposal must settle native work without needing an answer
    // from the JS scheduler. The JS promise can settle once dispatch resumes.
    if dispose { session.dispose() }
    else { session.cancel(requestId: "paused-cancellation") }
    try require(request.pendingCount == 0, "Cancellation while paused left a native continuation pending")
    let expected = dispose ? "ERR_SESSION_DISPOSED" : "ERR_REQUEST_CANCELLED"
    do {
      try request.checkActive()
      throw LanguageModelException("ERR_TEST_FAILED", "Cancellation while paused left the request active")
    } catch let error as LanguageModelException {
      try require(error.code == expected, "Cancellation while paused returned the wrong native error")
    }

    fixture.resumeScheduler()
    try await fixture.wait("globalThis.failure !== undefined")
    try require(try fixture.string("failure") == expected, "Cancellation while paused returned the wrong JS error")
    try require(try fixture.boolean("!session.resolveTool(last.callId, 'late reply', null)"), "Cancellation while paused accepted a late tool reply")
    if !dispose { try await fixture.verifySessionReuse() }
  }

  @MainActor
  static func moduleTeardown() async throws {
    let capture = RequestCapture()
    let fixture = BridgeFixture(backend: CapturingBackend(capture: capture))
    defer { fixture.close() }
    try fixture.startPendingTool(requestId: "teardown")
    let request = await capture.next()
    try await fixture.wait("globalThis.last !== undefined")
    try require(request.pendingCount == 1, "The teardown test did not reach a pending JS tool callback")

    // Unregistering invokes Expo's existing module-destruction hook. Native
    // cancellation does not require the JavaScript scheduler to make progress.
    try fixture.pauseScheduler()
    try await fixture.waitForQueuedCallback()
    fixture.destroyModule()
    try require(request.pendingCount == 0, "Module teardown left a callback pending")
    fixture.resumeScheduler()
    try await fixture.wait("globalThis.failure !== undefined")
    try require(try fixture.string("failure") == "ERR_SESSION_DISPOSED", "Module teardown did not dispose the request")
    try require(try fixture.boolean("!session.resolveTool(last.callId, 'late reply', null)"), "Module teardown accepted a late tool reply")
  }

  @MainActor
  static func idleSessionAfterModuleTeardown() async throws {
    let backend = CountingBackend()
    let fixture = BridgeFixture(backend: backend)
    defer { fixture.close() }
    try fixture.evaluate("""
      expo.modules.ExpoAI.createSessionAsync('{}')
        .then(session => { globalThis.session = session; });
      """)
    try await fixture.wait("globalThis.session !== undefined")
    let session = try fixture.nativeSession()
    fixture.destroyModule()
    do {
      _ = try await session.generate(requestId: "stale-idle-session", prompt: "", optionsJSON: "{}")
      throw LanguageModelException("ERR_TEST_FAILED", "An idle session generated after module teardown")
    } catch let error as LanguageModelException {
      try require(error.code == "ERR_SESSION_DISPOSED", "An idle session returned the wrong module-teardown error")
    }
    try require(backend.invocationCount == 0, "An idle stale session invoked inference before rejecting")
  }

  static func schemas() throws {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      let schema = try LanguageModelJSON.decode("""
        {"type":"object","properties":{"a_b":{"type":"number","minimum":-1.5,"maximum":2},"a":{"type":"object","properties":{"b":{"type":"integer","minimum":0,"maximum":10}},"additionalProperties":false}},"additionalProperties":false}
        """)
      _ = try LanguageModelSchema.compile(schema, name: "CollisionAndMissingRequired")
      for invalid in [
        "{\"type\":\"number\",\"minimum\":2,\"maximum\":1}",
        "{\"type\":\"integer\",\"minimum\":0.5}",
        "{\"type\":\"integer\",\"maximum\":9007199254740992}",
        "{\"type\":\"array\",\"items\":{\"type\":\"string\"},\"minItems\":true}",
        "{\"type\":\"object\",\"properties\":{},\"required\":[\"missing\"],\"additionalProperties\":false}"
      ] {
        do {
          _ = try LanguageModelSchema.compile(LanguageModelJSON.decode(invalid), name: "Invalid")
          throw LanguageModelException("ERR_TEST_FAILED", "Invalid schema was accepted")
        } catch let error as LanguageModelException { try require(error.code == "ERR_SCHEMA_UNSUPPORTED", "Unexpected schema validation error") }
      }
    }
    #endif
  }
}

private struct BridgeBackend: LanguageModelBackend {
  func generate(prompt: String, options: LanguageModelRequestOptions, request: LanguageModelRequest) async throws -> String {
    if prompt == "structured" {
      guard let schema = options.schema else { throw LanguageModelException.invalid("Missing structured schema") }
      #if canImport(FoundationModels)
      if #available(iOS 26.0, macOS 26.0, *) {
        _ = try LanguageModelSchema.compile(schema, name: "BridgeCheck")
      }
      #endif
      let result = "{\"category\":\"note\"}"
      if options.stream { try request.emitText(result) }
      return result
    }
    if options.stream { try request.emitText("partial") }
    return try await request.callTool(name: "lookup", argumentsJSON: "{\"query\":\"note\"}")
  }
}

private actor RequestCapture {
  private var request: LanguageModelRequest?
  private var waiter: CheckedContinuation<LanguageModelRequest, Never>?
  func put(_ request: LanguageModelRequest) {
    if let waiter { self.waiter = nil; waiter.resume(returning: request) }
    else { self.request = request }
  }
  func next() async -> LanguageModelRequest {
    if let request { self.request = nil; return request }
    return await withCheckedContinuation { waiter = $0 }
  }
}

private struct CapturingBackend: LanguageModelBackend {
  let capture: RequestCapture
  func generate(prompt: String, options: LanguageModelRequestOptions, request: LanguageModelRequest) async throws -> String {
    await capture.put(request)
    return try await request.callTool(name: "lookup", argumentsJSON: "{}")
  }
}

private final class CountingBackend: LanguageModelBackend, @unchecked Sendable {
  private let lock = NSLock()
  private var count = 0
  var invocationCount: Int { lock.withLock { count } }
  func generate(prompt: String, options: LanguageModelRequestOptions, request: LanguageModelRequest) async throws -> String {
    lock.withLock { count += 1 }
    return "unexpected inference"
  }
}

private final class HistoryBackend: LanguageModelBackend, @unchecked Sendable {
  private let lock = NSLock()
  private var accepted: [String] = []
  private let capture: RequestCapture?

  init(capture: RequestCapture? = nil) { self.capture = capture }
  var turns: [String] { lock.withLock { accepted } }
  func dispose() { lock.withLock { accepted.removeAll() } }

  func generate(prompt: String, options: LanguageModelRequestOptions, request: LanguageModelRequest) async throws -> String {
    let candidate = turns + [prompt]
    if prompt == "waiting", let capture {
      await capture.put(request)
      // Deliberately attempt to stage after interruption, as an uncooperative
      // provider might. The request must reject this late write.
      do { _ = try await request.callTool(name: "lookup", argumentsJSON: "{}") } catch {}
    }
    try request.stageHistory { [self] in lock.withLock { accepted = candidate } }
    return candidate.joined(separator: "|")
  }
}

// These small synthetic runtime hosts live for the test process. AppContext adopts
// their Hermes pointers and queued core callbacks may retain adopted wrappers even
// after context.destroy. Keeping the owners valid is required by that API; this
// fixture tests context/scheduler teardown, not Hermes-owner destruction or leaks.
private final class HermesTestHost: @unchecked Sendable {
  let owner = ExpoRuntime()
  private let lock = NSLock()
  private var isOpen = true
  private var isPaused = false
  private var callbacks: [CallbackBlock] = []

  func close() {
    lock.withLock {
      isOpen = false
      callbacks.removeAll()
    }
  }

  func pause() { lock.withLock { isPaused = true } }

  func resume() {
    lock.withLock { isPaused = false }
    DispatchQueue.main.async { self.drain() }
  }

  var queuedCount: Int { lock.withLock { callbacks.count } }

  func enqueue(_ callback: @escaping @convention(block) () -> Void) {
    lock.withLock {
      if isOpen { callbacks.append(CallbackBlock(callback)) }
    }
    DispatchQueue.main.async { self.drain() }
  }

  private func drain() {
    while let callback = lock.withLock({ () -> CallbackBlock? in
      guard isOpen, !isPaused, !callbacks.isEmpty else { return nil }
      return callbacks.removeFirst()
    }) {
      callback.value?()
    }
  }
}

private final class CallbackBlock: @unchecked Sendable {
  var value: (@convention(block) () -> Void)?
  init(_ value: @escaping @convention(block) () -> Void) {
    self.value = value
  }
  deinit { value = nil }
}

private typealias ScheduleFunction = @convention(c) (UnsafeMutableRawPointer, Int32, @escaping @convention(block) () -> Void) -> Void
private let dispatchToMain: ScheduleFunction = { handle, _, callback in
  let host = Unmanaged<HermesTestHost>.fromOpaque(handle).takeUnretainedValue()
  host.enqueue(callback)
}

/// Owns real Hermes + ExpoRuntime and a serial host scheduler. The injected backend
/// replaces only model inference; class conversion, events and promises are Expo's.
@MainActor
private final class BridgeFixture {
  private static var processHosts: [HermesTestHost] = []
  let context: AppContext
  private var hosts: [HermesTestHost] = []

  init(backend: any LanguageModelBackend = BridgeBackend()) {
    Thread.current.name = "com.facebook.react.runtime.JavaScript"
    context = AppContext()
    installRuntime()
    context.moduleRegistry.register(module: ExpoAIModule(appContext: context, backend: backend), name: nil)
  }

  private func installRuntime() {
    let host = HermesTestHost()
    Self.processHosts.append(host)
    hosts.append(host)
    host.owner.withUnsafePointee { pointer in
      context.setRuntime(pointer, scheduler: Unmanaged.passUnretained(host).toOpaque(), dispatch: unsafeBitCast(dispatchToMain, to: UnsafeRawPointer.self))
    }
  }

  func evaluate(_ script: String) throws {
    try JavaScriptActor.assumeIsolated { _ = try context.runtime.eval(script) }
  }

  func boolean(_ script: String) throws -> Bool {
    try JavaScriptActor.assumeIsolated { try context.runtime.eval(script).asBool() }
  }

  func string(_ script: String) throws -> String {
    try JavaScriptActor.assumeIsolated { try context.runtime.eval(script).asString() }
  }

  func wait(_ condition: String) async throws {
    for _ in 0..<200 {
      if try boolean(condition) { return }
      try await Task.sleep(for: .milliseconds(10))
    }
    throw LanguageModelException("ERR_TEST_FAILED", "The JavaScript promise did not settle within 2 seconds.")
  }

  func startPendingTool(requestId: String) throws {
    try evaluate("""
      expo.modules.ExpoAI.createSessionAsync('{}').then(session => {
        globalThis.session = session;
        session.addListener('onToolCall', event => { globalThis.last = event; });
        session.generateAsync('\(requestId)', '', '{"maximumToolCalls":1}')
          .then(value => {
            if (!session.acceptResult('\(requestId)')) throw new Error('Result acceptance failed');
            globalThis.result = value;
          }, error => { globalThis.failure = error.code; });
      });
      """)
  }

  func nativeSession() throws -> LanguageModelSession {
    try JavaScriptActor.assumeIsolated {
      let object = try context.runtime.eval("session").asObject()
      guard let session = try SharedObject.native(from: object) as? LanguageModelSession else {
        throw LanguageModelException("ERR_TEST_FAILED", "The JS session did not resolve to its native SharedObject")
      }
      return session
    }
  }

  func waitForQueuedCallback() async throws {
    for _ in 0..<200 {
      if hosts.last?.queuedCount ?? 0 > 0 { return }
      try await Task.sleep(for: .milliseconds(10))
    }
    throw LanguageModelException("ERR_TEST_FAILED", "No callback reached the paused JS scheduler")
  }

  func verifySessionReuse() async throws {
    try evaluate("""
      session.removeAllListeners('onToolCall');
      session.addListener('onToolCall', event => session.resolveTool(event.callId, 'next reply', null));
      globalThis.result = undefined;
      globalThis.failure = undefined;
      session.generateAsync('after-pause', '', '{"maximumToolCalls":1}')
        .then(value => {
          if (!session.acceptResult('after-pause')) throw new Error('Result acceptance failed');
          globalThis.result = value;
        }, error => { globalThis.failure = error.code; });
      """)
    try await wait("globalThis.result !== undefined || globalThis.failure !== undefined")
    try LanguageModelNativeChecks.require(try boolean("result === 'next reply' && globalThis.failure === undefined"), "The explicit session was not usable after scheduler recovery")
  }

  func destroyModule() { context.moduleRegistry.unregister(moduleName: "ExpoAI") }
  func pauseScheduler() throws {
    hosts.last?.pause()
    // Queue an explicit sentinel so the fixture does not depend on production
    // liveness checks scheduling callbacks. Resuming drains it in FIFO order.
    try JavaScriptActor.assumeIsolated { try context.runtime.schedule {} }
  }
  func resumeScheduler() { hosts.last?.resume() }
  func stopScheduler() { hosts.forEach { $0.close() } }
  func close() {
    destroyModule()
    context.destroy()
    stopScheduler()
  }
}
