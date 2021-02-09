// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI38_0_0UMViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ABI38_0_0React, let's cache these classes and not create them twice.

@interface ABI38_0_0UMViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI38_0_0UMViewManager *)viewManager;

@end
