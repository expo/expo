#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>

#import "ABI14_0_0EXGLViewManager.h"

@interface ABI14_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI14_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onSurfaceCreate;

@end
