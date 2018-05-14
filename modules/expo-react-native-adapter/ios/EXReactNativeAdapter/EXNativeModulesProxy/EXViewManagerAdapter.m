// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXViewManagerAdapter.h>
#import <objc/runtime.h>

#define QUOTE(str) #str
#define EXPAND_AND_QUOTE(str) QUOTE(str)

#define EX_IS_METHOD_PROPSETTER(methodName) \
  [methodName hasPrefix:@EXPAND_AND_QUOTE(EX_PROPSETTERS_PREFIX)]

#define EX_PROPSETTER_FOR_PROP(propName)\
  QUOTE(EX_PROPSETTERS_PREFIX)propName

// EXViewManagerAdapter is an RN wrapper around EXCore's EXViewManager.
// For each exported view manager is it subclassed so that React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use EXViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface EXViewManagerAdapter ()

@property id<EXViewManager> viewManager;
@property NSDictionary<NSString *, NSString *> *customPropsNamesSelectors;

@end

@implementation EXViewManagerAdapter

- (instancetype)initWithViewManager:(id<EXViewManager>)viewManager
{
  if (self = [super init]) {
    _viewManager = viewManager;
    _customPropsNamesSelectors = [self getPropsNamesOfViewManager:viewManager];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return [_viewManager supportedEvents];
}

// This class is not used directly --- usually it's subclassed
// in runtime by EXNativeModulesProxy for each exported view manager.
// Each created class has different class name, conforming to convention.
// This way we can provide React Native with different RCTViewManagers
// returning different modules names.

+ (NSString *)moduleName
{
  return NSStringFromClass(self);
}

- (UIView *)view
{
  return [_viewManager view];
}

// The adapter multiplexes custom view properties in one "big object prop" that is passed here.
// This method enumerates keys and objects and invokes proper view manager setter for every known prop.

RCT_CUSTOM_VIEW_PROPERTY(proxiedProperties, NSDictionary, UIView)
{
  __weak EXViewManagerAdapter *weakSelf = self;
  [json enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
    __strong EXViewManagerAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      NSString *viewManagerName = [strongSelf.viewManager viewName];

      if (strongSelf.customPropsNamesSelectors[key]) {
        NSString *selectorString = strongSelf.customPropsNamesSelectors[key];
        SEL selector = NSSelectorFromString(selectorString);
        id viewManager = strongSelf.viewManager;
        NSMethodSignature *methodSignature = [viewManager methodSignatureForSelector:selector];
        if (methodSignature == nil) {
          // This in fact should never happen -- if we have a selector for this prop
          // (which we have if we're here), view manager should return method signature
          // for the cached selector.
          EXLogError(@"View manager '%@' does not implement method for selector '%@'.", viewManagerName, NSStringFromSelector(selector));
          return;
        }
        NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
        [invocation setTarget:strongSelf.viewManager];
        [invocation setSelector:selector];
        [invocation setArgument:&obj atIndex:2];
        [invocation setArgument:(void *)&view atIndex:3];
        [invocation retainArguments];
        [invocation invoke];
      } else {
        EXLogWarn(@"Tried to set property `%@` on view manager `%@` while the view manager does not export such prop.", key, viewManagerName);
      }
    }
  }];
}

// Scans the class methods for methods with a certain prefix (see macro EX_PROPSETTERS_PREFIX),
// and returns dictionary which has props names as keys and selector strings as values.
// Example: @{ @"type": @"__ex_set__type" }

- (NSDictionary<NSString *, NSString *> *)getPropsNamesOfViewManager:(id)viewManager
{
  NSMutableDictionary<NSString *, NSString *> *propsNames = [NSMutableDictionary dictionary];
  
  unsigned int methodsCount;
  Method *methodsDescriptions = class_copyMethodList([viewManager class], &methodsCount);
  
  @try {
    for(int i = 0; i < methodsCount; i++) {
      Method method = methodsDescriptions[i];
      SEL methodSelector = method_getName(method);
      NSString *methodName = NSStringFromSelector(methodSelector);
      if (EX_IS_METHOD_PROPSETTER(methodName)) {
        NSString *propNameWithArguments = [methodName substringFromIndex:[@EXPAND_AND_QUOTE(EX_PROPSETTERS_PREFIX) length]];
        NSString *propName = [[propNameWithArguments componentsSeparatedByString:@":"] firstObject];
        propsNames[propName] = methodName;
      }
    }
  }
  @finally {
    free(methodsDescriptions);
  }
  
  return propsNames;
}

@end
