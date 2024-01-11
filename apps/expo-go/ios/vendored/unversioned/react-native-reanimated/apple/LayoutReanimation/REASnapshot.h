#import <Foundation/Foundation.h>
#import <RNReanimated/REAUIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface REASnapshot : NSObject

@property NSMutableDictionary *values;

- (instancetype)init:(REAUIView *)view;
- (instancetype)initWithAbsolutePosition:(REAUIView *)view;

@end

NS_ASSUME_NONNULL_END
