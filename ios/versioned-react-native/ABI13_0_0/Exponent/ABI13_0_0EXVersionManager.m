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
#import "ABI13_0_0EXUtil.h"

#import <ReactABI13_0_0/ABI13_0_0RCTAssert.h>
#import "ABI13_0_0RCTDevMenu+Device.h"
#import <ReactABI13_0_0/ABI13_0_0RCTLog.h>
#import <ReactABI13_0_0/ABI13_0_0RCTUtils.h>

#import <objc/message.h>

static NSNumber *ABI13_0_0EXVersionManagerIsFirstLoad;

void ABI13_0_0EXSetInstanceMethod(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  
  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);
  
  if (!class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    method_setImplementation(originalMethod, replacementImplementation);
  }
}

@interface ABI13_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;
@property (nonatomic, assign) BOOL isStatusBarHidden;
@property (nonatomic, assign) UIStatusBarStyle statusbarStyle;

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
  _statusbarStyle = [ABI13_0_0RCTSharedApplication() statusBarStyle];
  _isStatusBarHidden = [ABI13_0_0RCTSharedApplication() isStatusBarHidden];
}

- (void)resetSharedState
{

  [ABI13_0_0RCTSharedApplication() setStatusBarStyle:_statusbarStyle];
  [ABI13_0_0RCTSharedApplication() setStatusBarHidden: _isStatusBarHidden];
}

- (void)invalidate
{

}


#pragma mark - internal

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
#if ABI13_0_0RCT_DEV
  // key commands
  SEL ABI13_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI13_0_0RCT_keyCommands");
  SEL ABI13_0_0RCTSendActionSelector = NSSelectorFromString(@"ABI13_0_0RCT_sendAction:to:from:forEvent:");
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    ABI13_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(keyCommands),
                           ABI13_0_0RCTCommandsSelector);
    
    ABI13_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           ABI13_0_0RCTSendActionSelector);
  } else {
    ABI13_0_0RCTSwapInstanceMethods([UIResponder class],
                           @selector(keyCommands),
                           ABI13_0_0RCTCommandsSelector);
  }
  
  // shake gesture
  SEL ABI13_0_0RCTMotionSelector = NSSelectorFromString(@"ABI13_0_0RCT_motionEnded:withEvent:");
  ABI13_0_0RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), ABI13_0_0RCTMotionSelector);
#endif
}

- (void)setSystemMethods
{
#if ABI13_0_0RCT_DEV
  // key commands
  SEL ABI13_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI13_0_0RCT_keyCommands");
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    ABI13_0_0EXSetInstanceMethod([UIApplication class],
                           @selector(keyCommands),
                           ABI13_0_0RCTCommandsSelector);
    
    // don't support this set on iOS 8.x -- results in a recursive call.
    // in this case people will just need to live without key commands.

    /* ABI13_0_0EXSetInstanceMethod([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           ABI13_0_0RCTSendActionSelector); */
  } else {
    ABI13_0_0EXSetInstanceMethod([UIResponder class],
                           @selector(keyCommands),
                           ABI13_0_0RCTCommandsSelector);
  }
  
  // shake gesture
  SEL ABI13_0_0RCTMotionSelector = NSSelectorFromString(@"ABI13_0_0RCT_motionEnded:withEvent:");
  ABI13_0_0EXSetInstanceMethod([UIWindow class], @selector(motionEnded:withEvent:), ABI13_0_0RCTMotionSelector);
#endif
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
  
  if (params[@"kernel"]) {
    ABI13_0_0EXKernelModule *kernel = [[ABI13_0_0EXKernelModule alloc] initWithVersions:params[@"supportedSdkVersions"]];
    kernel.delegate = params[@"kernel"];
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
