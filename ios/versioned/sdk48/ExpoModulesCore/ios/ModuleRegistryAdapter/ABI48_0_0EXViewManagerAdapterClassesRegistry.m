// Copyright 2018-present 650 Industries. All rights reserved.

#import <objc/runtime.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXViewManagerAdapterClassesRegistry.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXViewManagerAdapter.h>

static const NSString *viewManagerAdapterModuleNamePrefix = @"ViewManagerAdapter_";

static IMP directEventBlockImplementation = nil;
static dispatch_once_t directEventBlockImplementationOnceToken;

@interface ABI48_0_0EXViewManagerAdapterClassesRegistry ()

@property (nonatomic, strong) NSMutableDictionary<Class, Class> *viewManagerAdaptersClasses;

@end

@implementation ABI48_0_0EXViewManagerAdapterClassesRegistry

- (instancetype)init
{
  if (self = [super init]) {
    _viewManagerAdaptersClasses = [NSMutableDictionary dictionary];
  }
  return self;
}

- (Class)viewManagerAdapterClassForViewManager:(ABI48_0_0EXViewManager *)viewManager
{
  Class viewManagerClass = [viewManager class];
  if (_viewManagerAdaptersClasses[viewManagerClass] == nil) {
    _viewManagerAdaptersClasses[(id <NSCopying>)viewManagerClass] = [self.class createViewManagerAdapterClassForViewManager:viewManager];
  }
  return _viewManagerAdaptersClasses[viewManagerClass];
}

+ (Class)createViewManagerAdapterClassForViewManager:(ABI48_0_0EXViewManager *)viewManager
{
  const char *viewManagerClassName = [[viewManagerAdapterModuleNamePrefix stringByAppendingString:[viewManager viewName]] UTF8String];
  Class viewManagerAdapterClass = objc_allocateClassPair([ABI48_0_0EXViewManagerAdapter class], viewManagerClassName, 0);
  Class metaClass = object_getClass(viewManagerAdapterClass);

  [self _ensureDirectEventBlockImplementationIsPresent];

  for (NSString *eventName in [viewManager supportedEvents]) {
    class_addMethod(metaClass, NSSelectorFromString([@"propConfig_" stringByAppendingString:eventName]), directEventBlockImplementation, "@@:");
  }

  IMP viewManagerImp = imp_implementationWithBlock(^{
    return viewManager;
  });
  class_addMethod(viewManagerAdapterClass, NSSelectorFromString(@"viewManager"), viewManagerImp, "@@:");

  return viewManagerAdapterClass;
}

+ (void)_ensureDirectEventBlockImplementationIsPresent
{
  dispatch_once(&directEventBlockImplementationOnceToken, ^{
    directEventBlockImplementation = imp_implementationWithBlock(^{
      return @[@"ABI48_0_0RCTDirectEventBlock"];
    });
  });
}

@end
