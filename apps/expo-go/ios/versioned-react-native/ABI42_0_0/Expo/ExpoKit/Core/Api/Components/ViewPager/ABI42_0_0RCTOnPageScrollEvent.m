#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0RCTOnPageScrollEvent.h"

@implementation ABI42_0_0RCTOnPageScrollEvent
{
    NSNumber* _position;
    NSNumber* _offset;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScroll";
}

- (instancetype) initWithABI42_0_0ReactTag:(NSNumber *)ABI42_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;
{
    ABI42_0_0RCTAssertParam(ABI42_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI42_0_0ReactTag;
        _position = position;
        _offset = offset;
    }
    return self;
}

ABI42_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
- (uint16_t)coalescingKey
{
    return 0;
}


- (BOOL)canCoalesce
{
    return YES;
}

+ (NSString *)moduleDotMethod
{
    return @"ABI42_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI42_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 @"offset": _offset
                 }];
}

- (id<ABI42_0_0RCTEvent>)coalesceWithEvent:(id<ABI42_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end
