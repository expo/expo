#import <GLKit/GLKit.h>
#import "ABI11_0_0RCTBridge.h"

#import "ABI11_0_0EXGLViewManager.h"

@interface ABI11_0_0EXGLView : GLKView

- (instancetype)initWithManager:(ABI11_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI11_0_0RCTDirectEventBlock onSurfaceCreate;

@end
