// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

/// Works around a SwiftUI bug on iPhone Duo: delete this file and its one use in `HostView` once iOS
/// fixes it.
///
/// When the app is in a split view, positioned left, the tab bar becomes a rail beside the content and
/// iOS drops its content margin on that edge, so the large title starts on the safe-area edge. A `Form`
/// or `List` hosted under a UIKit navigation bar, as every `Host` is, keeps its 20pt section margin there
/// and starts 20pt inside the title:
///
/// ```
/// RNSNavigationController        navigation bar: large title at 84, the safe-area edge
/// └─ RNSScreen                   the pushed controller: safe area 84, layout margins 84
///    └─ UIHostingController      the Host, a child controller: 84 + 20pt margin = 104  ❌ BUG
///       └─ Form                  sections at 104, 20pt inside the title
/// ```
///
/// SwiftUI drops that 20pt only when the hosting controller is itself the pushed controller, which a
/// `Host` can never be.
///
/// This sets the scroll content margin on such an edge to the hosted view's safe-area inset, measured
/// from the view's edge, so sections start with the title. It applies only where the inset exceeds the
/// window's own on that edge, so it comes from a bar beside the content, and the screen's layout margin
/// equals its safe area, so iOS has dropped the margin there.
///
/// See ENG-27830.
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
