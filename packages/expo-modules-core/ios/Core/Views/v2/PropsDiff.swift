// Copyright 2026-present 650 Industries. All rights reserved.

/// The props of a view before and after an update, and which props the update changed. `@ViewProps`
/// names it `Props.Diff`.
///
/// It reads the props from the decoded props that the view had and gets now, so applying an update
/// copies no props struct.
public struct PropsDiff<Props: AnyViewProps> {
  @usableFromInline
  internal let old: DecodedViewProps<Props>?

  @usableFromInline
  internal let new: DecodedViewProps<Props>

  /// The props that changed since the props that the view had. All props when the props are applied for
  /// the first time.
  public let changedProps: Props.PropSet

  internal init(old: DecodedViewProps<Props>?, new: DecodedViewProps<Props>) {
    self.old = old
    self.new = new
    self.changedProps = new.changedProps(since: old)
  }

  /// The props after the update.
  @inlinable
  public var newProps: Props {
    _read {
      // Lends the stored props for the length of the access instead of returning a copy, so
      // `diff.newProps.title` doesn't copy the whole struct with a retain for each of its references.
      yield new.props
    }
  }

  /// Whether the props are applied for the first time.
  @inlinable
  public var isInitial: Bool {
    return old == nil
  }

  /// Whether the update changed any of the given props, for example `diff.changed(.color)` or
  /// `diff.changed([.color, .radius])`.
  @inlinable
  public func changed(_ props: Props.PropSet) -> Bool {
    return !changedProps.isDisjoint(with: props)
  }

  /// Returns the value of a prop before the update, or `nil` when the props are applied for the first time.
  @inlinable
  public func oldValue<Value>(_ keyPath: KeyPath<Props, Value>) -> Value? {
    return old?.props[keyPath: keyPath]
  }

  /// The names of the changed props, in declaration order.
  @inlinable
  public var changedNames: [Props.PropName] {
    return Props.PropName.allCases.filter { changedProps.contains(Props.propSet(for: $0)) }
  }
}
