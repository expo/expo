#import <Foundation/Foundation.h>

#import "RNGHTouchEventType.h"

#define MAX_POINTERS_COUNT 12

@class RNGestureHandler;

@interface RNGestureHandlerPointerTracker : NSObject

@property (nonatomic) RNGHTouchEventType eventType;
@property (nonatomic) NSArray<NSDictionary *> *changedPointersData;
@property (nonatomic) NSArray<NSDictionary *> *allPointersData;
@property (nonatomic) int trackedPointersCount;

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler;

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)reset;
- (void)cancelPointers;

@end
