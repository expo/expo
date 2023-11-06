#import "RNSHeaderHeightChangeEvent.h"
#import <React/RCTAssert.h>

@implementation RNSHeaderHeightChangeEvent {
  double _headerHeight;
}

@synthesize viewTag = _viewTag;
@synthesize eventName = _eventName;

- (instancetype)initWithEventName:(NSString *)eventName reactTag:(NSNumber *)reactTag headerHeight:(double)headerHeight
{
  RCTAssertParam(reactTag);

  if ((self = [super init])) {
    _eventName = [eventName copy];
    _viewTag = reactTag;
    _headerHeight = headerHeight;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (NSDictionary *)body
{
  NSDictionary *body = @{
    @"headerHeight" : @(_headerHeight),
  };

  return body;
}

- (BOOL)canCoalesce
{
  return YES;
}

- (uint16_t)coalescingKey
{
  return _headerHeight;
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent
{
  return newEvent;
}

+ (NSString *)moduleDotMethod
{
  return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
  return @[ self.viewTag, RCTNormalizeInputEventName(self.eventName), [self body] ];
}

@end
