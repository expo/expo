// Copyright 2018-present 650 Industries. All rights reserved.

#import <objc/runtime.h>

#import <ExpoModulesCore/EXViewManagerAdapterClassesRegistry.h>
#import <ExpoModulesCore/EXViewManagerAdapter.h>

static const NSString *viewManagerAdapterModuleNamePrefix = @"ViewManagerAdapter_";

static IMP directEventBlockImplementation = nil;
static dispatch_once_t directEventBlockImplementationOnceToken;

@interface EXViewManagerAdapterClassesRegistry ()

@property (nonatomic, strong) NSMutableDictionary<Class, Class> *viewManagerAdaptersClasses;

@end

@implementation EXViewManagerAdapterClassesRegistry

- (instancetype)init
{
  if (self = [super init]) {
    _viewManagerAdaptersClasses = [NSMutableDictionary dictionary];
  }
  return self;
}

- (Class)viewManagerAdapterClassForViewManager:(EXViewManager *)viewManager
{
  Class viewManagerClass = [viewManager class];
  if (_viewManagerAdaptersClasses[viewManagerClass] == nil) {
    _viewManagerAdaptersClasses[(id <NSCopying>)viewManagerClass] = [self.class createViewManagerAdapterClassForViewManager:viewManager];
  }
  return _viewManagerAdaptersClasses[viewManagerClass];
}

+ (Class)createViewManagerAdapterClassForViewManager:(EXViewManager *)viewManager
{
  const char *viewManagerClassName = [[viewManagerAdapterModuleNamePrefix stringByAppendingString:[viewManager viewName]] UTF8String];
  Class viewManagerAdapterClass = objc_allocateClassPair([EXViewManagerAdapter class], viewManagerClassName, 0);
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
      return @[@"RCTDirectEventBlock"];
    });
  });
}

@end
