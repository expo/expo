// Copyright 2015-present 650 Industries. All rights reserved.

import React

#if os(macOS)

import SwiftUI

/// On macOS, instead of a separate window, we overlay the dev menu on the app's main window
class DevMenuWindow: NSObject, AnyObject {
  private let manager: DevMenuManager
  private var overlayView: NSView?
  private var hostingView: NSHostingView<DevMenuOverlayView>?
  private weak var appWindow: NSWindow?
  private var isPresenting = false
  private var isDismissing = false

  var isHidden: Bool {
    get { overlayView?.superview == nil }
    set {
      if newValue {
        closeBottomSheet(nil)
      } else {
        makeKeyAndOrderFront(nil)
      }
    }
  }

  var isVisible: Bool {
    return overlayView?.superview != nil
  }

  required init(manager: DevMenuManager) {
    self.manager = manager
    super.init()
  }

  func makeKeyAndOrderFront(_ sender: Any?) {
    guard !isPresenting && !isDismissing else { return }

    guard let window = NSApplication.shared.windows.first(where: { window in
      return window.isVisible && window.className != "NSPanel"
    }) else {
      return
    }

    appWindow = window
    presentDevMenu()
  }

  private func presentDevMenu() {
    guard !isPresenting && !isDismissing else { return }
    guard let window = appWindow, let contentView = window.contentView else { return }

    isPresenting = true

    // Create the overlay view if needed
    let overlay = NSView(frame: contentView.bounds)
    overlay.autoresizingMask = [.width, .height]
    overlay.wantsLayer = true
    overlay.layer?.backgroundColor = NSColor(calibratedWhite: 0, alpha: 0.4).cgColor
    self.overlayView = overlay

    // Create the SwiftUI hosting view for the dev menu
    let devMenuView = DevMenuOverlayView(onBackgroundTap: { [weak self] in
      self?.manager.hideMenu()
    })
    let hosting = NSHostingView(rootView: devMenuView)
    hosting.frame = contentView.bounds
    hosting.autoresizingMask = [.width, .height]
    self.hostingView = hosting

    // Add overlay to the window's content view
    overlay.addSubview(hosting)
    contentView.addSubview(overlay)

    // Fade-in animation
    overlay.alphaValue = 0.0
    NSAnimationContext.runAnimationGroup({ ctx in
      ctx.duration = 0.22
      overlay.animator().alphaValue = 1.0
    }, completionHandler: { [weak self] in
      self?.isPresenting = false
    })
  }

  func closeBottomSheet(_ completion: (() -> Void)? = nil) {
    guard !isDismissing && !isPresenting else { return }
    guard let overlay = overlayView else {
      completion?()
      return
    }

    isDismissing = true

    resetScrollPosition()

    // Fade out animation
    NSAnimationContext.runAnimationGroup({ ctx in
      ctx.duration = 0.3
      overlay.animator().alphaValue = 0.0
    }, completionHandler: { [weak self] in
      guard let self else { return }
      overlay.removeFromSuperview()
      self.overlayView = nil
      self.hostingView = nil
      self.appWindow = nil
      self.isDismissing = false
      completion?()
    })
  }

  private func resetScrollPosition() {
    guard let hostingView else { return }
    if let scrollView = findScrollView(in: hostingView) {
      if let documentView = scrollView.documentView {
        let origin = NSPoint(x: 0, y: documentView.bounds.height - scrollView.contentView.bounds.height)
        scrollView.contentView.scroll(to: origin)
        scrollView.reflectScrolledClipView(scrollView.contentView)
      }
    }
  }

  private func findScrollView(in view: NSView) -> NSScrollView? {
    if let scrollView = view as? NSScrollView {
      return scrollView
    }

    for subview in view.subviews {
      if let scrollView = findScrollView(in: subview) {
        return scrollView
      }
    }

    return nil
  }
}

private struct DevMenuOverlayView: View {
  let onBackgroundTap: () -> Void

  var body: some View {
    ZStack {
      Color.clear
        .contentShape(Rectangle())
        .onTapGesture {
          onBackgroundTap()
        }

      DevMenuRootView()
        .frame(maxWidth: 500, maxHeight: .infinity)
        .background(
          RoundedRectangle(cornerRadius: 12)
            .fill(Color(NSColor.windowBackgroundColor))
            .shadow(radius: 20)
        )
        .padding(40)
    }
  }
}
#endif
