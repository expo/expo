//
//  RNBranchEventEmitter.m
//  Pods
//
//  Created by Jimmy Dee on 4/6/17.
//
//

#import <React/RCTLog.h>

#import "RNBranch.h"
#import "RNBranchEventEmitter.h"

// Notification/Event Names
NSString * const RNBranchInitSessionSuccess = @"RNBranch.initSessionSuccess";
NSString * const RNBranchInitSessionError = @"RNBranch.initSessionError";

@interface RNBranchEventEmitter()
@property (nonatomic) BOOL hasListeners;
@end

@implementation RNBranchEventEmitter

RCT_EXPORT_MODULE();

- (instancetype)init
{
    self = [super init];
    if (self) {
        _hasListeners = NO;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[RNBranchInitSessionSuccess,
             RNBranchInitSessionError
             ];
}

- (void)startObserving {
    self.hasListeners = YES;
    for (NSString *event in [self supportedEvents]) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleNotification:)
                                                     name:event
                                                   object:nil];
    }
}

- (void)stopObserving {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    self.hasListeners = NO;
}

# pragma mark - Public

+ (void)initSessionDidSucceedWithPayload:(NSDictionary *)payload
{
    [self postNotificationName:RNBranchInitSessionSuccess withPayload:payload];
}

+ (void)initSessionDidEncounterErrorWithPayload:(NSDictionary *)payload
{
    [self postNotificationName:RNBranchInitSessionError withPayload:payload];
}

# pragma mark - Private

+ (void)postNotificationName:(NSString *)name withPayload:(NSDictionary<NSString *, id> *)payload {
    [[NSNotificationCenter defaultCenter] postNotificationName:name
                                                        object:self
                                                      userInfo:payload];
}

- (void)handleNotification:(NSNotification *)notification {
    if (!self.hasListeners) return;
    [self sendEventWithName:notification.name body:notification.userInfo];
}

@end
