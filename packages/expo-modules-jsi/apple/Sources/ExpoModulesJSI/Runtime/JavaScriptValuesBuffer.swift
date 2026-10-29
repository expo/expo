internal import ExpoModulesJSI_Cxx
internal import jsi

/// A buffer that stores instances of `facebook.jsi.Value` with the ability to convert them to `JavaScriptValue` on element access
/// without the need to create a new container (e.g. `std.vector<facebook.jsi.Value>` or `[JavaScriptValue]`).
/// Used mainly to pass function arguments from C++ to Swift.
// `@frozen` so client modules, which consume a buffer in every host function closure, can destroy it
// with a direct call to its `deinit` instead of a metadata accessor plus a value witness dispatch.
@frozen
public struct JavaScriptValuesBuffer: JavaScriptType, ~Copyable {
  // MARK: - Layout

  // Every stored property below is part of the frozen layout: adding, removing or reordering one
  // changes the ABI that client modules compiled against, and each type has to be public, which is
  // why the storage is kept as a raw pointer and rebuilt into its C++ view on access.

  // Safe to use unowned: the buffer's lifetime is scoped to a host function call,
  // so the runtime is always alive while the buffer exists.
  //
  // `unowned(unsafe)` rather than `unowned`: a plain pointer store and load, with no reference
  // counting on every buffer construction and destruction.
  internal unowned(unsafe) let runtime: JavaScriptRuntime

  // The start of the storage, type-erased because `facebook.jsi.Value` is not a public type.
  internal nonisolated(unsafe) let start: UnsafeMutableRawPointer?

  /// The number of values in the buffer.
  public let count: Int

  internal let ownsMemory: Bool

  // MARK: - C++ views

  // `IRuntime` is an immortal reference (`jsi.apinotes`) and `runtime` is `unowned(unsafe)`, so this is
  // two plain loads with no reference counting.
  internal var iRuntime: facebook.jsi.IRuntime {
    return runtime.pointee
  }

  internal var bufferPointer: UnsafeMutableBufferPointer<facebook.jsi.Value> {
    return UnsafeMutableBufferPointer(start: start?.assumingMemoryBound(to: facebook.jsi.Value.self), count: count)
  }

  /// A pointer to the first value of the buffer.
  /// If the baseAddress of this buffer is `nil`, the `count` is zero.
  internal var baseAddress: UnsafePointer<facebook.jsi.Value>? {
    return UnsafePointer(bufferPointer.baseAddress)
  }

  /// A type-erased raw pointer to the first value of the buffer, suitable for
  /// passing across Swift/ObjC++ boundaries where `facebook.jsi.Value` cannot
  /// appear in a public signature.
  public var rawBaseAddress: UnsafeRawPointer? {
    return start.map { UnsafeRawPointer($0) }
  }

  internal init(
    _ runtime: JavaScriptRuntime,
    buffer: consuming UnsafeMutableBufferPointer<facebook.jsi.Value>,
    ownsMemory: Bool = false
  ) {
    self.runtime = runtime
    self.start = UnsafeMutableRawPointer(buffer.baseAddress)
    self.count = buffer.count
    self.ownsMemory = ownsMemory
  }

  internal init(_ runtime: JavaScriptRuntime, start: consuming UnsafePointer<facebook.jsi.Value>?, count: Int) {
    self.init(
      runtime,
      buffer: UnsafeMutableBufferPointer(start: UnsafeMutablePointer(mutating: start), count: count),
      ownsMemory: false
    )
  }

  internal init(_ runtime: JavaScriptRuntime, buffer: consuming UnsafeBufferPointer<facebook.jsi.Value>) {
    self.init(runtime, buffer: UnsafeMutableBufferPointer(mutating: buffer), ownsMemory: false)
  }

  deinit {
    if ownsMemory {
      // Run the destructor for each `jsi::Value` so they release their strong refs to JS objects.
      // Without this, calling host functions through this buffer leaks every JS-object argument.
      bufferPointer.deinitialize()
      bufferPointer.deallocate()
    }
  }

  public subscript(index: Int) -> JavaScriptValue {
    return JavaScriptValue(runtime, copying: bufferPointer[index])
  }

  /// Returns a non-owning, non-copyable value borrowing the element at `index` for the zero-copy decode
  /// path. It borrows the `jsi::Value` this buffer owns, so it is valid only while the buffer is alive
  /// and must not be stored or escaped — see ``JavaScriptUnownedValue``.
  ///
  /// Unlike `subscript(_:)`, this is unchecked: `index` must be in `0..<count`. The accessor force-unwraps
  /// `baseAddress`, so passing any index into an empty buffer crashes, and an out-of-range index reads past
  /// the buffer. The caller is responsible for the bounds check.
  public func unownedValue(at index: Int) -> JavaScriptUnownedValue {
    return JavaScriptUnownedValue(iRuntime, bufferPointer.baseAddress! + index)
  }

  @discardableResult
  internal consuming func set<T: JSIRepresentable>(value: borrowing T, atIndex index: Int) -> JavaScriptValuesBuffer
  where T: ~Copyable {
    guard (0..<count).contains(index) else {
      FatalError.valuesBufferIndexOutRange(index: index, capacity: count)
    }
    bufferPointer.initializeElement(at: index, to: value.toJSIValue(in: iRuntime))
    return self
  }

  @JavaScriptActor
  public func map<T>(_ transform: @JavaScriptActor (_ value: borrowing JavaScriptValue, _ index: Int) throws -> T)
    rethrows -> [T]
  {
    var result: [T] = []
    result.reserveCapacity(count)
    for index in 0..<count {
      let value = self[index]
      let transformed = try transform(value, index)
      result.append(transformed)
    }
    return result
  }

  /// Allocates a new buffer of the same capacity with copies of `facebook.jsi.Value` it stores.
  @JavaScriptActor
  public func copy() -> JavaScriptValuesBuffer {
    let bufferCopy = JavaScriptValuesBuffer.copying(in: runtime, buffer: bufferPointer)
    return JavaScriptValuesBuffer(runtime, buffer: bufferCopy, ownsMemory: true)
  }

  // MARK: - JavaScriptType

  public func asValue() -> JavaScriptValue {
    // TODO: Should we return an array or array buffer instead?
    FatalError.valuesBufferNotRepresentable()
  }

  // MARK: - Allocation

  /// Allocates new values buffer with the given capacity. Each value is `undefined` until you replace
  /// it with ``emplace(_:at:)`` or ``emplace(_:at:in:)``.
  public static func allocate(in runtime: JavaScriptRuntime, capacity: Int) -> JavaScriptValuesBuffer {
    return allocateUndefined(in: runtime, count: capacity)
  }

  /// Allocates an owning buffer of `count` undefined values, which ``emplace(_:at:)`` then replaces.
  /// Allocates nothing for zero values.
  @usableFromInline
  internal static func allocateUndefined(in runtime: JavaScriptRuntime, count: Int) -> JavaScriptValuesBuffer {
    if count == 0 {
      return JavaScriptValuesBuffer(runtime, start: nil, count: 0)
    }
    let buffer = UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: count)
    for index in 0..<count {
      buffer.initializeElement(at: index, to: .undefined())
    }
    return JavaScriptValuesBuffer(runtime, buffer: buffer, ownsMemory: true)
  }

  /// Calls `body` with a buffer of `count` values that lives on the stack. Each value is `undefined`
  /// until `emplaceValues` replaces it, and all values are destroyed when `body` returns.
  @inline(__always)
  internal static func withEmplacedValues<R: ~Copyable>(
    count: Int,
    in runtime: JavaScriptRuntime,
    emplacing emplaceValues:
      @JavaScriptActor (borrowing JavaScriptValuesBuffer, borrowing JavaScriptRuntime) throws -> Void,
    _ body: (consuming JavaScriptValuesBuffer) throws -> R
  ) throws -> R {
    // The slots hold `undefined` first, so they stay valid to destroy when an encode throws. This part
    // is nonisolated: an isolated closure passed to the standard library checks the current executor
    // on every call.
    return try withUnsafeTemporaryAllocation(of: facebook.jsi.Value.self, capacity: count) { storage in
      let start = storage.baseAddress
      if let start {
        for index in 0..<count {
          expo.emplaceUndefined(start + index)
        }
      }
      defer {
        if let start {
          expo.destroyValues(start, count)
        }
      }
      let buffer = JavaScriptValuesBuffer(runtime, start: start, count: count)
      try JavaScriptActor.assumeIsolated {
        try emplaceValues(buffer, runtime)
      }
      return try body(buffer)
    }
  }

  /// Moves `value` into the buffer at `index`, without a clone, and releases the value it replaces.
  public func emplace(_ value: consuming JavaScriptValue, at index: Int) {
    guard (0..<count).contains(index) else {
      FatalError.valuesBufferIndexOutRange(index: index, capacity: count)
    }
    let slot = bufferPointer.baseAddress! + index
    // `write` constructs the new value in place, so the old one is destroyed first. Values that own
    // nothing, such as the `undefined` in a fresh slot, skip the destroy.
    expo.destroyValues(slot, 1)
    JavaScriptValue.write(value, to: slot)
  }

  /// Encodes `value` in `runtime`, moves it into the buffer at `index`, and releases the value it
  /// replaces.
  @inlinable
  @JavaScriptActor
  public func emplace<T: JavaScriptEncodable & ~Copyable>(
    _ value: consuming T,
    at index: Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    // Inlinable, so the encode specializes in the caller's module. The runtime comes from the caller:
    // the buffer's runtime is `unowned(unsafe)`, and passing it to the encode retains and releases it.
    try T.encode(value, into: emptySlot(at: index), in: runtime)
  }

  /// Moves the value that `encode` writes into the slot at `index` into the buffer, and releases the value it
  /// replaces, for a value that has no `JavaScriptEncodable` conformance to pass to `emplace(_:at:in:)`, such
  /// as a tuple. `encode` must write exactly one value unless it throws (see ``JavaScriptValue/Slot``).
  @JavaScriptActor
  public func emplace(at index: Int, encodingWith encode: (borrowing JavaScriptValue.Slot) throws -> Void) rethrows {
    try encode(emptySlot(at: index))
  }

  /// Releases the value at `index` and returns its slot, which holds `undefined` until an encode writes
  /// into it. `undefined` owns nothing, so the encode may construct its value over it, and the slot stays
  /// valid when the encode throws.
  @usableFromInline
  internal func emptySlot(at index: Int) -> JavaScriptValue.Slot {
    guard (0..<count).contains(index) else {
      FatalError.valuesBufferIndexOutRange(index: index, capacity: count)
    }
    let slot = bufferPointer.baseAddress! + index
    expo.destroyValues(slot, 1)
    expo.emplaceUndefined(slot)
    return JavaScriptValue.Slot(slot)
  }

  /// Encodes `value` into the slot at `index`, which must hold a value that owns nothing, such as
  /// `undefined`.
  @usableFromInline
  @JavaScriptActor
  internal func encode<A: JavaScriptEncodable>(_ value: consuming A, at index: Int, in runtime: JavaScriptRuntime)
    throws
  {
    // Not inlinable: here the encoded `JavaScriptValue` has a known layout, while a caller in another
    // module handles it through its type metadata. It's called in a parameter pack loop, where a
    // generic call doesn't specialize anyway.
    emplace(try A.encode(value, in: runtime), at: index)
  }

  /// Allocates new values buffer with the given JS representables.
  /// Note that parameter packs still do not support non-copyable types so they need to be passed as `JavaScriptRef`.
  public static func allocate<each T: JavaScriptRepresentable>(
    in runtime: JavaScriptRuntime,
    with values: repeat each T
  ) -> JavaScriptValuesBuffer {
    // First we count parameters in a pack to find the proper buffer capacity. This is still the simplest way.
    var capacity = 0
    for _ in repeat each values {
      capacity += 1
    }

    // Allocate the buffer
    let buffer = UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: capacity)
    var index: Int = 0

    // Iterate over the values again to initialize buffer's elements
    for value in repeat each values {
      if let value = value as? JSIRepresentable {
        buffer.initializeElement(at: index, to: value.toJSIValue(in: runtime.pointee))
      } else {
        buffer.initializeElement(at: index, to: value.toJavaScriptValue(in: runtime).toJSIValue(in: runtime.pointee))
      }
      index += 1
    }
    return JavaScriptValuesBuffer(runtime, buffer: buffer, ownsMemory: true)
  }

  internal static func copying(in runtime: JavaScriptRuntime, buffer: UnsafeMutableBufferPointer<facebook.jsi.Value>)
    -> UnsafeMutableBufferPointer<facebook.jsi.Value>
  {
    let copy = UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: buffer.count)
    for index in 0..<buffer.count {
      copy.initializeElement(at: index, to: facebook.jsi.Value(runtime.pointee, buffer[index]))
    }
    return copy
  }

  /// Allocates a new owning buffer holding a runtime-aware copy of each referenced value's
  /// underlying `facebook.jsi.Value`. The values are passed through `JavaScriptValue.Ref`, because a
  /// non-copyable value cannot be a Swift array element. They must all belong to `runtime` or be
  /// runtime-free; mixing runtimes will crash deep inside JSI. An empty reference yields `undefined`.
  @JavaScriptActor
  public static func copying(in runtime: JavaScriptRuntime, values: [JavaScriptValue.Ref]) -> JavaScriptValuesBuffer {
    let buffer = UnsafeMutableBufferPointer<facebook.jsi.Value>.allocate(capacity: values.count)
    for (index, ref) in values.enumerated() {
      let jsiValue = ref.withUnwrappedValue { (value: borrowing JavaScriptValue) -> facebook.jsi.Value in
        // Runtime-free values (undefined, null, booleans and numbers) have no handle and fit any runtime.
        assert(
          value.belongs(to: runtime),
          "JavaScriptValue belongs to a different runtime than the buffer being initialized"
        )
        return value.toJSIValue(in: runtime.pointee)
      }
      buffer.initializeElement(at: index, to: jsiValue ?? .undefined())
    }
    return JavaScriptValuesBuffer(runtime, buffer: buffer, ownsMemory: true)
  }
}
