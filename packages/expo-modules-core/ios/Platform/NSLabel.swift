// Copyright 2024-present 650 Industries. All rights reserved.
#if os(macOS)

import AppKit

// A compatibility class for UILabel on macOS
public class NSLabel: NSTextField {
  public override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    isEditable = false
    isBezeled = false
    drawsBackground = true
    autoresizingMask = [.width, .height]
    cell?.lineBreakMode = .byWordWrapping
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
  }

  public var text: String? {
    get { return stringValue }
    set { stringValue = newValue ?? "" }
  }

  public var textAlignment: NSTextAlignment {
    get { return alignment }
    set { alignment = newValue }
  }

  public var numberOfLines: Int {
    get { return maximumNumberOfLines }
    set { maximumNumberOfLines = newValue }
  }

  public var adjustsFontSizeToFitWidth: Bool {
    get { return true }
    set { _ = newValue }
  }
}

#endif // os(macOS)
