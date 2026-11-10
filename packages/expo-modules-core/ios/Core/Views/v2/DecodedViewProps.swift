// Copyright 2026-present 650 Industries. All rights reserved.

/// The props of a view as `ViewPropsDecoder` decoded them. Immutable: each decode that changes a prop
/// makes a new one from the previous one.
///
/// Fabric doesn't mount every props update: when React commits again before the previous commit is
/// mounted, the view goes from its mounted props straight to the newest ones. So the view can't use
/// the props that the last decode changed. It asks which props changed since its mounted props with
/// ``changedProps(since:)``, which compares the revision in which each prop last changed.
public final class DecodedViewProps<Props: AnyViewProps>: @unchecked Sendable {
  /// The props.
  public let props: Props

  /// Identifies the chain of decodes that this one belongs to. Every decode from previous props keeps
  /// it, and a decode without previous props starts a new one.
  @usableFromInline
  internal let lineage: UInt64

  /// Counts the decodes in the lineage, starting at 1.
  @usableFromInline
  internal let revision: UInt64

  /// The revision in which each prop last changed, by the index of its bit in `Props.PropSet`.
  @usableFromInline
  internal let propRevisions: [UInt64]

  // A designated initializer of a class can't be `@inlinable` with library evolution (the precompiled
  // XCFrameworks), so the inlinable initializer below computes the values and delegates to this one.
  @usableFromInline
  internal init(props: Props, lineage: UInt64, revision: UInt64, propRevisions: [UInt64]) {
    self.props = props
    self.lineage = lineage
    self.revision = revision
    self.propRevisions = propRevisions
  }

  @inlinable
  internal convenience init(props: Props, changedProps: Props.PropSet, previous: DecodedViewProps<Props>?) {
    guard let previous else {
      // `allProps` has one bit for each prop. `PropName.allCases` would make an array on each call.
      self.init(
        props: props,
        lineage: nextViewPropsLineage(),
        revision: 1,
        propRevisions: Array(repeating: 1, count: Props.allProps.rawValue.nonzeroBitCount)
      )
      return
    }
    let revision = previous.revision + 1
    var propRevisions = previous.propRevisions
    // Visits only the changed props, one set bit at a time.
    var changedBits = changedProps.rawValue
    while changedBits != 0 {
      propRevisions[changedBits.trailingZeroBitCount] = revision
      changedBits &= changedBits - 1
    }
    self.init(props: props, lineage: previous.lineage, revision: revision, propRevisions: propRevisions)
  }

  /// Returns the props that changed since the given props. All props when `older` is `nil` or isn't an
  /// earlier decode of the same lineage, for example the props of a recycled view.
  @inlinable
  public func changedProps(since older: DecodedViewProps<Props>?) -> Props.PropSet {
    guard let older, older.lineage == lineage, older.revision <= revision else {
      return Props.allProps
    }
    var changedProps = Props.PropSet()
    for (index, propRevision) in propRevisions.enumerated() where propRevision > older.revision {
      changedProps.insert(Props.PropSet(rawValue: 1 << index))
    }
    return changedProps
  }
}

private let viewPropsLineages = Mutex<UInt64>(0)

@usableFromInline
internal func nextViewPropsLineage() -> UInt64 {
  return viewPropsLineages.withLock { lineage in
    lineage += 1
    return lineage
  }
}
