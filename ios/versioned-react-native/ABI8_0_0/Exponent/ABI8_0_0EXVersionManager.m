// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI8_0_0EXAppState.h"
#import "ABI8_0_0EXConstants.h"
#import "ABI8_0_0EXDisabledDevLoadingView.h"
#import "ABI8_0_0EXDisabledDevMenu.h"
#import "ABI8_0_0EXDisabledRedBox.h"
#import "ABI8_0_0EXFileSystem.h"
#import "ABI8_0_0EXFrameExceptionsManager.h"
#import "ABI8_0_0EXLinkingManager.h"
#import "ABI8_0_0EXNotifications.h"
#import "ABI8_0_0EXVersionManager.h"

#import "ABI8_0_0RCTAssert.h"
#import "ABI8_0_0RCTDevMenu+Device.h"
#import "ABI8_0_0RCTLog.h"
#import "ABI8_0_0RCTUtils.h"

#import <objc/message.h>

typedef NSMutableDictionary <NSString *, NSMutableArray<NSValue *> *> ABI8_0_0EXClassPointerMap;

static ABI8_0_0EXClassPointerMap *ABI8_0_0EXVersionedOnceTokens;
ABI8_0_0EXClassPointerMap *ABI8_0_0EXGetVersionedOnceTokens(void);
ABI8_0_0EXClassPointerMap *ABI8_0_0EXGetVersionedOnceTokens(void)
{
  return ABI8_0_0EXVersionedOnceTokens;
}

void ABI8_0_0EXSetInstanceMethod(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  
  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);
  
  if (!class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    method_setImplementation(originalMethod, replacementImplementation);
  }
}

@interface ABI8_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;

@end

@implementation ABI8_0_0EXVersionManager

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
  // manually send a "start loading" notif, since the real one happened uselessly inside the ABI8_0_0RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:ABI8_0_0RCTJavaScriptWillStartLoadingNotification object:bridge];
}

- (void)bridgeFinishedLoading
{
  
}

- (void)bridgeDidForeground
{
  if (_isFirstLoad) {
    // reverse the ABI8_0_0RCT-triggered first swap, so the ABI8_0_0RCT implementation is back in its original place
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
  [self resetOnceTokens];
}

+ (void)registerOnceToken:(dispatch_once_t *)token forClass:(NSString *)someClass
{
  ABI8_0_0EXClassPointerMap *onceTokens = ABI8_0_0EXGetVersionedOnceTokens();
  if (!onceTokens[someClass]) {
    [onceTokens setObject:[NSMutableArray array] forKey:someClass];
  }
  NSMutableArray<NSValue *> *tokensForClass = onceTokens[someClass];
  for (NSValue *val in tokensForClass) {
    dispatch_once_t *existing = [val pointerValue];
    if (existing == token)
      return;
  }
  [tokensForClass addObject:[NSValue valueWithPointer:token]];
}


#pragma mark - internal

- (void)configureABIWithFatalHandler:(void (^)(NSError *))fatalHandler
                         logFunction:(void (^)(NSInteger, NSInteger, NSString *, NSNumber *, NSString *))logFunction
                        logThreshold:(NSInteger)threshold
{
  if (ABI8_0_0EXVersionedOnceTokens == nil) {
    // first time initializing this RN version at runtime
    _isFirstLoad = YES;
  }
  ABI8_0_0EXVersionedOnceTokens = [NSMutableDictionary dictionary];
  ABI8_0_0RCTSetFatalHandler(fatalHandler);
  ABI8_0_0RCTSetLogThreshold(threshold);
  ABI8_0_0RCTSetLogFunction(logFunction);
}

- (void)resetOnceTokens
{
  ABI8_0_0EXClassPointerMap *onceTokens = ABI8_0_0EXGetVersionedOnceTokens();
  [onceTokens enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, NSMutableArray<NSValue *> * _Nonnull tokensForClass, BOOL * _Nonnull stop) {
    for (NSValue *val in tokensForClass) {
      dispatch_once_t *existing = [val pointerValue];
      *existing = 0;
    }
  }];
}

- (void)swapSystemMethods
{
#if ABI8_0_0RCT_DEV
  // key commands
  SEL ABI8_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI8_0_0RCT_keyCommands");
  SEL ABI8_0_0RCTSendActionSelector = NSSelectorFromString(@"ABI8_0_0RCT_sendAction:to:from:forEvent:");
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    ABI8_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(keyCommands),
                           ABI8_0_0RCTCommandsSelector);
    
    ABI8_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           ABI8_0_0RCTSendActionSelector);
  } else {
    ABI8_0_0RCTSwapInstanceMethods([UIResponder class],
                           @selector(keyCommands),
                           ABI8_0_0RCTCommandsSelector);
  }
  
  // shake gesture
  SEL ABI8_0_0RCTMotionSelector = NSSelectorFromString(@"ABI8_0_0RCT_motionEnded:withEvent:");
  ABI8_0_0RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), ABI8_0_0RCTMotionSelector);
#endif
}

- (void)setSystemMethods
{
#if ABI8_0_0RCT_DEV
  // key commands
  SEL ABI8_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI8_0_0RCT_keyCommands");
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    ABI8_0_0EXSetInstanceMethod([UIApplication class],
                        @selector(keyCommands),
                        ABI8_0_0RCTCommandsSelector);
    
    // don't support this set on iOS 8.x -- results in a recursive call.
    // in this case people will just need to live without key commands.
    
    /* ABI8_0_0EXSetInstanceMethod([UIApplication class],
     @selector(sendAction:to:from:forEvent:),
     ABI8_0_0RCTSendActionSelector); */
  } else {
    ABI8_0_0EXSetInstanceMethod([UIResponder class],
                        @selector(keyCommands),
                        ABI8_0_0RCTCommandsSelector);
  }
  
  // shake gesture
  SEL ABI8_0_0RCTMotionSelector = NSSelectorFromString(@"ABI8_0_0RCT_motionEnded:withEvent:");
  ABI8_0_0EXSetInstanceMethod([UIWindow class], @selector(motionEnded:withEvent:), ABI8_0_0RCTMotionSelector);
#endif
}

/**
 *  Expected params:
 *    ABI8_0_0EXFrame *frame
 *    NSDictionary *manifest
 *    NSDictionary *constants
 *    NSURL *initialUri
 *    @BOOL isDeveloper
 */
- (NSArray *)extraModulesWithParams:(NSDictionary *)params
{
  id frame = params[@"frame"];
  NSDictionary *manifest = params[@"manifest"];
  NSURL *initialUri = params[@"initialUri"];
  NSDictionary *constants = params[@"constants"];
  BOOL isDeveloper = [params[@"isDeveloper"] boolValue];
  NSString *experienceId = [manifest objectForKey:@"id"];
  
  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    [[ABI8_0_0EXAppState alloc] init],
                                    [[ABI8_0_0EXConstants alloc] initWithProperties:constants],
                                    [[ABI8_0_0EXDisabledDevLoadingView alloc] init],
                                    [[ABI8_0_0EXFileSystem alloc] initWithExperienceId:experienceId],
                                    [[ABI8_0_0EXFrameExceptionsManager alloc] initWithDelegate:frame],
                                    [[ABI8_0_0EXLinkingManager alloc] initWithInitialUrl:initialUri],
                                    [[ABI8_0_0EXNotifications alloc] initWithExperienceId:experienceId],
                                    ]];
  
  if (isDeveloper) {
    [extraModules addObjectsFromArray:@[
                                        [[ABI8_0_0RCTDevMenu alloc] init],
                                        ]];
  } else {
    // user-facing (not debugging).
    // additionally disable ABI8_0_0RCTRedBox and ABI8_0_0RCTDevMenu
    [extraModules addObjectsFromArray:@[
                                        [[ABI8_0_0EXDisabledDevMenu alloc] init],
                                        [[ABI8_0_0EXDisabledRedBox alloc] init],
                                        ]];
  }
  return extraModules;
};

@end
