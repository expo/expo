// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppState.h"
#import "EXConstants.h"
#import "EXDisabledDevLoadingView.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXFileSystem.h"
#import "EXFrameExceptionsManager.h"
#import "EXKernelModule.h"
#import "EXLinkingManager.h"
#import "EXNotifications.h"
#import "EXVersionManager.h"
#import "EXAmplitude.h"
#import "EXSegment.h"
#import "EXUtil.h"

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
  }
  // now modify system behavior with no swap
  [self setSystemMethods];
}

- (void)bridgeDidBackground
{
  
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
  SEL RCTSendActionSelector = NSSelectorFromString(@"RCT_sendAction:to:from:forEvent:");
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    RCTSwapInstanceMethods([UIApplication class],
                           @selector(keyCommands),
                           RCTCommandsSelector);
    
    RCTSwapInstanceMethods([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           RCTSendActionSelector);
  } else {
    RCTSwapInstanceMethods([UIResponder class],
                           @selector(keyCommands),
                           RCTCommandsSelector);
  }
  
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
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    EXSetInstanceMethod([UIApplication class],
                           @selector(keyCommands),
                           RCTCommandsSelector);
    
    // don't support this set on iOS 8.x -- results in a recursive call.
    // in this case people will just need to live without key commands.

    /* EXSetInstanceMethod([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           RCTSendActionSelector); */
  } else {
    EXSetInstanceMethod([UIResponder class],
                           @selector(keyCommands),
                           RCTCommandsSelector);
  }
  
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
  NSDictionary *manifest = params[@"manifest"];
  NSURL *initialUri = params[@"initialUri"];
  NSDictionary *constants = params[@"constants"];
  BOOL isDeveloper = [params[@"isDeveloper"] boolValue];
  NSString *experienceId = [manifest objectForKey:@"id"];

  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    [[EXAppState alloc] init],
                                    [[EXConstants alloc] initWithProperties:constants],
                                    [[EXDisabledDevLoadingView alloc] init],
                                    [[EXFileSystem alloc] initWithExperienceId:experienceId],
                                    [[EXLinkingManager alloc] initWithInitialUrl:initialUri],
                                    [[EXNotifications alloc] initWithExperienceId:experienceId],
                                    [[EXAmplitude alloc] initWithExperienceId:experienceId],
                                    [[EXSegment alloc] init],
                                    [[EXUtil alloc] init],
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
