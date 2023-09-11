/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNCConnectionStateWatcher.h"
#import <SystemConfiguration/SystemConfiguration.h>
#import <netinet/in.h>

@interface ABI48_0_0RNCConnectionStateWatcher () <NSURLSessionDataDelegate>

@property (nonatomic) SCNetworkReachabilityRef reachabilityRef;
@property (nullable, weak, nonatomic) id<ABI48_0_0RNCConnectionStateWatcherDelegate> delegate;
@property (nonatomic) SCNetworkReachabilityFlags lastFlags;
@property (nonnull, strong, nonatomic) ABI48_0_0RNCConnectionState *state;

@end

@implementation ABI48_0_0RNCConnectionStateWatcher

#pragma mark - Lifecycle

- (instancetype)initWithDelegate:(id<ABI48_0_0RNCConnectionStateWatcherDelegate>)delegate
{
    self = [self init];
    if (self) {
        _delegate = delegate;
        _state = [[ABI48_0_0RNCConnectionState alloc] init];
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

- (ABI48_0_0RNCConnectionState *)currentState
{
    return self.state;
}

#pragma mark - Callback

typedef void (^ABI48_0_0RNCConnectionStateUpdater)(SCNetworkReachabilityFlags);

static void ABI48_0_0RNCReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
    ABI48_0_0RNCConnectionStateUpdater block = (__bridge id)info;
    if (block != nil) {
        block(flags);
    }
}

static void ABI48_0_0RNCReachabilityContextRelease(const void *info)
{
    Block_release(info);
}

static const void *ABI48_0_0RNCReachabilityContextRetain(const void *info)
{
    return Block_copy(info);
}

- (void)update:(SCNetworkReachabilityFlags)flags
{
    self.lastFlags = flags;
    self.state = [[ABI48_0_0RNCConnectionState alloc] initWithReachabilityFlags:flags];
}

#pragma mark - Setters

- (void)setState:(ABI48_0_0RNCConnectionState *)state
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
    ABI48_0_0RNCConnectionStateUpdater callback = ^(SCNetworkReachabilityFlags flags) {
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (strongSelf != nil) {
            [strongSelf update:flags];
        }
    };

    SCNetworkReachabilityContext context = {
        0,
        (__bridge void *)callback,
        ABI48_0_0RNCReachabilityContextRetain,
        ABI48_0_0RNCReachabilityContextRelease,
        NULL
    };
    SCNetworkReachabilitySetCallback(reachability, ABI48_0_0RNCReachabilityCallback, &context);
    SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);

    // Set the state the first time
    SCNetworkReachabilityFlags flags;
    SCNetworkReachabilityGetFlags(reachability, &flags);
    [self update:flags];

    return reachability;
}

@end
