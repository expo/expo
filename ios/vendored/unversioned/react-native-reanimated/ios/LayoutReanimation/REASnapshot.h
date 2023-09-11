#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface REASnapshot : NSObject

@property NSMutableDictionary *values;

- (instancetype)init:(UIView *)view;
- (instancetype)initWithAbsolutePosition:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
