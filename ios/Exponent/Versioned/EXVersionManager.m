// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppState.h"
#import "EXConstants.h"
#import "EXDevSettings.h"
#import "EXDisabledDevLoadingView.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXFrameExceptionsManager.h"
#import "EXKernelModule.h"
#import "EXLinkingManager.h"
#import "EXVersionManager.h"
#import "EXScope.h"

#import <React/RCTAssert.h>
#import "RCTDevMenu+Device.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import <objc/message.h>

static NSNumber *EXVersionManagerIsFirstLoad;

void EXSetInstanceMethod(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  
  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);
  
  if (!class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    method_setImplementation(originalMethod, replacementImplementation);
  }
}

@interface EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;
@property (nonatomic, assign) BOOL isStatusBarHidden;
@property (nonatomic, assign) UIStatusBarStyle statusbarStyle;

@end

@implementation EXVersionManager

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
  // manually send a "start loading" notif, since the real one happened uselessly inside the RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:RCTJavaScriptWillStartLoadingNotification object:bridge];
}

- (void)bridgeFinishedLoading
{

}

- (void)bridgeDidForeground
{
  if (_isFirstLoad) {
    // reverse the RCT-triggered first swap, so the RCT implementation is back in its original place
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
  _statusbarStyle = [RCTSharedApplication() statusBarStyle];
  _isStatusBarHidden = [RCTSharedApplication() isStatusBarHidden];
}

- (void)resetSharedState
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [RCTSharedApplication() setStatusBarStyle:_statusbarStyle];
  [RCTSharedApplication() setStatusBarHidden: _isStatusBarHidden];
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
  if (EXVersionManagerIsFirstLoad == nil) {
    // first time initializing this RN version at runtime
    _isFirstLoad = YES;
  }
  EXVersionManagerIsFirstLoad = @(NO);
  RCTSetFatalHandler(fatalHandler);
  RCTSetLogThreshold(threshold);
  RCTSetLogFunction(logFunction);
}

- (void)swapSystemMethods
{
#if RCT_DEV
  // key commands
  SEL RCTCommandsSelector = NSSelectorFromString(@"RCT_keyCommands");
  RCTSwapInstanceMethods([UIResponder class],
                         @selector(keyCommands),
                         RCTCommandsSelector);
  
  // shake gesture
  SEL RCTMotionSelector = NSSelectorFromString(@"RCT_motionEnded:withEvent:");
  RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), RCTMotionSelector);
#endif
}

- (void)setSystemMethods
{
#if RCT_DEV
  // key commands
  SEL RCTCommandsSelector = NSSelectorFromString(@"RCT_keyCommands");
  EXSetInstanceMethod([UIResponder class],
                         @selector(keyCommands),
                         RCTCommandsSelector);
  
  // shake gesture
  SEL RCTMotionSelector = NSSelectorFromString(@"RCT_motionEnded:withEvent:");
  EXSetInstanceMethod([UIWindow class], @selector(motionEnded:withEvent:), RCTMotionSelector);
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
 *    EXKernel *kernel
 *    NSArray *supportedSdkVersions
 *    id exceptionsManagerDelegate
 *
 * Frame-only:
 *    EXFrame *frame
 */
- (NSArray *)extraModulesWithParams:(NSDictionary *)params
{
  NSURL *initialUri = params[@"initialUri"];
  BOOL isDeveloper = [params[@"isDeveloper"] boolValue];
  EXScope *experienceScope = [[EXScope alloc] initWithParams:params];

  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    experienceScope,
                                    [[EXAppState alloc] init],
                                    [[EXConstants alloc] initWithProperties:params[@"constants"]],
                                    [[EXDevSettings alloc] initWithExperienceId:experienceScope.experienceId],
                                    [[EXDisabledDevLoadingView alloc] init],
                                    [[EXLinkingManager alloc] initWithInitialUrl:initialUri],
                                    ]];
  if (params[@"frame"]) {
    [extraModules addObject:[[EXFrameExceptionsManager alloc] initWithDelegate:params[@"frame"]]];
  } else {
    id exceptionsManagerDelegate = params[@"exceptionsManagerDelegate"];
    if (exceptionsManagerDelegate) {
      RCTExceptionsManager *exceptionsManager = [[RCTExceptionsManager alloc] initWithDelegate:exceptionsManagerDelegate];
      [extraModules addObject:exceptionsManager];
    } else {
      RCTLogWarn(@"No exceptions manager provided when building extra modules for bridge.");
    }
  }
  
  if (params[@"kernel"]) {
    EXKernelModule *kernel = [[EXKernelModule alloc] initWithVersions:params[@"supportedSdkVersions"]];
    kernel.delegate = params[@"kernel"];
    [extraModules addObject:kernel];
  }
  
  if (isDeveloper) {
    [extraModules addObjectsFromArray:@[
                                        [[RCTDevMenu alloc] init],
                                        ]];
  } else {
    // user-facing (not debugging).
    // additionally disable RCTRedBox and RCTDevMenu
    [extraModules addObjectsFromArray:@[
                                        [[EXDisabledDevMenu alloc] init],
                                        [[EXDisabledRedBox alloc] init],
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
