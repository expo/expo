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

internal enum PresentationStyle: Int, EnumArgument {
  case fullScreen = 0
  case pageSheet = 1
  case formSheet = 2
  case currentContext = 3
  case overFullScreen = 5
  case overCurrentContext = 6
  case popover = 7
  case none = -1
  case automatic = -2

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
