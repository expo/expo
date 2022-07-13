#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0RCTOnPageScrollStateChanged.h"

@implementation ABI45_0_0RCTOnPageScrollStateChanged
{
    NSString* _state;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScrollStateChanged";
}

- (instancetype) initWithABI45_0_0ReactTag:(NSNumber *)ABI45_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI45_0_0RCTAssertParam(ABI45_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI45_0_0ReactTag;
        _state = state;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI45_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
- (uint16_t)coalescingKey
{
    return _coalescingKey;
}


- (BOOL)canCoalesce
{
    return NO;
}

+ (NSString *)moduleDotMethod
{
    return @"ABI45_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI45_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"pageScrollState": _state,
                 }];
}

- (id<ABI45_0_0RCTEvent>)coalesceWithEvent:(id<ABI45_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end
