// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMViewManagerAdapterClassesRegistry.h>
#import <EDUMViewManagerAdapter.h>
#import <objc/runtime.h>

static const NSString *viewManagerAdapterModuleNamePrefix = @"ViewManagerAdapter_";

static IMP directEventBlockImplementation = nil;
static dispatch_once_t directEventBlockImplementationOnceToken;

@interface EDUMViewManagerAdapterClassesRegistry ()

@property (nonatomic, strong) NSMutableDictionary<Class, Class> *viewManagerAdaptersClasses;

@end

@implementation EDUMViewManagerAdapterClassesRegistry

- (instancetype)init
{
  if (self = [super init]) {
    _viewManagerAdaptersClasses = [NSMutableDictionary dictionary];
  }
  return self;
}

- (Class)viewManagerAdapterClassForViewManager:(EDUMViewManager *)viewManager
{
  Class viewManagerClass = [viewManager class];
  if (_viewManagerAdaptersClasses[viewManagerClass] == nil) {
    _viewManagerAdaptersClasses[(id <NSCopying>)viewManagerClass] = [self _createViewManagerAdapterClassForViewManager:viewManager];
  }
  return _viewManagerAdaptersClasses[viewManagerClass];
}

- (Class)_createViewManagerAdapterClassForViewManager:(EDUMViewManager *)viewManager
{
  const char *viewManagerClassName = [[viewManagerAdapterModuleNamePrefix stringByAppendingString:[viewManager viewName]] UTF8String];
  Class viewManagerAdapterClass = objc_allocateClassPair([EDUMViewManagerAdapter class], viewManagerClassName, 0);
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
      return @[@"RCTDirectEventBlock"];
    });
  });
}

@end
