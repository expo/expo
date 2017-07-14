#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>

#import "ABI19_0_0EXGLViewManager.h"

@interface ABI19_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI19_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI19_0_0RCTDirectEventBlock onSurfaceCreate;

@end
