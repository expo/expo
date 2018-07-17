// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of ABI29_0_0EXViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to ReactABI29_0_0, let's cache these classes and not create them twice.

@interface ABI29_0_0EXViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(ABI29_0_0EXViewManager *)viewManager;

@end
