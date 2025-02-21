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

extension UIApplication {
  public typealias LaunchOptionsKey = String
}

#endif // os(macOS)
