// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI15_0_0EXAppState.h"
#import "ABI15_0_0EXConstants.h"
#import "ABI15_0_0EXDevSettings.h"
#import "ABI15_0_0EXDisabledDevLoadingView.h"
#import "ABI15_0_0EXDisabledDevMenu.h"
#import "ABI15_0_0EXDisabledRedBox.h"
#import "ABI15_0_0EXFrameExceptionsManager.h"
#import "ABI15_0_0EXKernelModule.h"
#import "ABI15_0_0EXLinkingManager.h"
#import "ABI15_0_0EXVersionManager.h"
#import "ABI15_0_0EXScope.h"

#import <ReactABI15_0_0/ABI15_0_0RCTAssert.h>
#import "ABI15_0_0RCTDevMenu+Device.h"
#import <ReactABI15_0_0/ABI15_0_0RCTLog.h>
#import <ReactABI15_0_0/ABI15_0_0RCTUtils.h>

#import <objc/message.h>

static NSNumber *ABI15_0_0EXVersionManagerIsFirstLoad;

void ABI15_0_0EXSetInstanceMethod(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  
  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);
  
  if (!class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    method_setImplementation(originalMethod, replacementImplementation);
  }
}

@interface ABI15_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;
@property (nonatomic, assign) BOOL isStatusBarHidden;
@property (nonatomic, assign) UIStatusBarStyle statusbarStyle;

@end

@implementation ABI15_0_0EXVersionManager

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
  // manually send a "start loading" notif, since the real one happened uselessly inside the ABI15_0_0RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:ABI15_0_0RCTJavaScriptWillStartLoadingNotification object:bridge];
}

- (void)bridgeFinishedLoading
{

}

- (void)bridgeDidForeground
{
  if (_isFirstLoad) {
    // reverse the ABI15_0_0RCT-triggered first swap, so the ABI15_0_0RCT implementation is back in its original place
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
  _statusbarStyle = [ABI15_0_0RCTSharedApplication() statusBarStyle];
  _isStatusBarHidden = [ABI15_0_0RCTSharedApplication() isStatusBarHidden];
}

- (void)resetSharedState
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [ABI15_0_0RCTSharedApplication() setStatusBarStyle:_statusbarStyle];
  [ABI15_0_0RCTSharedApplication() setStatusBarHidden: _isStatusBarHidden];
#pragma clang diagnostic pop
}

- (void)invalidate
{

}


#pragma mark - internal

- (void)configureABIWithFatalHandler:(void (^)(NSError *))fatalHandler
                         logFunction:(void (^)(NSInteger, NSInteger, NSString *, NSNumber *, NSString *))logFunction
                        logThreshold:(NSInteger)threshold
{
  if (ABI15_0_0EXVersionManagerIsFirstLoad == nil) {
    // first time initializing this RN version at runtime
    _isFirstLoad = YES;
  }
  ABI15_0_0EXVersionManagerIsFirstLoad = @(NO);
  ABI15_0_0RCTSetFatalHandler(fatalHandler);
  ABI15_0_0RCTSetLogThreshold(threshold);
  ABI15_0_0RCTSetLogFunction(logFunction);
}

- (void)swapSystemMethods
{
#if ABI15_0_0RCT_DEV
  // key commands
  SEL ABI15_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI15_0_0RCT_keyCommands");
  ABI15_0_0RCTSwapInstanceMethods([UIResponder class],
                         @selector(keyCommands),
                         ABI15_0_0RCTCommandsSelector);
  
  // shake gesture
  SEL ABI15_0_0RCTMotionSelector = NSSelectorFromString(@"ABI15_0_0RCT_motionEnded:withEvent:");
  ABI15_0_0RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), ABI15_0_0RCTMotionSelector);
#endif
}

- (void)setSystemMethods
{
#if ABI15_0_0RCT_DEV
  // key commands
  SEL ABI15_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI15_0_0RCT_keyCommands");
  ABI15_0_0EXSetInstanceMethod([UIResponder class],
                         @selector(keyCommands),
                         ABI15_0_0RCTCommandsSelector);
  
  // shake gesture
  SEL ABI15_0_0RCTMotionSelector = NSSelectorFromString(@"ABI15_0_0RCT_motionEnded:withEvent:");
  ABI15_0_0EXSetInstanceMethod([UIWindow class], @selector(motionEnded:withEvent:), ABI15_0_0RCTMotionSelector);
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
 *    ABI15_0_0EXKernel *kernel
 *    NSArray *supportedSdkVersions
 *    id exceptionsManagerDelegate
 *
 * Frame-only:
 *    ABI15_0_0EXFrame *frame
 */
- (NSArray *)extraModulesWithParams:(NSDictionary *)params
{
  NSURL *initialUri = params[@"initialUri"];
  BOOL isDeveloper = [params[@"isDeveloper"] boolValue];
  ABI15_0_0EXScope *experienceScope = [[ABI15_0_0EXScope alloc] initWithParams:params];

  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    experienceScope,
                                    [[ABI15_0_0EXAppState alloc] init],
                                    [[ABI15_0_0EXConstants alloc] initWithProperties:params[@"constants"]],
                                    [[ABI15_0_0EXDevSettings alloc] initWithExperienceId:experienceScope.experienceId],
                                    [[ABI15_0_0EXDisabledDevLoadingView alloc] init],
                                    [[ABI15_0_0EXLinkingManager alloc] initWithInitialUrl:initialUri],
                                    ]];
  if (params[@"frame"]) {
    [extraModules addObject:[[ABI15_0_0EXFrameExceptionsManager alloc] initWithDelegate:params[@"frame"]]];
  } else {
    id exceptionsManagerDelegate = params[@"exceptionsManagerDelegate"];
    if (exceptionsManagerDelegate) {
      ABI15_0_0RCTExceptionsManager *exceptionsManager = [[ABI15_0_0RCTExceptionsManager alloc] initWithDelegate:exceptionsManagerDelegate];
      [extraModules addObject:exceptionsManager];
    } else {
      ABI15_0_0RCTLogWarn(@"No exceptions manager provided when building extra modules for bridge.");
    }
  }
  
  if (params[@"kernel"]) {
    ABI15_0_0EXKernelModule *kernel = [[ABI15_0_0EXKernelModule alloc] initWithVersions:params[@"supportedSdkVersions"]];
    kernel.delegate = params[@"kernel"];
    [extraModules addObject:kernel];
  }
  
  if (isDeveloper) {
    [extraModules addObjectsFromArray:@[
                                        [[ABI15_0_0RCTDevMenu alloc] init],
                                        ]];
  } else {
    // user-facing (not debugging).
    // additionally disable ABI15_0_0RCTRedBox and ABI15_0_0RCTDevMenu
    [extraModules addObjectsFromArray:@[
                                        [[ABI15_0_0EXDisabledDevMenu alloc] init],
                                        [[ABI15_0_0EXDisabledRedBox alloc] init],
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
