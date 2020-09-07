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
NSString * const kRNBranchInitSessionStart = @"RNBranch.initSessionStart";
NSString * const kRNBranchInitSessionSuccess = @"RNBranch.initSessionSuccess";
NSString * const kRNBranchInitSessionError = @"RNBranch.initSessionError";

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

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
        kRNBranchInitSessionStart,
        kRNBranchInitSessionSuccess,
        kRNBranchInitSessionError
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

+ (void)initSessionWillStartWithURI:(NSURL *)uri
{
    /*
     * Transmits an Object to JS with a member named uri. This member
     * will be null if the uri argument here is nil (e.g. Spotlight item).
     *
     * branch.subscribe({
     *   onOpenStart: ({ uri }) => {
     *     console.log('Opening URI ' + uri)
     *   },
     * })
     *
     * Note that deferred deep link checks will not trigger an onOpenStart call in JS
     * (RNBranch.INIT_SESSION_START).
     */
    [self postNotificationName:kRNBranchInitSessionStart withPayload:@{
        RNBranchLinkOpenedNotificationUriKey: uri.absoluteString ?: NSNull.null
    }];
}

+ (void)initSessionDidSucceedWithPayload:(NSDictionary *)payload
{
    [self postNotificationName:kRNBranchInitSessionSuccess withPayload:payload];
}

+ (void)initSessionDidEncounterErrorWithPayload:(NSDictionary *)payload
{
    [self postNotificationName:kRNBranchInitSessionError withPayload:payload];
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
