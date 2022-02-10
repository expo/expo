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
