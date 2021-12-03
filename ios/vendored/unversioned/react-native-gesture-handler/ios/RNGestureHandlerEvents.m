#import "RNGestureHandlerEvents.h"

#define SAFE_VELOCITY(velocity) @(isnan(velocity) ? 0 : velocity)

@implementation RNGestureHandlerEventExtraData

- (instancetype)initWithData:(NSDictionary *)data;
{
    if ((self = [super init])) {
        _data = data;
    }
    return self;
}

+ (RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches
{
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{
                           @"x": @(position.x),
                           @"y": @(position.y),
                           @"absoluteX": @(absolutePosition.x),
                           @"absoluteY": @(absolutePosition.y),
                           @"numberOfPointers": @(numberOfTouches)}];
}

+ (RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches
                                   withDuration:(NSUInteger)duration
{
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{
                           @"x": @(position.x),
                           @"y": @(position.y),
                           @"absoluteX": @(absolutePosition.x),
                           @"absoluteY": @(absolutePosition.y),
                           @"numberOfPointers": @(numberOfTouches),
                           @"duration":@(duration)
            }];
}

+ (RNGestureHandlerEventExtraData *)forPan:(CGPoint)position
                      withAbsolutePosition:(CGPoint)absolutePosition
                           withTranslation:(CGPoint)translation
                              withVelocity:(CGPoint)velocity
                       withNumberOfTouches:(NSUInteger)numberOfTouches
{
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{
                           @"x": @(position.x),
                           @"y": @(position.y),
                           @"absoluteX": @(absolutePosition.x),
                           @"absoluteY": @(absolutePosition.y),
                           @"translationX": @(translation.x),
                           @"translationY": @(translation.y),
                           @"velocityX": SAFE_VELOCITY(velocity.x),
                           @"velocityY": SAFE_VELOCITY(velocity.y),
                           @"numberOfPointers": @(numberOfTouches)}];
}

+ (RNGestureHandlerEventExtraData *)forForce:(CGFloat)force
                                 forPosition:(CGPoint)position
                        withAbsolutePosition:(CGPoint)absolutePosition
                         withNumberOfTouches:(NSUInteger)numberOfTouches
{
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{
                           @"x": @(position.x),
                           @"y": @(position.y),
                           @"absoluteX": @(absolutePosition.x),
                           @"absoluteY": @(absolutePosition.y),
                           @"force": @(force),
                           @"numberOfPointers": @(numberOfTouches)}];
  
}

+ (RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale
                              withFocalPoint:(CGPoint)focalPoint
                                withVelocity:(CGFloat)velocity
                         withNumberOfTouches:(NSUInteger)numberOfTouches
{
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{
                           @"scale": @(scale),
                           @"focalX": @(focalPoint.x),
                           @"focalY": @(focalPoint.y),
                           @"velocity": SAFE_VELOCITY(velocity),
                           @"numberOfPointers": @(numberOfTouches)}];
}

+ (RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation
                                withAnchorPoint:(CGPoint)anchorPoint
                                   withVelocity:(CGFloat)velocity
                            withNumberOfTouches:(NSUInteger)numberOfTouches
{
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{@"rotation": @(rotation),
                           @"anchorX": @(anchorPoint.x),
                           @"anchorY": @(anchorPoint.y),
                           @"velocity": SAFE_VELOCITY(velocity),
                           @"numberOfPointers": @(numberOfTouches)}];
}

+ (RNGestureHandlerEventExtraData *)forEventType:(RNTouchEventType)eventType
                             withChangedPointers:(NSArray<NSDictionary *> *)changedPointers
                                 withAllPointers:(NSArray<NSDictionary *> *)allPointers
                             withNumberOfTouches:(NSUInteger)numberOfTouches
{
    if (changedPointers == nil || allPointers == nil) {
        changedPointers = @[];
        allPointers = @[];
        eventType = RNTouchEventTypeUndetermined;
    }
  
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{@"eventType": @(eventType),
                         @"changedTouches": changedPointers,
                         @"allTouches": allPointers,
                         @"numberOfTouches": @(numberOfTouches)}];
}

+ (RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside
{
    return [[RNGestureHandlerEventExtraData alloc]
            initWithData:@{@"pointerInside": @(pointerInside)}];
}

@end


@implementation RNGestureHandlerEvent
{
    NSNumber *_handlerTag;
    RNGestureHandlerState _state;
    RNGestureHandlerEventExtraData *_extraData;
}

@synthesize viewTag = _viewTag;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithReactTag:(NSNumber *)reactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(RNGestureHandlerState)state
                       extraData:(RNGestureHandlerEventExtraData *)extraData
                   coalescingKey:(uint16_t)coalescingKey
{
    if ((self = [super init])) {
        _viewTag = reactTag;
        _handlerTag = handlerTag;
        _state = state;
        _extraData = extraData;
        _coalescingKey = coalescingKey;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (NSString *)eventName
{
    return @"onGestureHandlerEvent";
}

- (BOOL)canCoalesce
{
    return YES;
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

+ (NSString *)moduleDotMethod
{
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    NSMutableDictionary *body = [NSMutableDictionary dictionaryWithDictionary:_extraData.data];
    [body setObject:_viewTag forKey:@"target"];
    [body setObject:_handlerTag forKey:@"handlerTag"];
    [body setObject:@(_state) forKey:@"state"];
    return @[self.viewTag, @"onGestureHandlerEvent", body];
}

@end


@implementation RNGestureHandlerStateChange
{
    NSNumber *_handlerTag;
    RNGestureHandlerState _state;
    RNGestureHandlerState _prevState;
    RNGestureHandlerEventExtraData *_extraData;
}

@synthesize viewTag = _viewTag;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithReactTag:(NSNumber *)reactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(RNGestureHandlerState)state
                       prevState:(RNGestureHandlerState)prevState
                       extraData:(RNGestureHandlerEventExtraData *)extraData
{
    static uint16_t coalescingKey = 0;
    if ((self = [super init])) {
        _viewTag = reactTag;
        _handlerTag = handlerTag;
        _state = state;
        _prevState = prevState;
        _extraData = extraData;
        _coalescingKey = coalescingKey++;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (NSString *)eventName
{
    return @"onGestureHandlerStateChange";
}

- (BOOL)canCoalesce
{
    // TODO: event coalescing
    return NO;
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

+ (NSString *)moduleDotMethod
{
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    NSMutableDictionary *body = [NSMutableDictionary dictionaryWithDictionary:_extraData.data];
    [body setObject:_viewTag forKey:@"target"];
    [body setObject:_handlerTag forKey:@"handlerTag"];
    [body setObject:@(_state) forKey:@"state"];
    [body setObject:@(_prevState) forKey:@"oldState"];
    return @[self.viewTag, @"onGestureHandlerStateChange", body];
}

@end
