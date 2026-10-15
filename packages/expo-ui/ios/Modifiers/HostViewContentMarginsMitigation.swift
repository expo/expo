// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

/// A workaround for a SwiftUI bug beside the iPhone Duo rail. Once iOS fixes it, delete this file and
/// its one use in `HostView`; the "Side Column Content Margins" demo in `apps/router-tester` shows the
/// bug and stays as the check that the fix holds.
///
/// On iPhone Duo in a split window, the tab bar becomes a rail beside the content, and iOS drops its
/// content margin on that edge: the navigation bar's large title starts on the safe-area edge. SwiftUI
/// follows this in its own `NavigationStack`, but a `Form` or `List` hosted under a UIKit navigation
/// bar, as every `Host` is, keeps its 20pt section margin and starts 20pt inside the title.
///
/// This sets the scroll content margin on such an edge to the hosted view's safe-area inset, so
/// sections start on the safe-area edge like the title. A content margin is measured from the view's
/// edge, not the safe area, so zero would run sections under the bar. It applies only where both
/// hold, so it stays out of every other layout:
/// - The hosted view's safe area exceeds the window's on that edge, so the inset comes from a bar
///   beside the content rather than from the device, as a notch or the Duo's status column does.
/// - The screen's view controller has a layout margin equal to its safe area on that edge, so iOS
///   has dropped the content margin there.
internal struct HostViewContentMarginsMitigation: ViewModifier {
  let layoutDirection: LayoutDirection
  weak var hostingView: UIView?

  /// The leading and trailing content margins to apply, or `nil` to keep the system's.
  @State private var margins = Margins()

  private struct Margins: Equatable {
    var leading: CGFloat?
    var trailing: CGFloat?
  }

  func body(content: Content) -> some View {
#if os(iOS)
    if #available(iOS 17.0, *) {
      content
        .contentMargins(.leading, margins.leading, for: .scrollContent)
        .contentMargins(.trailing, margins.trailing, for: .scrollContent)
        .onGeometryChange(for: CGRect.self, of: { proxy in proxy.frame(in: .global) }) { _ in
          updateMargins()
        }
        .onGeometryChange(for: EdgeInsets.self, of: { proxy in proxy.safeAreaInsets }) { _ in
          updateMargins()
        }
    } else {
      content
    }
#else
    content
#endif
  }

#if os(iOS)
  /// UIKit can update the screen's layout margins after SwiftUI reports the geometry change, as
  /// when the window moves into a split view, so the margins are checked again once that settles.
  private func updateMargins() {
    margins = affectedMargins()
    DispatchQueue.main.async {
      margins = affectedMargins()
    }
  }

  private func affectedMargins() -> Margins {
    guard let hostingView, let window = hostingView.window, let screen = screenView(of: hostingView) else {
      return Margins()
    }
    let host = hostingView.safeAreaInsets
    let left: CGFloat? = host.left > window.safeAreaInsets.left
      && abs(screen.layoutMargins.left - screen.safeAreaInsets.left) < 0.5 ? host.left : nil
    let right: CGFloat? = host.right > window.safeAreaInsets.right
      && abs(screen.layoutMargins.right - screen.safeAreaInsets.right) < 0.5 ? host.right : nil
    return layoutDirection == .rightToLeft
      ? Margins(leading: right, trailing: left)
      : Margins(leading: left, trailing: right)
  }

  /// The view of the nearest view controller above the `Host`, which is the screen it is hosted in.
  private func screenView(of view: UIView) -> UIView? {
    var responder = view.next
    while let current = responder {
      if let controller = current as? UIViewController {
        return controller.view
      }
      responder = current.next
    }
    return nil
  }
#endif
}
