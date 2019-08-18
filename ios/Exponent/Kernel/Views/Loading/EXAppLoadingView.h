
#import <UIKit/UIKit.h>

@class EXKernelAppRecord;
@class EXLoadingProgress;

@interface EXAppLoadingView : UIView

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record;
- (void)updateStatusWithProgress:(EXLoadingProgress *)progress;

@property (nonatomic, strong) NSDictionary *manifest;

@end
