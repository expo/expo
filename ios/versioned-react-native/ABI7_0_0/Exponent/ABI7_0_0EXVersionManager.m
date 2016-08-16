// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI7_0_0EXConstants.h"
#import "ABI7_0_0EXDisabledDevLoadingView.h"
#import "ABI7_0_0EXDisabledDevMenu.h"
#import "ABI7_0_0EXDisabledRedBox.h"
#import "ABI7_0_0EXFrameExceptionsManager.h"
#import "ABI7_0_0EXLinkingManager.h"
#import "ABI7_0_0EXNotifications.h"
#import "ABI7_0_0EXVersionManager.h"

#import "ABI7_0_0RCTAssert.h"
#import "ABI7_0_0RCTDevMenu+Device.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTUtils.h"

#import <objc/message.h>

typedef NSMutableDictionary <NSString *, NSMutableArray<NSValue *> *> ABI7_0_0EXClassPointerMap;

static ABI7_0_0EXClassPointerMap *ABI7_0_0EXVersionedOnceTokens;
ABI7_0_0EXClassPointerMap *ABI7_0_0EXGetVersionedOnceTokens(void);
ABI7_0_0EXClassPointerMap *ABI7_0_0EXGetVersionedOnceTokens(void)
{
  return ABI7_0_0EXVersionedOnceTokens;
}

void ABI7_0_0EXSetInstanceMethod(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  
  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);
  
  if (!class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    method_setImplementation(originalMethod, replacementImplementation);
  }
}

@interface ABI7_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;

@end

@implementation ABI7_0_0EXVersionManager

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
  // manually send a "start loading" notif, since the real one happened uselessly inside the ABI7_0_0RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:ABI7_0_0RCTJavaScriptWillStartLoadingNotification object:bridge];
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
  [self resetOnceTokens];
}

+ (void)registerOnceToken:(dispatch_once_t *)token forClass:(NSString *)someClass
{
  ABI7_0_0EXClassPointerMap *onceTokens = ABI7_0_0EXGetVersionedOnceTokens();
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
  if (ABI7_0_0EXVersionedOnceTokens == nil) {
    // first time initializing this RN version at runtime
    _isFirstLoad = YES;
  }
  ABI7_0_0EXVersionedOnceTokens = [NSMutableDictionary dictionary];
  ABI7_0_0RCTSetFatalHandler(fatalHandler);
  ABI7_0_0RCTSetLogThreshold(threshold);
  ABI7_0_0RCTSetLogFunction(logFunction);
}

- (void)resetOnceTokens
{
  ABI7_0_0EXClassPointerMap *onceTokens = ABI7_0_0EXGetVersionedOnceTokens();
  [onceTokens enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, NSMutableArray<NSValue *> * _Nonnull tokensForClass, BOOL * _Nonnull stop) {
    for (NSValue *val in tokensForClass) {
      dispatch_once_t *existing = [val pointerValue];
      *existing = 0;
    }
  }];
}

- (void)swapSystemMethods
{
#if ABI7_0_0RCT_DEV
  // key commands
  SEL ABI7_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI7_0_0RCT_keyCommands");
  SEL ABI7_0_0RCTSendActionSelector = NSSelectorFromString(@"ABI7_0_0RCT_sendAction:to:from:forEvent:");
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    ABI7_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(keyCommands),
                           ABI7_0_0RCTCommandsSelector);
    
    ABI7_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           ABI7_0_0RCTSendActionSelector);
  } else {
    ABI7_0_0RCTSwapInstanceMethods([UIResponder class],
                           @selector(keyCommands),
                           ABI7_0_0RCTCommandsSelector);
  }
  
  // shake gesture
  SEL ABI7_0_0RCTMotionSelector = NSSelectorFromString(@"ABI7_0_0RCT_motionEnded:withEvent:");
  ABI7_0_0RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), ABI7_0_0RCTMotionSelector);
#endif
}

- (void)setSystemMethods
{
#if ABI7_0_0RCT_DEV
  // key commands
  SEL ABI7_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI7_0_0RCT_keyCommands");
  if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
    ABI7_0_0EXSetInstanceMethod([UIApplication class],
                           @selector(keyCommands),
                           ABI7_0_0RCTCommandsSelector);
    
    // don't support this set on iOS 8.x -- results in a recursive call.
    // in this case people will just need to live without key commands.

    /* ABI7_0_0EXSetInstanceMethod([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           ABI7_0_0RCTSendActionSelector); */
  } else {
    ABI7_0_0EXSetInstanceMethod([UIResponder class],
                           @selector(keyCommands),
                           ABI7_0_0RCTCommandsSelector);
  }
  
  // shake gesture
  SEL ABI7_0_0RCTMotionSelector = NSSelectorFromString(@"ABI7_0_0RCT_motionEnded:withEvent:");
  ABI7_0_0EXSetInstanceMethod([UIWindow class], @selector(motionEnded:withEvent:), ABI7_0_0RCTMotionSelector);
#endif
}

/**
 *  Expected params:
 *    EXFrame *frame
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
                                    [[ABI7_0_0EXConstants alloc] initWithProperties:constants],
                                    [[ABI7_0_0EXDisabledDevLoadingView alloc] init],
                                    [[ABI7_0_0EXFrameExceptionsManager alloc] initWithDelegate:frame],
                                    [[ABI7_0_0EXLinkingManager alloc] initWithInitialUrl:initialUri],
                                    [[ABI7_0_0EXNotifications alloc] initWithExperienceId:experienceId],
                                    ]];
  
  if (!isDeveloper) {
    // user-facing (not debugging).
    // additionally disable RCTRedBox and RCTDevMenu
    [extraModules addObjectsFromArray:@[
                                        [[ABI7_0_0EXDisabledDevMenu alloc] init],
                                        [[ABI7_0_0EXDisabledRedBox alloc] init],
                                        ]];
  }
  return extraModules;
};

@end
