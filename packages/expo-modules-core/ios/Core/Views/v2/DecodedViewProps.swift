// Copyright 2026-present 650 Industries. All rights reserved.

/// The props of a view as `ViewPropsDecoder` decoded them. Immutable: each decode that changes a prop
/// makes a new one from the previous one.
///
/// Fabric doesn't mount every props update: when React commits again before the previous commit is
/// mounted, the view goes from its mounted props straight to the newest ones. So the view can't use
/// the props that the last decode changed. It asks which props changed since its mounted props with
/// ``changedProps(since:)``, which compares the revision in which each prop last changed.
///
/// `Props` has no `AnyViewProps` constraint on the class, only on the extension below. The decode code is specialized
/// for a concrete props type, and it builds this type from its mangled name. With the constraint, the mangled name has
/// a conformance requirement, and the Swift runtime looks up the conformance on the first decode of each view type.
public final class DecodedViewProps<Props>: @unchecked Sendable {
  /// The props.
  public let props: Props

  /// The dispatcher that the event props are bound to, or `nil` when the props have no events. Each decode from
  /// previous props keeps the dispatcher of the previous props.
  @usableFromInline
  internal let events: ViewEventDispatcher?

  /// The revision of the decode that last changed each prop, by the index of its bit in `Props.PropSet`. Each decode
  /// takes the next value of one counter that all decodes share, so two decodes don't have the same revision, even when
  /// they start from the same previous props.
  @usableFromInline
  internal let propRevisions: [UInt64]

  // A designated initializer of a class can't be `@inlinable` with library evolution (the precompiled
  // XCFrameworks), so the inlinable initializer below computes the values and delegates to this one.
  @usableFromInline
  internal init(
    props: Props,
    events: ViewEventDispatcher?,
    propRevisions: [UInt64]
  ) {
    self.props = props
    self.events = events
    self.propRevisions = propRevisions
  }
}

extension DecodedViewProps where Props: AnyViewProps {
  /// Creates the next decode of `previous`, or the first decode of a lineage when `previous` is `nil`. Then `events` is
  /// the dispatcher that the event props of `props` are bound to. Later decodes take the one of `previous`.
  @inlinable
  internal convenience init(
    props: Props,
    changedProps: Props.PropSet,
    previous: DecodedViewProps<Props>?,
    events: ViewEventDispatcher? = nil
  ) {
    let revision = nextViewPropsRevision()
    guard let previous else {
      // `allProps` has one bit for each prop. `PropName.allCases` would make an array on each call.
      self.init(
        props: props,
        events: events,
        propRevisions: Array(repeating: revision, count: Props.allProps.rawValue.nonzeroBitCount)
      )
      return
    }
    var propRevisions = previous.propRevisions
    // Visits only the changed props, one set bit at a time.
    var changedBits = changedProps.rawValue
    while changedBits != 0 {
      propRevisions[changedBits.trailingZeroBitCount] = revision
      changedBits &= changedBits - 1
    }
    self.init(
      props: props,
      events: previous.events,
      propRevisions: propRevisions
    )
  }

  /// Returns the props that can have other values than in `older`: the props whose last change came from a different
  /// decode. All props when `older` is `nil` or has no decode in common with these props, for example the props of a
  /// recycled view.
  ///
  /// `older` doesn't have to be an earlier decode of these props. Fabric decodes from more than one copy of a view's
  /// props: React's copy, and the committed one after `setNativeProps` or Reanimated's commits.
  @inlinable
  public func changedProps(since older: DecodedViewProps<Props>?) -> Props.PropSet {
    guard let older else {
      return Props.allProps
    }
    var changedProps = Props.PropSet()
    for index in propRevisions.indices where propRevisions[index] != older.propRevisions[index] {
      changedProps.insert(Props.PropSet(rawValue: 1 << index))
    }
    return changedProps
  }
}

private let viewPropsRevisions = Atomic<UInt64>(0)

@usableFromInline
internal func nextViewPropsRevision() -> UInt64 {
  return viewPropsRevisions.wrappingAdd(1, ordering: .relaxed).newValue
}
