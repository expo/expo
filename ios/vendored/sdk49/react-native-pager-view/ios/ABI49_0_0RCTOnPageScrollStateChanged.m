#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import "ABI49_0_0RCTOnPageScrollStateChanged.h"

@implementation ABI49_0_0RCTOnPageScrollStateChanged
{
    NSString* _state;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScrollStateChanged";
}

- (instancetype) initWithABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI49_0_0RCTAssertParam(ABI49_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI49_0_0ReactTag;
        _state = state;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"ABI49_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI49_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"pageScrollState": _state,
                 }];
}

- (id<ABI49_0_0RCTEvent>)coalesceWithEvent:(id<ABI49_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end
