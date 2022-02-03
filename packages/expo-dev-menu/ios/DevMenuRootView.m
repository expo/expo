// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevMenu/DevMenuRootView.h>

#import <React/RCTAssert.h>
#import <React/RCTRootContentView.h>
#import <React/UIView+React.h>

@implementation DevMenuRootView

- (void)javaScriptDidLoad:(NSNotification *)notification
{
  RCTAssertMainQueue();

  // Use the (batched) bridge that's sent in the notification payload, so the
  // RCTRootContentView is scoped to the right bridge
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  RCTRootContentView *rootView = (RCTRootContentView *)self.contentView;
  if (bridge != rootView.bridge) {
    if (self.reactTag == rootView.reactTag) {
      // Clear the reactTag so it can be re-assigned
      self.reactTag = nil; 
    }
    [super bundleFinishedLoading:bridge];
  }
}

- (void)bundleFinishedLoading:(RCTBridge *)bridge {}

- (bool)becomeFirstResponder
{
  // Avoid first responder status so that it won't hijack React Native keyboard commands.
  return NO;
}

@end
