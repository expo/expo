// Copyright 2015-present 650 Industries. All rights reserved.

@protocol EXDevLauncherPendingDeepLinkListener <NSObject>

- (void)onNewPendingDeepLink:(NSURL *)deepLink;

@end
