// Copyright 2022-present 650 Industries. All rights reserved.
#if os(iOS)
import SafariServices
#endif
import ExpoModulesCore

struct WebBrowserOptions: Record {
  @Field
  var readerMode: Bool = false

  @Field
  var enableBarCollapsing: Bool = false

  @Field
  var dismissButtonStyle: DismissButtonStyle = .done

  @Field
  var toolbarColor: UIColor?

  @Field
  var controlsColor: UIColor?

  // Defaults to .overFullScreen to keep backwards compatibility
  @Field
  var presentationStyle: PresentationStyle = .overFullScreen
}

struct AuthSessionOptions: Record {
  @Field
  var preferEphemeralSession: Bool = false
}

enum DismissButtonStyle: String, Enumerable {
  case done
  case close
  case cancel

#if os(iOS)
  func toSafariDismissButtonStyle() -> SFSafariViewController.DismissButtonStyle {
    switch self {
    case .done:
      return .done
    case .close:
      return .close
    case .cancel:
      return .cancel
    }
  }
#endif
}

internal enum PresentationStyle: String, Enumerable {
  case fullScreen
  case pageSheet
  case formSheet
  case currentContext
  case overFullScreen
  case overCurrentContext
  case popover
  case none
  case automatic

#if os(iOS)
  func toPresentationStyle() -> UIModalPresentationStyle {
    switch self {
    case .fullScreen:
      return .fullScreen
    case .pageSheet:
      return .pageSheet
    case .formSheet:
      return .formSheet
    case .currentContext:
      return .currentContext
    case .overFullScreen:
      return .overFullScreen
    case .overCurrentContext:
      return .overCurrentContext
    case .popover:
      return .popover
    case .none:
      return .none
    case .automatic:
      return .automatic
    }
  }
#else
  func toContentRect() -> NSRect {
    switch self {
    case .fullScreen, .overFullScreen:
      if let screenFrame = NSScreen.main?.frame {
        return screenFrame
      } else {
        return NSRect(x: 0, y: 0, width: 1440, height: 900)
      }

    case .pageSheet:
      return NSRect(x: 0, y: 0, width: 1000, height: 700)

    case .formSheet:
      return NSRect(x: 0, y: 0, width: 600, height: 400)

    case .popover:
      return NSRect(x: 0, y: 0, width: 300, height: 200)

    case .automatic, .none, .currentContext, .overCurrentContext:
      return NSRect(x: 0, y: 0, width: 1200, height: 800)
    }
  }
#endif
}
