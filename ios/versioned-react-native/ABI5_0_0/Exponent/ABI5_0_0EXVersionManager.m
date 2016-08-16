// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI5_0_0EXConstants.h"
#import "ABI5_0_0EXDisabledDevLoadingView.h"
#import "ABI5_0_0EXDisabledDevMenu.h"
#import "ABI5_0_0EXDisabledRedBox.h"
#import "ABI5_0_0EXFrameExceptionsManager.h"
#import "ABI5_0_0EXVersionManager.h"

#import "ABI5_0_0RCTAssert.h"
#import "ABI5_0_0RCTDevMenu+Device.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTUtils.h"

#import <objc/message.h>

typedef NSMutableDictionary <NSString *, NSMutableArray<NSValue *> *> ABI5_0_0EXClassPointerMap;

static ABI5_0_0EXClassPointerMap *ABI5_0_0EXVersionedOnceTokens;
ABI5_0_0EXClassPointerMap *ABI5_0_0EXGetVersionedOnceTokens(void);
ABI5_0_0EXClassPointerMap *ABI5_0_0EXGetVersionedOnceTokens(void)
{
    return ABI5_0_0EXVersionedOnceTokens;
}

void ABI5_0_0EXSetInstanceMethod(Class cls, SEL original, SEL replacement)
{
    Method originalMethod = class_getInstanceMethod(cls, original);
    
    Method replacementMethod = class_getInstanceMethod(cls, replacement);
    IMP replacementImplementation = method_getImplementation(replacementMethod);
    const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);
    
    if (!class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
        method_setImplementation(originalMethod, replacementImplementation);
    }
}

@interface ABI5_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;

@end

@implementation ABI5_0_0EXVersionManager

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
    // manually send a "start loading" notif, since the real one happened uselessly inside the ABI5_0_0RCTBatchedBridge constructor
    [[NSNotificationCenter defaultCenter]
     postNotificationName:ABI5_0_0RCTJavaScriptWillStartLoadingNotification object:bridge];
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
    ABI5_0_0EXClassPointerMap *onceTokens = ABI5_0_0EXGetVersionedOnceTokens();
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
    if (ABI5_0_0EXVersionedOnceTokens == nil) {
        // first time initializing this RN version at runtime
        _isFirstLoad = YES;
    }
    ABI5_0_0EXVersionedOnceTokens = [NSMutableDictionary dictionary];
    ABI5_0_0RCTSetFatalHandler(fatalHandler);
    ABI5_0_0RCTSetLogThreshold(threshold);
    ABI5_0_0RCTSetLogFunction(logFunction);
}

- (void)resetOnceTokens
{
    ABI5_0_0EXClassPointerMap *onceTokens = ABI5_0_0EXGetVersionedOnceTokens();
    [onceTokens enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, NSMutableArray<NSValue *> * _Nonnull tokensForClass, BOOL * _Nonnull stop) {
        for (NSValue *val in tokensForClass) {
            dispatch_once_t *existing = [val pointerValue];
            *existing = 0;
        }
    }];
}

- (void)swapSystemMethods
{
#if ABI5_0_0RCT_DEV
    // key commands
    SEL ABI5_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI5_0_0RCT_keyCommands");
    SEL ABI5_0_0RCTSendActionSelector = NSSelectorFromString(@"ABI5_0_0RCT_sendAction:to:from:forEvent:");
    if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
        ABI5_0_0RCTSwapInstanceMethods([UIApplication class],
                               @selector(keyCommands),
                               ABI5_0_0RCTCommandsSelector);
        
        ABI5_0_0RCTSwapInstanceMethods([UIApplication class],
                               @selector(sendAction:to:from:forEvent:),
                               ABI5_0_0RCTSendActionSelector);
    } else {
        ABI5_0_0RCTSwapInstanceMethods([UIResponder class],
                               @selector(keyCommands),
                               ABI5_0_0RCTCommandsSelector);
    }
    
    // shake gesture
    SEL ABI5_0_0RCTMotionSelector = NSSelectorFromString(@"ABI5_0_0RCT_motionEnded:withEvent:");
    ABI5_0_0RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), ABI5_0_0RCTMotionSelector);
#endif
}

- (void)setSystemMethods
{
#if ABI5_0_0RCT_DEV
    // key commands
    SEL ABI5_0_0RCTCommandsSelector = NSSelectorFromString(@"ABI5_0_0RCT_keyCommands");
    SEL ABI5_0_0RCTSendActionSelector = NSSelectorFromString(@"ABI5_0_0RCT_sendAction:to:from:forEvent:");
    if ([UIDevice currentDevice].systemVersion.floatValue < 9) {
        ABI5_0_0EXSetInstanceMethod([UIApplication class],
                            @selector(keyCommands),
                            ABI5_0_0RCTCommandsSelector);

        // don't support this set on iOS 8.x -- results in a recursive call.
        // in this case people will just need to live without key commands.

        /* ABI5_0_0EXSetInstanceMethod([UIApplication class],
                            @selector(sendAction:to:from:forEvent:),
                            ABI5_0_0RCTSendActionSelector); */
    } else {
        ABI5_0_0EXSetInstanceMethod([UIResponder class],
                            @selector(keyCommands),
                            ABI5_0_0RCTCommandsSelector);
    }
    
    // shake gesture
    SEL ABI5_0_0RCTMotionSelector = NSSelectorFromString(@"ABI5_0_0RCT_motionEnded:withEvent:");
    ABI5_0_0EXSetInstanceMethod([UIWindow class], @selector(motionEnded:withEvent:), ABI5_0_0RCTMotionSelector);
#endif
}

/**
 *  Expected params:
 *    EXFrame *frame
 *    @BOOL isDeveloper
 */
- (NSArray *)extraModulesWithParams:(NSDictionary *)params
{
  id frame = params[@"frame"];
  BOOL isDeveloper = [params[@"isDeveloper"] boolValue];
  
  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    [[ABI5_0_0EXConstants alloc] init],
                                    [[ABI5_0_0EXDisabledDevLoadingView alloc] init],
                                    [[ABI5_0_0EXFrameExceptionsManager alloc] initWithDelegate:frame],
                                    ]];
  
  if (!isDeveloper) {
    // user-facing (not debugging).
    // additionally disable RCTRedBox and RCTDevMenu
    [extraModules addObjectsFromArray:@[
                                        [[ABI5_0_0EXDisabledDevMenu alloc] init],
                                        [[ABI5_0_0EXDisabledRedBox alloc] init],
                                        ]];
  }
  return extraModules;
};

@end
