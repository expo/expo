#import <React/UIView+React.h>
#import "RCTOnPageScrollEvent.h"

@implementation RCTOnPageScrollEvent
{
    NSNumber* _position;
    NSNumber* _offset;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScroll";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;
{
    RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _position = position;
        _offset = offset;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 @"offset": _offset
                 }];
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

@end
