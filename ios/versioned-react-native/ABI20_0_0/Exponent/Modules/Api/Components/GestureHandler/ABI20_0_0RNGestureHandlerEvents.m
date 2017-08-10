 #import "ABI20_0_0RNGestureHandlerEvents.h"

@implementation ABI20_0_0RNGestureHandlerEventExtraData

- (instancetype)initWithData:(NSDictionary *)data;
{
    if ((self = [super init])) {
        _data = data;
    }
    return self;
}

+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
{
    return [[ABI20_0_0RNGestureHandlerEventExtraData alloc]
            initWithData:@{ @"x": @(position.x), @"y": @(position.y) }];
}

+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPan:(CGPoint)position withTranslation:(CGPoint)translation withVelocity:(CGPoint)velocity
{
    return [[ABI20_0_0RNGestureHandlerEventExtraData alloc]
            initWithData:@{
                           @"x": @(position.x),
                           @"y": @(position.y),
                           @"translationX": @(translation.x),
                           @"translationY": @(translation.y),
                           @"velocityX": @(velocity.x),
                           @"velocityY": @(velocity.y)}];
}

+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale withVelocity:(CGFloat)velocity
{
    return [[ABI20_0_0RNGestureHandlerEventExtraData alloc]
            initWithData:@{@"scale": @(scale), @"velocity": @(velocity)}];
}

+ (ABI20_0_0RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation withVelocity:(CGFloat)velocity
{
    return [[ABI20_0_0RNGestureHandlerEventExtraData alloc]
            initWithData:@{@"rotation": @(rotation), @"velocity": @(velocity)}];
}

+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;
{
    return [[ABI20_0_0RNGestureHandlerEventExtraData alloc] initWithData:@{@"pointerInside": @(pointerInside)}];
}

@end


@implementation ABI20_0_0RNGestureHandlerEvent
{
    NSNumber *_handlerTag;
    ABI20_0_0RNGestureHandlerState _state;
    ABI20_0_0RNGestureHandlerEventExtraData *_extraData;
}

@synthesize viewTag = _viewTag;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithRactTag:(NSNumber *)ReactABI20_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI20_0_0RNGestureHandlerState)state
                      extraData:(ABI20_0_0RNGestureHandlerEventExtraData *)extraData
{
    static uint16_t coalescingKey = 0;
    if ((self = [super init])) {
        _viewTag = ReactABI20_0_0Tag;
        _handlerTag = handlerTag;
        _state = state;
        _extraData = extraData;
        _coalescingKey = coalescingKey++;
    }
    return self;
}

ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (NSString *)eventName
{
    return @"onGestureHandlerEvent";
}

- (BOOL)canCoalesce
{
    // TODO: event coalescing
    return NO;
}

- (id<ABI20_0_0RCTEvent>)coalesceWithEvent:(id<ABI20_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

+ (NSString *)moduleDotMethod
{
    return @"ABI20_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    NSMutableDictionary *body = [NSMutableDictionary dictionaryWithDictionary:_extraData.data];
    [body setObject:_viewTag forKey:@"target"];
    [body setObject:_handlerTag forKey:@"handlerTag"];
    [body setObject:@(_state) forKey:@"state"];
    return @[self.viewTag, @"topGestureHandlerEvent", body];
}

@end


@implementation ABI20_0_0RNGestureHandlerStateChange
{
    NSNumber *_handlerTag;
    ABI20_0_0RNGestureHandlerState _state;
    ABI20_0_0RNGestureHandlerState _prevState;
    ABI20_0_0RNGestureHandlerEventExtraData *_extraData;
}

@synthesize viewTag = _viewTag;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithRactTag:(NSNumber *)ReactABI20_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI20_0_0RNGestureHandlerState)state
                      prevState:(ABI20_0_0RNGestureHandlerState)prevState
                      extraData:(ABI20_0_0RNGestureHandlerEventExtraData *)extraData
{
    static uint16_t coalescingKey = 0;
    if ((self = [super init])) {
        _viewTag = ReactABI20_0_0Tag;
        _handlerTag = handlerTag;
        _state = state;
        _prevState = prevState;
        _extraData = extraData;
        _coalescingKey = coalescingKey++;
    }
    return self;
}

ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (NSString *)eventName
{
    return @"onGestureHandlerStateChange";
}

- (BOOL)canCoalesce
{
    // TODO: event coalescing
    return NO;
}

- (id<ABI20_0_0RCTEvent>)coalesceWithEvent:(id<ABI20_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

+ (NSString *)moduleDotMethod
{
    return @"ABI20_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    NSMutableDictionary *body = [NSMutableDictionary dictionaryWithDictionary:_extraData.data];
    [body setObject:_viewTag forKey:@"target"];
    [body setObject:_handlerTag forKey:@"handlerTag"];
    [body setObject:@(_state) forKey:@"state"];
    [body setObject:@(_prevState) forKey:@"oldState"];
    return @[self.viewTag, @"topGestureHandlerStateChange", body];
}

@end
