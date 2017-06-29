// Copyright 2015-present 650 Industries. All rights reserved.
//
// this class provides a namespace/bottleneck through which EXScopedBridgeModule subclasses
// can make themselves accessible to other modules.
//
// e.g. EX_DECLARE_SCOPED_MODULE(EXCoolClass, coolClass)
// provides the getter `_bridge.scopedModules.coolClass`
//

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

#import "EXScopedBridgeModule.h"

#define EX_DECLARE_SCOPED_MODULE(className, getter) \
@interface EXScopedModuleRegistry (className) \
@property (nonatomic, readonly) className *getter; \
@end\

#define EX_DEFINE_SCOPED_MODULE(className, getter) \
@implementation  EXScopedModuleRegistry (className) \
- (className *)getter { return [self.bridge moduleForClass:[className class]]; } \
@end\

@interface EXScopedModuleRegistry : NSObject <RCTBridgeModule>

@end

@interface RCTBridge (EXScopedModuleRegistry)

@property (nonatomic, readonly) EXScopedModuleRegistry *scopedModules;

@end
