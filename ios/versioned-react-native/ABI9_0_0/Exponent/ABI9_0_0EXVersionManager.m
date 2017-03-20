// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXAppState.h"
#import "ABI9_0_0EXConstants.h"
#import "ABI9_0_0EXDisabledDevLoadingView.h"
#import "ABI9_0_0EXDisabledDevMenu.h"
#import "ABI9_0_0EXDisabledRedBox.h"
#import "ABI9_0_0EXFileSystem.h"
#import "ABI9_0_0EXFrameExceptionsManager.h"
#import "ABI9_0_0EXLinkingManager.h"
#import "ABI9_0_0EXNotifications.h"
#import "ABI9_0_0EXVersionManager.h"

#import "ABI9_0_0RCTAssert.h"
#import "ABI9_0_0RCTDevMenu+Device.h"
#import "ABI9_0_0RCTLog.h"
#import "ABI9_0_0RCTUtils.h"

#import <objc/message.h>

typedef NSMutableDictionary <NSString *, NSMutableArray<NSValue *> *> ABI9_0_0EXClassPointerMap;

static ABI9_0_0EXClassPointerMap *ABI9_0_0EXVersionedOnceTokens;
ABI9_0_0EXClassPointerMap *ABI9_0_0EXGetVersionedOnceTokens(void);
ABI9_0_0EXClassPointerMap *ABI9_0_0EXGetVersionedOnceTokens(void)
{
  return ABI9_0_0EXVersionedOnceTokens;
}

void ABI9_0_0EXSetInstanceMethod(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  
  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);
  
  if (!class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    method_setImplementation(originalMethod, replacementImplementation);
  }
}

@interface ABI9_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;
@property (nonatomic, assign) BOOL isStatusBarHidden;
@property (nonatomic, assign) UIStatusBarStyle statusbarStyle;

@end

@implementation ABI9_0_0EXVersionManager

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
  // manually send a "start loading" notif, since the real one happened uselessly inside the ABI9_0_0RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:ABI9_0_0RCTJavaScriptWillStartLoadingNotification object:bridge];
}

- (void)bridgeFinishedLoading
{

}

- (void)bridgeDidForeground
{
  if (_isFirstLoad) {
    // reverse the ABI9_0_0RCT-triggered first swap, so the ABI9_0_0RCT implementation is back in its original place
    [self swapSystemMethods];
    _isFirstLoad = NO; // in case the same VersionManager instance is used between multiple bridge loads
  } else {
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
  _statusbarStyle = [ABI9_0_0RCTSharedApplication() statusBarStyle];
  _isStatusBarHidden = [ABI9_0_0RCTSharedApplication() isStatusBarHidden];
}

- (void)resetSharedState
{
  [ABI9_0_0RCTSharedApplication() setStatusBarStyle:_statusbarStyle];
  [ABI9_0_0RCTSharedApplication() setStatusBarHidden: _isStatusBarHidden];
}

- (void)invalidate
{
  [self resetOnceTokens];
}

+ (void)registerOnceToken:(dispatch_once_t *)token forClass:(NSString *)someClass
{
  ABI9_0_0EXClassPointerMap *onceTokens = ABI9_0_0EXGetVersionedOnceTokens();
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
  if (ABI9_0_0EXVersionedOnceTokens == nil) {
    // first time initializing this RN version at runtime
    _isFirstLoad = YES;
  }
  ABI9_0_0EXVersionedOnceTokens = [NSMutableDictionary dictionary];
  ABI9_0_0RCTSetFatalHandler(fatalHandler);
  ABI9_0_0RCTSetLogThreshold(threshold);
  ABI9_0_0RCTSetLogFunction(logFunction);
}

- (void)resetOnceTokens
{
  ABI9_0_0EXClassPointerMap *onceTokens = ABI9_0_0EXGetVersionedOnceTokens();
  [onceTokens enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, NSMutableArray<NSValue *> * _Nonnull tokensForClass, BOOL * _Nonnull stop) {
    for (NSValue *val in tokensForClass) {
      dispatch_once_t *existing = [val pointerValue];
      *existing = 0;
    }
  }];
}

- (void)swapSystemMethods
{
}

- (void)setSystemMethods
{
}

/**
 *  Expected params:
 *    ABI9_0_0EXFrame *frame
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
                                    [[ABI9_0_0EXAppState alloc] init],
                                    [[ABI9_0_0EXConstants alloc] initWithProperties:constants],
                                    [[ABI9_0_0EXDisabledDevLoadingView alloc] init],
                                    [[ABI9_0_0EXFileSystem alloc] initWithExperienceId:experienceId],
                                    [[ABI9_0_0EXFrameExceptionsManager alloc] initWithDelegate:frame],
                                    [[ABI9_0_0EXLinkingManager alloc] initWithInitialUrl:initialUri],
                                    [[ABI9_0_0EXNotifications alloc] initWithExperienceId:experienceId],
                                    ]];

  if (isDeveloper) {
    [extraModules addObjectsFromArray:@[
                                        [[ABI9_0_0RCTDevMenu alloc] init],
                                        ]];
  } else {
    // user-facing (not debugging).
    // additionally disable ABI9_0_0RCTRedBox and ABI9_0_0RCTDevMenu
    [extraModules addObjectsFromArray:@[
                                        [[ABI9_0_0EXDisabledDevMenu alloc] init],
                                        [[ABI9_0_0EXDisabledRedBox alloc] init],
                                        ]];
  }
  return extraModules;
};

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end
