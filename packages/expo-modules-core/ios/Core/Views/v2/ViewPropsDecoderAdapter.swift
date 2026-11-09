// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// Adapts a ``ViewPropsDecoder`` to `ViewPropsDecoding`, which the C++ component descriptor of the view
/// type calls. It holds the decoder's methods as closures that its inlinable initializer builds, so they
/// are specialized for the props type in the module that creates the adapter.
public final class ViewPropsDecoderAdapter: NSObject, ViewPropsDecoding, @unchecked Sendable {
  @usableFromInline
  internal let decodeProps: @Sendable (UnsafeRawPointer, UnsafeRawPointer, Any?) -> AnyObject?

  @usableFromInline
  internal let decodeValues: @Sendable (
    UnsafePointer<UnsafeRawPointer>, UnsafePointer<Int>, Int, UnsafeRawPointer, Any?
  ) -> AnyObject?

  @usableFromInline
  internal let skipProps: @Sendable ([String]) -> Void

  public let propNames: [String]

  // A designated initializer of a class can't be `@inlinable` with library evolution (the precompiled
  // XCFrameworks), so the inlinable initializer below builds the closures and delegates to this one.
  @usableFromInline
  internal init(
    decodeProps: @escaping @Sendable (UnsafeRawPointer, UnsafeRawPointer, Any?) -> AnyObject?,
    decodeValues: @escaping @Sendable (
      UnsafePointer<UnsafeRawPointer>, UnsafePointer<Int>, Int, UnsafeRawPointer, Any?
    ) -> AnyObject?,
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
      decodeProps: { propsPointer, runtimePointer, previous in
        // Only this decoder makes the decoded props of its descriptor, so the previous props are always
        // `DecodedViewProps<Props>`. `unsafeDowncast` checks it in debug builds.
        return decoder.decode(
          propsPointer: propsPointer,
          runtimePointer: runtimePointer,
          previous: previous.map { unsafeDowncast($0 as AnyObject, to: DecodedViewProps<Props>.self) }
        )
      },
      decodeValues: { valuePointers, indexes, count, runtimePointer, previous in
        return decoder.decode(
          valuePointers: valuePointers,
          indexes: indexes,
          count: count,
          runtimePointer: runtimePointer,
          previous: previous.map { unsafeDowncast($0 as AnyObject, to: DecodedViewProps<Props>.self) }
        )
      },
      skipProps: { decoder.didSkipProps($0) },
      propNames: decoder.propNameStrings
    )
  }

  public func decode(propsPointer: UnsafeRawPointer, runtimePointer: UnsafeRawPointer, previous: Any?) -> Any? {
    return decodeProps(propsPointer, runtimePointer, previous)
  }

  public func decode(
    valuePointers: UnsafePointer<UnsafeRawPointer>,
    indexes: UnsafePointer<Int>,
    count: Int,
    runtimePointer: UnsafeRawPointer,
    previous: Any?
  ) -> Any? {
    return decodeValues(valuePointers, indexes, count, runtimePointer, previous)
  }

  public func didSkipProps(_ propNames: [String]) {
    skipProps(propNames)
  }
}
