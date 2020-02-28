// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMLogManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMLogHandler.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryProvider.h>

@interface ABI37_0_0UMLogManager ()

@property (nonatomic, strong) NSSet<id<ABI37_0_0UMLogHandler>> *logHandlersCache;

@end

@implementation ABI37_0_0UMLogManager

ABI37_0_0UM_REGISTER_SINGLETON_MODULE(LogManager);

- (NSSet<id<ABI37_0_0UMLogHandler>> *)logHandlers
{
  if (!_logHandlersCache) {
    _logHandlersCache = [[ABI37_0_0UMModuleRegistryProvider singletonModules] filteredSetUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
      return [evaluatedObject conformsToProtocol:@protocol(ABI37_0_0UMLogHandler)];
    }]];
  }

  return _logHandlersCache;
}

- (void)info:(NSString *)message
{
  [[self logHandlers] makeObjectsPerformSelector:@selector(info:) withObject:message];
}

- (void)warn:(NSString *)message
{
  [[self logHandlers] makeObjectsPerformSelector:@selector(warn:) withObject:message];
}

- (void)error:(NSString *)message
{
  [[self logHandlers] makeObjectsPerformSelector:@selector(error:) withObject:message];
}

- (void)fatal:(NSString *)message
{
  [[self logHandlers] makeObjectsPerformSelector:@selector(fatal:) withObject:message];
}

@end

void ABI37_0_0UMLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(ABI37_0_0UMLogManager *)[ABI37_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI37_0_0UMLogManager class]] info:message];
}

void ABI37_0_0UMLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(ABI37_0_0UMLogManager *)[ABI37_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI37_0_0UMLogManager class]] warn:message];
}

void ABI37_0_0UMLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(ABI37_0_0UMLogManager *)[ABI37_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI37_0_0UMLogManager class]] error:message];
}

void ABI37_0_0UMFatal(NSError *error) {
  [(ABI37_0_0UMLogManager *)[ABI37_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI37_0_0UMLogManager class]] fatal:error];
}
