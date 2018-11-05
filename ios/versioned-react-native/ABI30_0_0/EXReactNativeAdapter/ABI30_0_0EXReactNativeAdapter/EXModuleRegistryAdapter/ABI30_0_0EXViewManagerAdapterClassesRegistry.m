// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXViewManagerAdapterClassesRegistry.h>
#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXViewManagerAdapter.h>
#import <objc/runtime.h>

static const NSString *viewManagerAdapterModuleNamePrefix = @"ViewManagerAdapter_";

static IMP directEventBlockImplementation = nil;
static dispatch_once_t directEventBlockImplementationOnceToken;

@interface ABI30_0_0EXViewManagerAdapterClassesRegistry ()

@property (nonatomic, strong) NSMutableDictionary<Class, Class> *viewManagerAdaptersClasses;

@end

@implementation ABI30_0_0EXViewManagerAdapterClassesRegistry

- (instancetype)init
{
  if (self = [super init]) {
    _viewManagerAdaptersClasses = [NSMutableDictionary dictionary];
  }
  return self;
}

- (Class)viewManagerAdapterClassForViewManager:(ABI30_0_0EXViewManager *)viewManager
{
  Class viewManagerClass = [viewManager class];
  if (_viewManagerAdaptersClasses[viewManagerClass] == nil) {
    _viewManagerAdaptersClasses[(id <NSCopying>)viewManagerClass] = [self _createViewManagerAdapterClassForViewManager:viewManager];
  }
  return _viewManagerAdaptersClasses[viewManagerClass];
}

- (Class)_createViewManagerAdapterClassForViewManager:(ABI30_0_0EXViewManager *)viewManager
{
  const char *viewManagerClassName = [[viewManagerAdapterModuleNamePrefix stringByAppendingString:[viewManager viewName]] UTF8String];
  Class viewManagerAdapterClass = objc_allocateClassPair([ABI30_0_0EXViewManagerAdapter class], viewManagerClassName, 0);
  [self _ensureDirectEventBlockImplementationIsPresent];
  for (NSString *eventName in [viewManager supportedEvents]) {
    class_addMethod(object_getClass(viewManagerAdapterClass), NSSelectorFromString([@"propConfig_" stringByAppendingString:eventName]), directEventBlockImplementation, "@@:");
  }
  return viewManagerAdapterClass;
}

- (void)_ensureDirectEventBlockImplementationIsPresent
{
  dispatch_once(&directEventBlockImplementationOnceToken, ^{
    directEventBlockImplementation = imp_implementationWithBlock(^{
      return @[@"ABI30_0_0RCTDirectEventBlock"];
    });
  });
}

@end
