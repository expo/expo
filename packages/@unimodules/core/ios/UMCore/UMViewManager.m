// Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMViewManager.h>
#import <objc/runtime.h>

#define QUOTE(str) #str
#define EXPAND_AND_QUOTE(str) QUOTE(str)

#define UM_IS_METHOD_PROPSETTER(methodName) \
  [methodName hasPrefix:@EXPAND_AND_QUOTE(UM_PROPSETTERS_PREFIX)]

#define UM_PROPSETTER_FOR_PROP(propName)\
  QUOTE(UM_PROPSETTERS_PREFIX)propName

static const NSString *noViewExceptionName = @"No custom -(UIView *)view implementation.";
static const NSString *noViewExceptionReason = @"You've subclassed an UMViewManager, but didn't override the -(UIView *)view method. Override this method and return a new view instance.";

static const NSString *noViewNameExceptionName = @"No custom -(NSString *)viewName implementation.";
static const NSString *noViewNameExceptionReasonFormat = @"You've subclassed an UMViewManager in %@, but didn't override the -(NSString *)viewName method. Override this method and return a name of the view component.";

@interface UMViewManager ()

@property NSDictionary<NSString *, NSString *> *propsNamesSelectors;

@end

@implementation UMViewManager

- (instancetype)init
{
  if (self = [super init]) {
    _propsNamesSelectors = [self getPropsNames];
  }
  return self;
}

- (UIView *)view
{
  @throw [NSException exceptionWithName:(NSString *)noViewExceptionName
                                 reason:(NSString *)noViewExceptionReason
                               userInfo:nil];
}

- (NSString *)viewName
{
  @throw [NSException exceptionWithName:(NSString *)noViewNameExceptionName
                                 reason:(NSString *)[NSString stringWithFormat:(NSString *)noViewNameExceptionReasonFormat, NSStringFromClass([self class])]
                               userInfo:nil];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

// Scans the class methods for methods with a certain prefix (see macro UM_PROPSETTERS_PREFIX),
// and returns dictionary which has props names as keys and selector strings as values.
// Example: @{ @"type": @"__ex_set__type" }

- (NSDictionary<NSString *, NSString *> *)getPropsNames
{
  NSMutableDictionary<NSString *, NSString *> *propsNames = [NSMutableDictionary dictionary];
  
  unsigned int methodsCount;
  Method *methodsDescriptions = class_copyMethodList([self class], &methodsCount);
  
  @try {
    for(int i = 0; i < methodsCount; i++) {
      Method method = methodsDescriptions[i];
      SEL methodSelector = method_getName(method);
      NSString *methodName = NSStringFromSelector(methodSelector);
      if (UM_IS_METHOD_PROPSETTER(methodName)) {
        NSString *propNameWithArguments = [methodName substringFromIndex:[@EXPAND_AND_QUOTE(UM_PROPSETTERS_PREFIX) length]];
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

- (void)updateProp:(NSString *)propName withValue:(id)value onView:(UIView *)view
{
  if (_propsNamesSelectors[propName]) {
    NSString *selectorString = _propsNamesSelectors[propName];
    SEL selector = NSSelectorFromString(selectorString);
    NSMethodSignature *methodSignature = [self methodSignatureForSelector:selector];
    if (methodSignature == nil) {
      // This in fact should never happen -- if we have a selector for this prop
      // (which we have if we're here), view manager should return method signature
      // for the cached selector.
      UMLogError(@"View manager of view '%@' does not implement method for selector '%@'.", [self viewName], NSStringFromSelector(selector));
      return;
    }
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
    [invocation setTarget:self];
    [invocation setSelector:selector];
    [invocation setArgument:&value atIndex:2];
    
    // According to objc.h, the BOOL type can be represented by `bool` or `signed char` so
    // getArgumentTypeAtIndex can return _C_BOOL (when `bool`) or _C_CHR (when `signed char`)
#if OBJC_BOOL_IS_BOOL
    if ([methodSignature getArgumentTypeAtIndex:2][0] == _C_BOOL) {
      // We need this intermediary variable, see
      // https://stackoverflow.com/questions/11061166/pointer-to-bool-in-objective-c
      BOOL retainedValue = [value boolValue];
      [invocation setArgument:&retainedValue atIndex:2];
    }
#else // BOOL is represented by `signed char`
    if ([methodSignature getArgumentTypeAtIndex:2][0] == _C_CHR) {
      BOOL retainedValue = [value charValue];
      [invocation setArgument:&retainedValue atIndex:2];
    }
#endif
    [invocation setArgument:(void *)&view atIndex:3];
    [invocation retainArguments];
    [invocation invoke];
  } else {
    UMLogWarn(@"Tried to set property `%@` on view manager of view `%@` when the view manager does not export such prop.", propName, [self viewName]);
  }
}

@end
