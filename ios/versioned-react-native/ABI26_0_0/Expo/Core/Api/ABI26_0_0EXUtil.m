// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXUtil.h"
#import "ABI26_0_0EXScopedModuleRegistry.h"
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUtils.h>

@interface ABI26_0_0EXUtil ()

@property (nonatomic, weak) id kernelUtilServiceDelegate;

@end

@implementation ABI26_0_0EXUtil

@synthesize bridge = _bridge;

// delegate to kernel linking manager because our only kernel work (right now)
// is refreshing the foreground task.
ABI26_0_0EX_EXPORT_SCOPED_MODULE(ExponentUtil, KernelLinkingManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelUtilServiceDelegate = kernelServiceInstance;
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

ABI26_0_0RCT_EXPORT_METHOD(reload)
{
  [_kernelUtilServiceDelegate utilModuleDidSelectReload:self];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
}

@end
