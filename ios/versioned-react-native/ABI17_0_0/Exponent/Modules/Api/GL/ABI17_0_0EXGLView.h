#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>

#import "ABI17_0_0EXGLViewManager.h"

@interface ABI17_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI17_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI17_0_0RCTDirectEventBlock onSurfaceCreate;

@end
