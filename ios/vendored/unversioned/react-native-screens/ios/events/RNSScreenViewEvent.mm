#import "RNSScreenViewEvent.h"
#import <React/RCTAssert.h>

@implementation RNSScreenViewEvent {
  double _progress;
  int _closing;
  int _goingForward;
}

@synthesize viewTag = _viewTag;
@synthesize eventName = _eventName;

- (instancetype)initWithEventName:(NSString *)eventName
                         reactTag:(NSNumber *)reactTag
                         progress:(double)progress
                          closing:(int)closing
                     goingForward:(int)goingForward
{
  RCTAssertParam(reactTag);

  if ((self = [super init])) {
    _eventName = [eventName copy];
    _viewTag = reactTag;
    _progress = progress;
    _closing = closing;
    _goingForward = goingForward;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (NSDictionary *)body
{
  NSDictionary *body = @{
    @"progress" : @(_progress),
    @"closing" : @(_closing ? 1 : 0),
    @"goingForward" : @(_goingForward ? 1 : 0),
  };

  return body;
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
  return @[ self.viewTag, RCTNormalizeInputEventName(self.eventName), [self body] ];
}

@end
