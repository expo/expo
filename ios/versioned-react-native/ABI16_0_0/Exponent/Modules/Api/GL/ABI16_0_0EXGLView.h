#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>

#import "ABI16_0_0EXGLViewManager.h"

@interface ABI16_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI16_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI16_0_0RCTDirectEventBlock onSurfaceCreate;

@end
