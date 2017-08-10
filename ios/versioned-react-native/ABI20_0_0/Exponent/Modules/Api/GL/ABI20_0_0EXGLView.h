#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>

#import "ABI20_0_0EXGLViewManager.h"

@interface ABI20_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI20_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onSurfaceCreate;

@end
