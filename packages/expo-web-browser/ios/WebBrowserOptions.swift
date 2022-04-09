// Copyright 2022-present 650 Industries. All rights reserved.

import SafariServices
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

enum DismissButtonStyle: String, EnumArgument {
  case done
  case close
  case cancel

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
}

internal enum PresentationStyle: String, EnumArgument {
  case fullScreen
  case pageSheet
  case formSheet
  case currentContext
  case overFullScreen
  case overCurrentContext
  case popover
  case none
  case automatic

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
      if #available(iOS 13.0, *) {
        return .automatic
      }
      // default prior iOS 13
      return .fullScreen
    }
  }
}
