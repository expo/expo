#import <GLKit/GLKit.h>
#import "RCTBridge.h"

#import "EXGLViewManager.h"

@interface EXGLView : GLKView

- (instancetype)initWithManager:(EXGLViewManager *)mgr;

@property (nonatomic, copy) RCTDirectEventBlock onSurfaceCreate;

@end
