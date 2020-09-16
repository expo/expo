//
//  SEGState.m
//  Analytics
//
//  Created by Brandon Sneed on 6/9/20.
//  Copyright © 2020 Segment. All rights reserved.
//

#import "SEGState.h"
#import "SEGAnalytics.h"
#import "SEGAnalyticsUtils.h"
#import "SEGReachability.h"
#import "SEGUtils.h"

typedef void (^SEGStateSetBlock)(void);
typedef _Nullable id (^SEGStateGetBlock)(void);


@interface SEGState()
// State Objects
@property (nonatomic, nonnull) SEGUserInfo *userInfo;
@property (nonatomic, nonnull) SEGPayloadContext *context;
// State Accessors
- (void)setValueWithBlock:(SEGStateSetBlock)block;
- (id)valueWithBlock:(SEGStateGetBlock)block;
@end


@protocol SEGStateObject
@property (nonatomic, weak) SEGState *state;
- (instancetype)initWithState:(SEGState *)state;
@end


@interface SEGUserInfo () <SEGStateObject>
@end

@interface SEGPayloadContext () <SEGStateObject>
@property (nonatomic, strong) SEGReachability *reachability;
@property (nonatomic, strong) NSDictionary *cachedStaticContext;
@end

#pragma mark - SEGUserInfo

@implementation SEGUserInfo

@synthesize state;

@synthesize anonymousId = _anonymousId;
@synthesize userId = _userId;
@synthesize traits = _traits;

- (instancetype)initWithState:(SEGState *)state
{
    if (self = [super init]) {
        self.state = state;
    }
    return self;
}

- (NSString *)anonymousId
{
    return [state valueWithBlock: ^id{
        return self->_anonymousId;
    }];
}

- (void)setAnonymousId:(NSString *)anonymousId
{
    [state setValueWithBlock: ^{
        self->_anonymousId = [anonymousId copy];
    }];
}

- (NSString *)userId
{
    return [state valueWithBlock: ^id{
        return self->_userId;
    }];
}

- (void)setUserId:(NSString *)userId
{
    [state setValueWithBlock: ^{
        self->_userId = [userId copy];
    }];
}

- (NSDictionary *)traits
{
    return [state valueWithBlock:^id{
        return self->_traits;
    }];
}

- (void)setTraits:(NSDictionary *)traits
{
    [state setValueWithBlock: ^{
        self->_traits = [traits serializableDeepCopy];
    }];
}

@end


#pragma mark - SEGPayloadContext

@implementation SEGPayloadContext

@synthesize state;
@synthesize reachability;

@synthesize referrer = _referrer;
@synthesize cachedStaticContext = _cachedStaticContext;
@synthesize deviceToken = _deviceToken;

- (instancetype)initWithState:(SEGState *)state
{
    if (self = [super init]) {
        self.state = state;
        self.reachability = [SEGReachability reachabilityWithHostname:@"google.com"];
        [self.reachability startNotifier];
    }
    return self;
}

- (void)updateStaticContext
{
    self.cachedStaticContext = getStaticContext(state.configuration, self.deviceToken);
}

- (NSDictionary *)payload
{
    NSMutableDictionary *result = [self.cachedStaticContext mutableCopy];
    [result addEntriesFromDictionary:getLiveContext(self.reachability, self.referrer, state.userInfo.traits)];
    return result;
}

- (NSDictionary *)referrer
{
    return [state valueWithBlock:^id{
        return self->_referrer;
    }];
}

- (void)setReferrer:(NSDictionary *)referrer
{
    [state setValueWithBlock: ^{
        self->_referrer = [referrer serializableDeepCopy];
    }];
}

- (NSString *)deviceToken
{
    return [state valueWithBlock:^id{
        return self->_deviceToken;
    }];
}

- (void)setDeviceToken:(NSString *)deviceToken
{
    [state setValueWithBlock: ^{
        self->_deviceToken = [deviceToken copy];
    }];
    [self updateStaticContext];
}

@end


#pragma mark - SEGState

@implementation SEGState {
    dispatch_queue_t _stateQueue;
}

// TODO: Make this not a singleton.. :(
+ (instancetype)sharedInstance
{
    static SEGState *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

- (instancetype)init
{
    if (self = [super init]) {
        _stateQueue = dispatch_queue_create("com.segment.state.queue", DISPATCH_QUEUE_CONCURRENT);
        self.userInfo = [[SEGUserInfo alloc] initWithState:self];
        self.context = [[SEGPayloadContext alloc] initWithState:self];
    }
    return self;
}

- (void)setValueWithBlock:(SEGStateSetBlock)block
{
    dispatch_barrier_async(_stateQueue, block);
}

- (id)valueWithBlock:(SEGStateGetBlock)block
{
    __block id value = nil;
    dispatch_sync(_stateQueue, ^{
        value = block();
    });
    return value;
}

@end
