#import <React/UIView+React.h>
#import "RCTOnPageSelected.h"

@implementation RCTOnPageSelected
{
    NSNumber* _position;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageSelected";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;
{
    RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _position = position;
        _coalescingKey = coalescingKey;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 }];
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

@end

