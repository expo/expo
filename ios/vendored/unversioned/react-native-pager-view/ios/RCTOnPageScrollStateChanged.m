#import <React/UIView+React.h>
#import "RCTOnPageScrollStateChanged.h"

@implementation RCTOnPageScrollStateChanged
{
    NSString* _state;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScrollStateChanged";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;
{
    RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _state = state;
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
                 @"pageScrollState": _state,
                 }];
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

@end
