// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI31_0_0/ABI31_0_0RCTViewManager.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI31_0_0EXViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ReactABI31_0_0, let's cache these classes and not create them twice.

@interface ABI31_0_0EXViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI31_0_0EXViewManager *)viewManager;

@end
