#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0RCTOnPageSelected.h"

@implementation ABI42_0_0RCTOnPageSelected
{
    NSNumber* _position;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageSelected";
}

- (instancetype) initWithABI42_0_0ReactTag:(NSNumber *)ABI42_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI42_0_0RCTAssertParam(ABI42_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI42_0_0ReactTag;
        _position = position;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI42_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"ABI42_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI42_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 }];
}

- (id<ABI42_0_0RCTEvent>)coalesceWithEvent:(id<ABI42_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end

