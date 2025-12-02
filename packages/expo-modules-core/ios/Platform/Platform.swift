#if os(macOS)

import AppKit
import SwiftUI

public typealias UIApplication = NSApplication
public typealias UIView = NSView
public typealias UIUserActivityRestoring = NSUserActivityRestoring
public typealias UIViewController = NSViewController
public typealias UIResponder = NSResponder
public typealias UIApplicationDelegate = NSApplicationDelegate
public typealias UIWindow = NSWindow
public typealias UIHostingController = NSHostingController
public typealias UIViewRepresentable = NSViewRepresentable
public typealias UILabel = NSLabel
public typealias UIImage = NSImage
public typealias UIPasteboard = NSPasteboard

extension UIApplication {
  public typealias LaunchOptionsKey = String
}

extension Image {
  public init(uiImage: NSImage) {
    self.init(nsImage: uiImage)
  }
}

extension NSPasteboard {
  public var string: String? {
    get {
      return self.string(forType: .string)
    }
    set {
      self.clearContents()
      if let newValue {
        self.setString(newValue, forType: .string)
      }
    }
  }
}

#endif // os(macOS)
