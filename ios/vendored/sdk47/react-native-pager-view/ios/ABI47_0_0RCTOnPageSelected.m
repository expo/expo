#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0RCTOnPageSelected.h"

@implementation ABI47_0_0RCTOnPageSelected
{
    NSNumber* _position;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageSelected";
}

- (instancetype) initWithABI47_0_0ReactTag:(NSNumber *)ABI47_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI47_0_0RCTAssertParam(ABI47_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI47_0_0ReactTag;
        _position = position;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI47_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"ABI47_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI47_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 }];
}

- (id<ABI47_0_0RCTEvent>)coalesceWithEvent:(id<ABI47_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end

