// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<EXFacebook/EXFacebook.h>)
#import "EXScopedFacebook.h"
#import <FBSDKCoreKit/FBSDKSettings.h>
#import <UMCore/UMAppLifecycleService.h>

@interface EXScopedFacebook ()

@property (nonatomic, strong) NSString *appId;

@end

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
  [FBSDKSettings setAppID:nil];
}

- (void)onAppForegrounded {
  // Do not override appId from native resources
  if (_appId) {
    [FBSDKSettings setAppID:_appId];
  }
}

@end
#endif
