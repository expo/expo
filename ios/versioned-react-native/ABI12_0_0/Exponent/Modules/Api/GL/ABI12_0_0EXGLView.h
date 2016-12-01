#import "ABI12_0_0RCTBridge.h"

#import "ABI12_0_0EXGLViewManager.h"

@interface ABI12_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI12_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI12_0_0RCTDirectEventBlock onSurfaceCreate;

@end
