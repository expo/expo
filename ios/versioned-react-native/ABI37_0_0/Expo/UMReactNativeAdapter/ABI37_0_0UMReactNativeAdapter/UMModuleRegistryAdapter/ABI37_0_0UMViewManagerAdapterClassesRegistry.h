// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI37_0_0UMViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ABI37_0_0React, let's cache these classes and not create them twice.

@interface ABI37_0_0UMViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI37_0_0UMViewManager *)viewManager;

@end
