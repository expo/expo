#if os(macOS)
import AppKit

public class ReloadScreenManagerMacOS: Reloadable {
  private var currentConfiguration: ReloadScreenConfiguration?
  private var currentReloadScreen: ReloadScreenView?
  private var overlayWindow: NSWindow?
  private var isShowing = false

  init() {
    NotificationCenter.default.addObserver(self, selector: #selector(hide), name: Notification.Name("RCTContentDidAppearNotification"), object: nil)
  }

  public func setConfiguration(_ options: ReloadScreenOptions?) {
    currentConfiguration = ReloadScreenConfiguration(options: options)
  }

  public func show() {
    if isShowing {
      return
    }

    do {
      try showReloadScreen()
      isShowing = true
    } catch {
      isShowing = false
    }
  }

  @objc
  public func hide() {
    if !isShowing {
      return
    }

    hideReloadScreen()
    isShowing = false
  }

  private func showReloadScreen() throws {
    let config = currentConfiguration ?? ReloadScreenConfiguration(options: nil)

    // Create overlay window for macOS
    let screenFrame: NSRect
    if let mainScreen = NSScreen.main {
      screenFrame = mainScreen.frame
    } else {
      screenFrame = NSRect(x: 0, y: 0, width: 800, height: 600)
    }
    overlayWindow = NSWindow(
      contentRect: screenFrame,
      styleMask: [.borderless],
      backing: .buffered,
      defer: false
    )

    guard let window = overlayWindow else {
      throw ReloadOverlayException()
    }

    window.level = .screenSaver
    window.backgroundColor = NSColor.clear
    window.isOpaque = false
    window.hasShadow = false
    window.ignoresMouseEvents = false

    let reloadScreenView = ReloadScreenView(frame: window.contentRect(forFrameRect: window.frame))
    reloadScreenView.updateConfiguration(config)

    window.contentView = reloadScreenView
    window.makeKeyAndOrderFront(nil)

    currentReloadScreen = reloadScreenView
  }

  private func hideReloadScreen() {
    guard let window = overlayWindow else {
      return
    }

    let config = currentConfiguration ?? ReloadScreenConfiguration(options: nil)

    if config.fade {
      NSAnimationContext.runAnimationGroup { context in
        context.duration = 0.3
        window.animator().alphaValue = 0.0
      } completionHandler: {
        window.orderOut(nil)
        self.overlayWindow = nil
        self.currentReloadScreen = nil
      }
    } else {
      window.orderOut(nil)
      overlayWindow = nil
      currentReloadScreen = nil
    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }
}
#endif
