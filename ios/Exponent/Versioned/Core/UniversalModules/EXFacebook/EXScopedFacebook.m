// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<EXFacebook/EXFacebook.h>)
#import "EXScopedFacebook.h"
#import <FBSDKCoreKit/FBSDKSettings.h>
#import <UMCore/UMAppLifecycleService.h>

@interface EXScopedFacebook ()

@property (nonatomic, strong) NSString *appId;
@property (nonatomic, strong) NSString *displayName;

@end

// Expo client-only EXFacebook module, which ensures that Facebook SDK configurations
// of different experiences don't collide.

@implementation EXScopedFacebook : EXFacebook

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  id<UMAppLifecycleService> appLifecycleService = [moduleRegistry getModuleImplementingProtocol:@protocol(UMAppLifecycleService)];
  [appLifecycleService registerAppLifecycleListener:self];
}

# pragma mark - UMAppLifecycleListener

- (void)onAppBackgrounded {
  _appId = [FBSDKSettings appID];
  _displayName = [FBSDKSettings displayName];
  [FBSDKSettings setAppID:nil];
  [FBSDKSettings setDisplayName:nil];
}

- (void)onAppForegrounded {
  if (_appId) {
    [FBSDKSettings setAppID:_appId];
  }
  if (_displayName) {
    [FBSDKSettings setDisplayName:_displayName];
  }
}

@end
#endif
