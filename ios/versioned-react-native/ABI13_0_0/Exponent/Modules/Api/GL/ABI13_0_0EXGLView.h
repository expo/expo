#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>

#import "ABI13_0_0EXGLViewManager.h"

@interface ABI13_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI13_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI13_0_0RCTDirectEventBlock onSurfaceCreate;

@end
