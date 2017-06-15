#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>

#import "ABI18_0_0EXGLViewManager.h"

@interface ABI18_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI18_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI18_0_0RCTDirectEventBlock onSurfaceCreate;

@end
