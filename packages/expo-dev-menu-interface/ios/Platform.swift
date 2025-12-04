#if os(macOS)

import AppKit

extension NSView {
  public var backgroundColor: NSColor? {
    get {
      guard let cgColor = layer?.backgroundColor else { return nil }
      return NSColor(cgColor: cgColor)
    }
    set {
      wantsLayer = true
      layer?.backgroundColor = newValue?.cgColor
    }
  }
}

#endif // os(macOS)
