// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI13_0_0EXAppState.h"
#import "ABI13_0_0EXConstants.h"
#import "ABI13_0_0EXDisabledDevLoadingView.h"
#import "ABI13_0_0EXDisabledDevMenu.h"
#import "ABI13_0_0EXDisabledRedBox.h"
#import "ABI13_0_0EXFileSystem.h"
#import "ABI13_0_0EXFrameExceptionsManager.h"
#import "ABI13_0_0EXKernelModule.h"
#import "ABI13_0_0EXLinkingManager.h"
#import "ABI13_0_0EXNotifications.h"
#import "ABI13_0_0EXVersionManager.h"
#import "ABI13_0_0EXAmplitude.h"
#import "ABI13_0_0EXSegment.h"
#import "ABI13_0_0EXStatusBarManager.h"
#import "ABI13_0_0EXUtil.h"

#import <ReactABI13_0_0/ABI13_0_0RCTAssert.h>
#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>
#import <ReactABI13_0_0/ABI13_0_0RCTBridge+Private.h>
#import <ReactABI13_0_0/ABI13_0_0RCTDevMenu.h>
#import "ABI13_0_0RCTDevMenu+Device.h"
#import <ReactABI13_0_0/ABI13_0_0RCTEventDispatcher.h>
#import <ReactABI13_0_0/ABI13_0_0RCTLog.h>
#import <ReactABI13_0_0/ABI13_0_0RCTModuleData.h>
#import <ReactABI13_0_0/ABI13_0_0RCTUtils.h>

#import <objc/message.h>

static NSNumber *ABI13_0_0EXVersionManagerIsFirstLoad;

@interface ABI13_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;

@end

@implementation ABI13_0_0EXVersionManager

- (instancetype)initWithFatalHandler:(void (^)(NSError *))fatalHandler
                         logFunction:(void (^)(NSInteger, NSInteger, NSString *, NSNumber *, NSString *))logFunction
                        logThreshold:(NSInteger)threshold
{
  if (self = [super init]) {
    [self configureABIWithFatalHandler:fatalHandler logFunction:logFunction logThreshold:threshold];
  }
  return self;
}

- (void)bridgeWillStartLoading:(id)bridge
{
  // manually send a "start loading" notif, since the real one happened uselessly inside the ABI13_0_0RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:ABI13_0_0RCTJavaScriptWillStartLoadingNotification object:bridge];
}

- (void)bridgeFinishedLoading
{

}

- (void)bridgeDidForeground
{
  if (_isFirstLoad) {
    // reverse the ABI13_0_0RCT-triggered first swap, so the ABI13_0_0RCT implementation is back in its original place
    [self swapSystemMethods];
    _isFirstLoad = NO; // in case the same VersionManager instance is used between multiple bridge loads
  } else {
    // some state is shared between bridges, for example status bar
    [self resetSharedState];
  }

  // now modify system behavior with no swap
  [self setSystemMethods];
}

- (void)bridgeDidBackground
{
  [self saveSharedState];
}

- (void)saveSharedState
{

}

- (void)resetSharedState
{

}

- (void)invalidate
{

}

- (void)showDevMenuForBridge:(id)bridge
{
  [[self _devMenuInstanceForBridge:bridge] show];
}

- (void)disableRemoteDebuggingForBridge:(id)bridge
{
  ABI13_0_0RCTDevMenu *devMenuInstance = [self _devMenuInstanceForBridge:bridge];
  if ([devMenuInstance respondsToSelector:@selector(setExecutorClass:)]) {
    [devMenuInstance performSelector:@selector(setExecutorClass:) withObject:nil];
  }
}

- (void)toggleElementInspectorForBridge:(id)bridge
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [((ABI13_0_0RCTBridge *)bridge).eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
}


#pragma mark - internal

- (ABI13_0_0RCTDevMenu *)_devMenuInstanceForBridge:(id)bridge
{
  if ([bridge respondsToSelector:@selector(batchedBridge)]) {
    bridge = [bridge batchedBridge];
  }
  ABI13_0_0RCTModuleData *data = [bridge moduleDataForName:@"DevMenu"];
  if (data) {
    return [data instance];
  }
  return nil;
}

- (void)configureABIWithFatalHandler:(void (^)(NSError *))fatalHandler
                         logFunction:(void (^)(NSInteger, NSInteger, NSString *, NSNumber *, NSString *))logFunction
                        logThreshold:(NSInteger)threshold
{
  if (ABI13_0_0EXVersionManagerIsFirstLoad == nil) {
    // first time initializing this RN version at runtime
    _isFirstLoad = YES;
  }
  ABI13_0_0EXVersionManagerIsFirstLoad = @(NO);
  ABI13_0_0RCTSetFatalHandler(fatalHandler);
  ABI13_0_0RCTSetLogThreshold(threshold);
  ABI13_0_0RCTSetLogFunction(logFunction);
}

- (void)swapSystemMethods
{
}

- (void)setSystemMethods
{
}

/**
 *  Expected params:
 *    NSDictionary *manifest
 *    NSDictionary *constants
 *    NSURL *initialUri
 *    @BOOL isDeveloper
 *
 * Kernel-only:
 *    ABI13_0_0EXKernel *kernel
 *    NSArray *supportedSdkVersions
 *    id exceptionsManagerDelegate
 *
 * Frame-only:
 *    ABI13_0_0EXFrame *frame
 */
- (NSArray *)extraModulesWithParams:(NSDictionary *)params
{
  NSDictionary *manifest = params[@"manifest"];
  NSURL *initialUri = params[@"initialUri"];
  NSDictionary *constants = params[@"constants"];
  BOOL isDeveloper = [params[@"isDeveloper"] boolValue];
  NSString *experienceId = [manifest objectForKey:@"id"];

  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    [[ABI13_0_0EXAppState alloc] init],
                                    [[ABI13_0_0EXConstants alloc] initWithProperties:constants],
                                    [[ABI13_0_0EXDisabledDevLoadingView alloc] init],
                                    [[ABI13_0_0EXFileSystem alloc] initWithExperienceId:experienceId],
                                    [[ABI13_0_0EXLinkingManager alloc] initWithInitialUrl:initialUri],
                                    [[ABI13_0_0EXNotifications alloc] initWithExperienceId:experienceId],
                                    [[ABI13_0_0EXAmplitude alloc] initWithExperienceId:experienceId],
                                    [[ABI13_0_0EXSegment alloc] init],
                                    [[ABI13_0_0EXStatusBarManager alloc] init],
                                    [[ABI13_0_0EXUtil alloc] init],
                                    ]];
  if (params[@"frame"]) {
    [extraModules addObject:[[ABI13_0_0EXFrameExceptionsManager alloc] initWithDelegate:params[@"frame"]]];
  } else {
    id exceptionsManagerDelegate = params[@"exceptionsManagerDelegate"];
    if (exceptionsManagerDelegate) {
      ABI13_0_0RCTExceptionsManager *exceptionsManager = [[ABI13_0_0RCTExceptionsManager alloc] initWithDelegate:exceptionsManagerDelegate];
      [extraModules addObject:exceptionsManager];
    } else {
      ABI13_0_0RCTLogWarn(@"No exceptions manager provided when building extra modules for bridge.");
    }
  }
  
  if (params[@"kernel"] && params[@"services"]) {
    ABI13_0_0EXKernelModule *kernel = [[ABI13_0_0EXKernelModule alloc] initWithVersions:params[@"supportedSdkVersions"]];
    kernel.delegate = params[@"services"][@"EXKernelModuleManager"];
    [extraModules addObject:kernel];
  }
  
  if (isDeveloper) {
    [extraModules addObjectsFromArray:@[
                                        [[ABI13_0_0RCTDevMenu alloc] init],
                                        ]];
  } else {
    // user-facing (not debugging).
    // additionally disable ABI13_0_0RCTRedBox and ABI13_0_0RCTDevMenu
    [extraModules addObjectsFromArray:@[
                                        [[ABI13_0_0EXDisabledDevMenu alloc] init],
                                        [[ABI13_0_0EXDisabledRedBox alloc] init],
                                        ]];
  }
  return extraModules;
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end
