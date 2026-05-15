/**
 Unsafe wrapper to make non-Sendable types shareable across concurrency domains without compiler enforcement.
 Use with extreme caution as it bypasses Swift's concurrency safety checks.
 */
internal final class NonisolatedUnsafeVar<VarType>: Sendable {
  nonisolated(unsafe) var value: VarType! = nil

  init() {}

  init(_ value: VarType) {
    self.value = value
  }
}
