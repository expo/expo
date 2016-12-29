#import <React/RCTBridge.h>

#import "EXGLViewManager.h"

@interface EXGLView : UIView

- (instancetype)initWithManager:(EXGLViewManager *)mgr;

@property (nonatomic, copy) RCTDirectEventBlock onSurfaceCreate;

@end
