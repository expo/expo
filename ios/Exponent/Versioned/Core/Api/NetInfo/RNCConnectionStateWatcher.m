/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCConnectionStateWatcher.h"
#import <SystemConfiguration/SystemConfiguration.h>
#import <netinet/in.h>

@interface RNCConnectionStateWatcher () <NSURLSessionDataDelegate>

@property (nonatomic) SCNetworkReachabilityRef reachabilityRef;
@property (nullable, weak, nonatomic) id<RNCConnectionStateWatcherDelegate> delegate;
@property (nonatomic) SCNetworkReachabilityFlags lastFlags;
@property (nonnull, strong, nonatomic) RNCConnectionState *state;

@end

@implementation RNCConnectionStateWatcher

#pragma mark - Lifecycle

- (instancetype)initWithDelegate:(id<RNCConnectionStateWatcherDelegate>)delegate
{
    self = [self init];
    if (self) {
        _delegate = delegate;
        _state = [[RNCConnectionState alloc] init];
        _reachabilityRef = [self createReachabilityRef];
    }
    return self;
}

- (void)dealloc
{
    self.delegate = nil;

    if (self.reachabilityRef != nil) {
        SCNetworkReachabilityUnscheduleFromRunLoop(self.reachabilityRef, CFRunLoopGetMain(), kCFRunLoopCommonModes);
        CFRelease(self.reachabilityRef);
        self.reachabilityRef = nil;
    }
}

#pragma mark - Public methods

- (RNCConnectionState *)currentState
{
    return self.state;
}

#pragma mark - Callback

typedef void (^RNCConnectionStateUpdater)(SCNetworkReachabilityFlags);

static void RNCReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
    RNCConnectionStateUpdater block = (__bridge id)info;
    if (block != nil) {
        block(flags);
    }
}

static void RNCReachabilityContextRelease(const void *info)
{
    Block_release(info);
}

static const void *RNCReachabilityContextRetain(const void *info)
{
    return Block_copy(info);
}

- (void)update:(SCNetworkReachabilityFlags)flags
{
    self.lastFlags = flags;
    self.state = [[RNCConnectionState alloc] initWithReachabilityFlags:flags];
}

#pragma mark - Setters

- (void)setState:(RNCConnectionState *)state
{
    if (![state isEqualToConnectionState:_state]) {
        _state = state;

        [self updateDelegate];
    }
}

#pragma mark - Utilities

- (void)updateDelegate
{
    [self.delegate connectionStateWatcher:self didUpdateState:self.state];
}

- (SCNetworkReachabilityRef)createReachabilityRef
{
    struct sockaddr_in zeroAddress;
    bzero(&zeroAddress, sizeof(zeroAddress));
    zeroAddress.sin_len = sizeof(zeroAddress);
    zeroAddress.sin_family = AF_INET;

    SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, (const struct sockaddr *) &zeroAddress);

    __weak typeof(self) weakSelf = self;
    RNCConnectionStateUpdater callback = ^(SCNetworkReachabilityFlags flags) {
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (strongSelf != nil) {
            [strongSelf update:flags];
        }
    };

    SCNetworkReachabilityContext context = {
        0,
        (__bridge void *)callback,
        RNCReachabilityContextRetain,
        RNCReachabilityContextRelease,
        NULL
    };
    SCNetworkReachabilitySetCallback(reachability, RNCReachabilityCallback, &context);
    SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);

    // Set the state the first time
    SCNetworkReachabilityFlags flags;
    SCNetworkReachabilityGetFlags(reachability, &flags);
    [self update:flags];

    return reachability;
}

@end
