// Copyright © 2018 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <objc/runtime.h>

#define QUOTE(str) #str
#define EXPAND_AND_QUOTE(str) QUOTE(str)

#define EX_IS_METHOD_EXPORTED(methodName) \
[methodName hasPrefix:@EXPAND_AND_QUOTE(EX_EXPORTED_METHODS_PREFIX)]

static const NSString *noNameExceptionName = @"No custom +(const NSString *)exportedModuleName implementation.";
static const NSString *noNameExceptionReason = @"You've subclassed an EXExportedModule, but didn't override the +(const NSString *)exportedModuleName method. Override this method and return a name for your exported module.";

static const NSRegularExpression *selectorRegularExpression = nil;
static dispatch_once_t selectorRegularExpressionOnceToken = 0;

@interface EXExportedModule ()

@property (nonatomic, strong) NSDictionary<NSString *, NSString *> *exportedMethods;

@end

@implementation EXExportedModule

- (instancetype)init
{
  return self = [super init];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  return self = [self init];
}

+ (const NSArray<NSString *> *)internalModuleNames {
  return nil;
}


+ (const NSString *)exportedModuleName
{
  @throw [NSException exceptionWithName:(NSString *)noNameExceptionName
                                 reason:(NSString *)noNameExceptionReason
                               userInfo:nil];
}

- (NSDictionary *)constantsToExport
{
  return nil;
}

- (dispatch_queue_t)methodQueue
{
  return nil;
}

# pragma mark - Exported methods

- (NSDictionary<NSString *, NSString *> *)getExportedMethods
{
  if (_exportedMethods) {
    return _exportedMethods;
  }

  NSMutableDictionary<NSString *, NSString *> *exportedMethods = [NSMutableDictionary dictionary];
  
  unsigned int methodsCount;
  Method *methodsDescriptions = class_copyMethodList(object_getClass([self class]), &methodsCount);
  
  @try {
    for(int i = 0; i < methodsCount; i++) {
      Method method = methodsDescriptions[i];
      SEL methodSelector = method_getName(method);
      NSString *methodName = NSStringFromSelector(methodSelector);
      if (EX_IS_METHOD_EXPORTED(methodName)) {
        IMP imp = method_getImplementation(method);
        const EXMethodInfo *info = ((const EXMethodInfo *(*)(id, SEL))imp)([self class], methodSelector);
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

- (void)callExportedMethod:(NSString *)methodName withArguments:(NSArray *)arguments resolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
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
    // it means that it has been exported with EX_EXPORT_METHOD and if we cannot find method signature
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
  }];
  [invocation setArgument:&resolve atIndex:(2 + [arguments count])];
  [invocation setArgument:&reject atIndex:([arguments count] + 2 + 1)];
  [invocation retainArguments];
  
  if ([self methodQueue] != nil) {
    dispatch_async([self methodQueue], ^{
      [invocation invoke];
    });
  } else {
    [invocation invoke];
  }
}

@end
