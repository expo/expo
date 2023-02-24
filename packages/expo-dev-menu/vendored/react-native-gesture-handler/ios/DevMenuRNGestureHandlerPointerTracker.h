#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "DevMenuRNTouchEventType.h"

#define MAX_POINTERS_COUNT 12

@class DevMenuRNGestureHandler;

@interface DevMenuRNGestureHandlerPointerTracker : NSObject

@property (nonatomic) DevMenuRNTouchEventType eventType;
@property (nonatomic) NSArray<NSDictionary *> *changedPointersData;
@property (nonatomic) NSArray<NSDictionary *> *allPointersData;
@property (nonatomic) int trackedPointersCount;

- (id)initWithGestureHandler:(DevMenuRNGestureHandler*)gestureHandler;

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event;
- (void)reset;
- (void)cancelPointers;

@end
