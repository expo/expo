// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI33_0_0UMViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ReactABI33_0_0, let's cache these classes and not create them twice.

@interface ABI33_0_0UMViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI33_0_0UMViewManager *)viewManager;

@end
