// Copyright 2026-present 650 Industries. All rights reserved.
import ExpoModulesCore
import SwiftUI

final class SynchronousListProps: ExpoSwiftUI.ViewProps {
  @Field var rendererId: String = ""
  @Field var itemCount: Int = 0
  @Field var revision: Int = 0
}

struct SynchronousListView: ExpoSwiftUI.View {
  @ObservedObject var props: SynchronousListProps
  @StateObject private var owner = SynchronousListPoolOwner()

  var body: some View {
    if let presenter = props.appContext?.reactSurfacePresenter {
      SwiftUI.List(0..<max(0, props.itemCount), id: \.self) { index in
        SynchronousListRow(
          pool: owner.resolve(presenter: presenter),
          rendererId: props.rendererId,
          index: index,
          revision: props.revision
        )
      }
    }
  }
}

private final class SynchronousListPoolOwner: ObservableObject {
  private var pool: ExpoUISynchronousRootPool?

  func resolve(presenter: NSObject) -> ExpoUISynchronousRootPool {
    if let pool { return pool }
    let pool = ExpoUISynchronousRootPool(presenter: presenter)
    self.pool = pool
    return pool
  }
}

private struct SynchronousListRow: UIViewRepresentable {
  let pool: ExpoUISynchronousRootPool
  let rendererId: String
  let index: Int
  let revision: Int

  func makeUIView(context: Context) -> ExpoUISynchronousRow {
    let view = ExpoUISynchronousRow(pool: pool)
    view.configure(withRenderer: rendererId, index: index, revision: revision)
    return view
  }

  func updateUIView(_ uiView: ExpoUISynchronousRow, context: Context) {
    uiView.configure(withRenderer: rendererId, index: index, revision: revision)
  }

  func sizeThatFits(_ proposal: ProposedViewSize, uiView: ExpoUISynchronousRow, context: Context) -> CGSize? {
    guard let width = proposal.width, width.isFinite, width > 0 else { return nil }
    return uiView.render(withWidth: width)
  }

  static func dismantleUIView(_ uiView: ExpoUISynchronousRow, coordinator: ()) {
    uiView.releaseRoot()
  }
}
