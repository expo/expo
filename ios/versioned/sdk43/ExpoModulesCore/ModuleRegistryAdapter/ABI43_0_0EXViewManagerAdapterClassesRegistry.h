// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI43_0_0EXViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ABI43_0_0React, let's cache these classes and not create them twice.

@interface ABI43_0_0EXViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI43_0_0EXViewManager *)viewManager;
+ (Class)createViewManagerAdapterClassForViewManager:(ABI43_0_0EXViewManager *)viewManager;

@end
