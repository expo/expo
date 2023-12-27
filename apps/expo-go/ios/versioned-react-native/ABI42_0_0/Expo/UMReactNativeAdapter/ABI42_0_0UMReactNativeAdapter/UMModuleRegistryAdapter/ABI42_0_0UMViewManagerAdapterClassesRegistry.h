// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI42_0_0UMViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ABI42_0_0React, let's cache these classes and not create them twice.

@interface ABI42_0_0UMViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI42_0_0UMViewManager *)viewManager;

@end
