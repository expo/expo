#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>

#import "ABI15_0_0EXGLViewManager.h"

@interface ABI15_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI15_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI15_0_0RCTDirectEventBlock onSurfaceCreate;

@end
