// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

// MARK: - Test view

@ViewProps
private struct NativeCardProps {
  var title = "Untitled"
  var radius: Double = 4
  var onTap: () -> Void
}

@ExpoView<NativeCardProps>
private final class NativeCardView: ExpoNativeView {
  var diffs: [NativeCardProps.Diff] = []

  func didUpdateProps(_ diff: NativeCardProps.Diff) {
    diffs.append(diff)
  }
}

@ExpoModule("NativeCards", views: [NativeCardView.self])
private final class NativeCardsModule: Module {}

// MARK: - Tests

/// Applies decoded props to an `@ExpoView` the way `ExpoNativeViewObjC` does when Fabric mounts them.
@Suite
@MainActor
struct NativeViewTests {
  private let view = NativeCardView(frame: .zero)

  private func decoded(
    _ props: NativeCardProps,
    changed: NativeCardProps.PropSet,
    previous: DecodedViewProps<NativeCardProps>? = nil
  ) -> DecodedViewProps<NativeCardProps> {
    return DecodedViewProps(props: props, changedProps: changed, previous: previous)
  }

  @Test
  func `props are the defaults before the first update`() {
    #expect(view.props.title == "Untitled")
    #expect(view.diffs.isEmpty)
  }

  @Test
  func `first update without decoded props applies the defaults`() {
    view.updateDecodedProps(nil)

    #expect(view.diffs.count == 1)
    #expect(view.diffs[0].isInitial)
    #expect(view.diffs[0].changedNames == [.title, .radius])
    #expect(view.props.radius == 4)

    // Later props without decoded props have nothing to apply.
    view.updateDecodedProps(nil)
    #expect(view.diffs.count == 1)
  }

  @Test
  func `updates give the props changed since the mounted ones`() {
    var props = NativeCardProps()
    props.title = "Card"
    let created = decoded(props, changed: .title)
    view.updateDecodedProps(created)

    props.radius = 8
    let updated = decoded(props, changed: .radius, previous: created)
    view.updateDecodedProps(updated)

    #expect(view.diffs.count == 2)
    #expect(view.diffs[0].isInitial)
    #expect(!view.diffs[1].isInitial)
    #expect(view.diffs[1].changedNames == [.radius])
    #expect(view.diffs[1].oldValue(\.radius) == 4)
    #expect(view.props.title == "Card")
    #expect(view.props.radius == 8)
  }

  @Test
  func `the same decoded props are applied once`() {
    let created = decoded(NativeCardProps(), changed: [])
    view.updateDecodedProps(created)
    view.updateDecodedProps(created)

    #expect(view.diffs.count == 1)
  }

  @Test
  func `module registers its views by type name and as the default view`() throws {
    let appContext = AppContext()
    let holder = ModuleHolder(appContext: appContext, module: NativeCardsModule(appContext: appContext), name: nil)
    let viewType = try #require(holder.nativeViewTypes["NativeCardView"])

    #expect(holder.nativeViewTypes.keys.sorted() == [DEFAULT_MODULE_VIEW, "NativeCardView"])
    #expect(ObjectIdentifier(viewType) == ObjectIdentifier(NativeCardView.self))
    #expect(viewType.propNames == ["title", "radius"])
    #expect(viewType.eventNames == ["onTap"])
  }
}
