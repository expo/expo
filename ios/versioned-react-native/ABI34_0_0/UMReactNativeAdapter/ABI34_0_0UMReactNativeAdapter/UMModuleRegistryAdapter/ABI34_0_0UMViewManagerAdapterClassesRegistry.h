// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI34_0_0UMViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ReactABI34_0_0, let's cache these classes and not create them twice.

@interface ABI34_0_0UMViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI34_0_0UMViewManager *)viewManager;

@end
