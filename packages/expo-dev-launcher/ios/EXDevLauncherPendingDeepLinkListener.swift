// Copyright 2015-present 650 Industries. All rights reserved.

public protocol EXDevLauncherPendingDeepLinkListener: AnyObject {
  func onNewPendingDeepLink(_ deepLink: URL)
}
