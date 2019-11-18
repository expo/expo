// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI36_0_0UMViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ABI36_0_0React, let's cache these classes and not create them twice.

@interface ABI36_0_0UMViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI36_0_0UMViewManager *)viewManager;

@end
