// `Task.immediate` is a pretty useful API that lets us immediately switch from synchronous to asynchronous context.
// Read the proposal for more: https://github.com/swiftlang/swift-evolution/blob/main/proposals/0472-task-start-synchronously-on-caller-context.md
// Unfortunately, it is available only as of Apple OS 26.0 and there are no plans to backport it yet.
// Here we provide a runtime polyfill that uses the non-immediate Task instead (resulting in an initial delay).
extension Task where Failure == any Error {
  @discardableResult
  public static func immediate_polyfill(
    name: String? = nil,
    priority: TaskPriority? = nil,
    @_inheritActorContext @_implicitSelfCapture operation: sending @escaping @isolated(any) () async throws -> Success
  ) -> Task<Success, any Error> {
    if #available(macOS 26.0, iOS 26.0, watchOS 26.0, tvOS 26.0, *) {
      return Task.immediate(name: name, priority: priority, operation: operation)
    } else {
      // In the polyfill always use the highest priority and hope it executes earlier.
      return Task(name: name, priority: .high, operation: operation)
    }
  }
}
