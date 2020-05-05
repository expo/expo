// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <objc/runtime.h>

#define QUOTE(str) #str
#define ABI36_0_0EXPAND_AND_QUOTE(str) QUOTE(str)

#define ABI36_0_0UM_IS_METHOD_EXPORTED(methodName) \
[methodName hasPrefix:@ABI36_0_0EXPAND_AND_QUOTE(ABI36_0_0UM_EXPORTED_METHODS_PREFIX)]

static const NSString *noNameExceptionName = @"No custom +(const NSString *)exportedModuleName implementation.";
static const NSString *noNameExceptionReasonFormat = @"You've subclassed an ABI36_0_0UMExportedModule in %@, but didn't override the +(const NSString *)exportedModuleName method. Override this method and return a name for your exported module.";

static const NSRegularExpression *selectorRegularExpression = nil;
static dispatch_once_t selectorRegularExpressionOnceToken = 0;

@interface ABI36_0_0UMExportedModule ()

@property (nonatomic, strong) dispatch_queue_t methodQueue;
@property (nonatomic, strong) NSDictionary<NSString *, NSString *> *exportedMethods;

@end

@implementation ABI36_0_0UMExportedModule

- (instancetype)init
{
  return self = [super init];
}

- (instancetype)copyWithZone:(NSZone *)zone
{
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return nil;
}


+ (const NSString *)exportedModuleName
{
  NSString *reason = [NSString stringWithFormat:(NSString *)noNameExceptionReasonFormat, [self description]];
  @throw [NSException exceptionWithName:(NSString *)noNameExceptionName
                                 reason:reason
                               userInfo:nil];
}

- (NSDictionary *)constantsToExport
{
  return nil;
}

- (dispatch_queue_t)methodQueue
{
  if (!_methodQueue) {
    NSString *queueName = [NSString stringWithFormat:@"org.unimodules.%@Queue", [[self class] exportedModuleName]];
    _methodQueue = dispatch_queue_create(queueName.UTF8String, DISPATCH_QUEUE_SERIAL);
  }
  return _methodQueue;
}

# pragma mark - Exported methods

- (NSDictionary<NSString *, NSString *> *)getExportedMethods
{
  if (_exportedMethods) {
    return _exportedMethods;
  }

  NSMutableDictionary<NSString *, NSString *> *exportedMethods = [NSMutableDictionary dictionary];
  
  Class klass = [self class];
  
  while (klass) {
    unsigned int methodsCount;
    Method *methodsDescriptions = class_copyMethodList(object_getClass(klass), &methodsCount);

    @try {
      for(int i = 0; i < methodsCount; i++) {
        Method method = methodsDescriptions[i];
        SEL methodSelector = method_getName(method);
        NSString *methodName = NSStringFromSelector(methodSelector);
        if (ABI36_0_0UM_IS_METHOD_EXPORTED(methodName)) {
          IMP imp = method_getImplementation(method);
          const ABI36_0_0UMMethodInfo *info = ((const ABI36_0_0UMMethodInfo *(*)(id, SEL))imp)(klass, methodSelector);
          NSString *fullSelectorName = [NSString stringWithUTF8String:info->objcName];
          // `objcName` constains a method declaration string
          // (eg. `doSth:(NSString *)string options:(NSDictionary *)options`)
          // We only need a selector string  (eg. `doSth:options:`)
          NSString *simpleSelectorName = [self selectorNameFromName:fullSelectorName];
          exportedMethods[[NSString stringWithUTF8String:info->jsName]] = simpleSelectorName;
        }
      }
    }
    @finally {
      free(methodsDescriptions);
    }

    klass = [klass superclass];
  }
  
  _exportedMethods = exportedMethods;
  
  return _exportedMethods;
}

- (NSString *)selectorNameFromName:(NSString *)nameString
{
  dispatch_once(&selectorRegularExpressionOnceToken, ^{
    selectorRegularExpression = [NSRegularExpression regularExpressionWithPattern:@"\\(.+?\\).+?\\b\\s*" options:NSRegularExpressionCaseInsensitive error:nil];
  });
  return [selectorRegularExpression stringByReplacingMatchesInString:nameString options:0 range:NSMakeRange(0, [nameString length]) withTemplate:@""];
}

static const NSNumber *trueValue;

- (void)callExportedMethod:(NSString *)methodName withArguments:(NSArray *)arguments resolver:(ABI36_0_0UMPromiseResolveBlock)resolve rejecter:(ABI36_0_0UMPromiseRejectBlock)reject
{
  trueValue = [NSNumber numberWithBool:YES];
  const NSString *moduleName = [[self class] exportedModuleName];
  NSString *methodDeclaration = _exportedMethods[methodName];
  if (methodDeclaration == nil) {
    NSString *reason = [NSString stringWithFormat:@"Module '%@' does not export method '%@'.", moduleName, methodName];
    reject(@"E_NO_METHOD", reason, nil);
    return;
  }
  SEL selector = NSSelectorFromString(methodDeclaration);
  NSMethodSignature *methodSignature = [self methodSignatureForSelector:selector];
  if (methodSignature == nil) {
    // This in fact should never happen -- if we have a methodDeclaration for an exported method
    // it means that it has been exported with ABI36_0_0UM_IMPORT_METHOD and if we cannot find method signature
    // for the cached selector either the macro or the -selectorNameFromName is faulty.
    NSString *reason = [NSString stringWithFormat:@"Module '%@' does not implement method for selector '%@'.", moduleName, NSStringFromSelector(selector)];
    reject(@"E_NO_METHOD", reason, nil);
    return;
  }
  
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
  [invocation setTarget:self];
  [invocation setSelector:selector];
  [arguments enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    if (obj != [NSNull null]) {
      [invocation setArgument:&obj atIndex:(2 + idx)];
    }
    
    // According to objc.h, the BOOL type can be represented by `bool` or `signed char` so
    // getArgumentTypeAtIndex can return _C_BOOL (when `bool`) or _C_CHR (when `signed char`)
#if OBJC_BOOL_IS_BOOL
    if ([methodSignature getArgumentTypeAtIndex:(2 + idx)][0] == _C_BOOL) {
      // We need this intermediary variable, see
      // https://stackoverflow.com/questions/11061166/pointer-to-bool-in-objective-c
      BOOL value = [obj boolValue];
      [invocation setArgument:&value atIndex:(2 + idx)];
    }
#else // BOOL is represented by `signed char`
    if ([methodSignature getArgumentTypeAtIndex:(2 + idx)][0] == _C_CHR){
      BOOL value = [obj charValue];
      [invocation setArgument:&value atIndex:(2 + idx)];
    }
#endif
  }];
  [invocation setArgument:&resolve atIndex:(2 + [arguments count])];
  [invocation setArgument:&reject atIndex:([arguments count] + 2 + 1)];
  [invocation retainArguments];
  [invocation invoke];
}

@end
