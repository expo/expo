// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// Adapts a ``ViewPropsDecoder`` to `ViewPropsDecoding`, which the C++ component descriptor of the view
/// type calls. It holds the decoder's methods as closures that its inlinable initializer builds, so they
/// are specialized for the props type in the module that creates the adapter.
public final class ViewPropsDecoderAdapter: NSObject, ViewPropsDecoding, @unchecked Sendable {
  @usableFromInline
  internal let decodeProps: @Sendable (UnsafeRawPointer, UnsafeRawPointer, UnsafeRawPointer?) -> UnsafeRawPointer?

  @usableFromInline
  internal let decodeValues: @Sendable (
    UnsafePointer<UnsafeRawPointer>, UnsafePointer<Int>, Int, UnsafeRawPointer, UnsafeRawPointer?
  ) -> UnsafeRawPointer?

  @usableFromInline
  internal let skipProps: @Sendable ([String]) -> Void

  public let propNames: [String]

  // A designated initializer of a class can't be `@inlinable` with library evolution (the precompiled
  // XCFrameworks), so the inlinable initializer below builds the closures and delegates to this one.
  @usableFromInline
  internal init(
    decodeProps: @escaping @Sendable (UnsafeRawPointer, UnsafeRawPointer, UnsafeRawPointer?) -> UnsafeRawPointer?,
    decodeValues: @escaping @Sendable (
      UnsafePointer<UnsafeRawPointer>, UnsafePointer<Int>, Int, UnsafeRawPointer, UnsafeRawPointer?
    ) -> UnsafeRawPointer?,
    skipProps: @escaping @Sendable ([String]) -> Void,
    propNames: [String]
  ) {
    self.decodeProps = decodeProps
    self.decodeValues = decodeValues
    self.skipProps = skipProps
    self.propNames = propNames
    super.init()
  }

  /// `@inlinable`, so the closures and the `decode` that they call are specialized for `Props` in the
  /// module that creates the decoder, where the props type is known.
  @inlinable
  public convenience init<Props: AnyViewProps>(_ decoder: ViewPropsDecoder<Props>) {
    self.init(
      decodeProps: { propsPointer, runtimePointer, previousPointer in
        let previous = decodedViewProps(Props.self, at: previousPointer)
        return retainedPointer(
          to: decoder.decode(propsPointer: propsPointer, runtimePointer: runtimePointer, previous: previous),
          unlessIdenticalTo: previous
        )
      },
      decodeValues: { valuePointers, indexes, count, runtimePointer, previousPointer in
        let previous = decodedViewProps(Props.self, at: previousPointer)
        return retainedPointer(
          to: decoder.decode(
            valuePointers: valuePointers,
            indexes: indexes,
            count: count,
            runtimePointer: runtimePointer,
            previous: previous
          ),
          unlessIdenticalTo: previous
        )
      },
      skipProps: { decoder.didSkipProps($0) },
      propNames: decoder.propNameStrings
    )
  }

  public func decode(
    propsPointer: UnsafeRawPointer,
    runtimePointer: UnsafeRawPointer,
    previous: UnsafeRawPointer?
  ) -> UnsafeRawPointer? {
    return decodeProps(propsPointer, runtimePointer, previous)
  }

  public func decode(
    valuePointers: UnsafePointer<UnsafeRawPointer>,
    indexes: UnsafePointer<Int>,
    count: Int,
    runtimePointer: UnsafeRawPointer,
    previous: UnsafeRawPointer?
  ) -> UnsafeRawPointer? {
    return decodeValues(valuePointers, indexes, count, runtimePointer, previous)
  }

  public func didSkipProps(_ propNames: [String]) {
    skipProps(propNames)
  }
}

/// The decoded props at an unretained pointer from the component descriptor. Only the adapter of the
/// view type makes the decoded props of its descriptor, so they're always `DecodedViewProps<Props>`.
/// `unsafeDowncast` checks that in debug builds and costs nothing in optimized builds.
@inlinable
internal func decodedViewProps<Props: AnyViewProps>(
  _ propsType: Props.Type,
  at pointer: UnsafeRawPointer?
) -> DecodedViewProps<Props>? {
  guard let pointer else {
    return nil
  }
  let object = Unmanaged<AnyObject>.fromOpaque(pointer).takeUnretainedValue()
  return unsafeDowncast(object, to: DecodedViewProps<Props>.self)
}

/// Passes new decoded props to the component descriptor, which takes over one retain, or `nil` when the
/// decode changed no prop.
@inlinable
internal func retainedPointer<Props: AnyViewProps>(
  to decoded: DecodedViewProps<Props>?,
  unlessIdenticalTo previous: DecodedViewProps<Props>?
) -> UnsafeRawPointer? {
  guard let decoded, decoded !== previous else {
    return nil
  }
  return UnsafeRawPointer(Unmanaged.passRetained(decoded).toOpaque())
}
