// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import Testing

@testable import ExpoModulesCore

private final class HostTestViewProps: ExpoSwiftUI.ViewProps {}

private struct HostTestView: ExpoSwiftUI.View {
  @ObservedObject var props: HostTestViewProps

  var body: some SwiftUI.View {
    VStack {
      Children()
    }
  }
}

@MainActor
@Suite("ExpoSwiftUI.UIViewHost")
struct SwiftUIViewHostTests {
  private func render(_ window: UIWindow) async throws {
    window.layoutIfNeeded()
    try await Task.sleep(nanoseconds: 100_000_000)
    window.layoutIfNeeded()
  }

  // Fabric recycles views, so an unmounted view can come back as the next mounted child.
  // https://github.com/expo/expo/issues/51717
  @Test
  func `shows a view that is unmounted and mounted again`() async throws {
    let props = HostTestViewProps()
    let hostedView = UIView()
    props.children = [ExpoSwiftUI.UIViewHost(view: hostedView)]

    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 200, height: 200))
    window.rootViewController = UIHostingController(rootView: HostTestView(props: props))
    window.makeKeyAndVisible()
    try await render(window)
    #expect(hostedView.window === window)

    // What `virtualViewUnmountChild` and `virtualViewMountChild` do in one Fabric transaction.
    hostedView.removeFromSuperview()
    props.children = []
    props.children = [ExpoSwiftUI.UIViewHost(view: hostedView)]
    props.objectWillChange.send()
    try await render(window)

    #expect(hostedView.window === window)
  }
}
