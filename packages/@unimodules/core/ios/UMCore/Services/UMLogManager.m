// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMLogManager.h>
#import <UMCore/UMLogHandler.h>
#import <UMCore/UMModuleRegistryProvider.h>

@interface UMLogManager ()

@property (nonatomic, strong) NSSet<id<UMLogHandler>> *logHandlersCache;

@end

@implementation UMLogManager

UM_REGISTER_SINGLETON_MODULE(LogManager);

- (NSSet<id<UMLogHandler>> *)logHandlers
{
  if (!_logHandlersCache) {
    _logHandlersCache = [[UMModuleRegistryProvider singletonModules] filteredSetUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
      return [evaluatedObject conformsToProtocol:@protocol(UMLogHandler)];
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

void UMLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(UMLogManager *)[UMModuleRegistryProvider getSingletonModuleForClass:[UMLogManager class]] info:message];
}

void UMLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(UMLogManager *)[UMModuleRegistryProvider getSingletonModuleForClass:[UMLogManager class]] warn:message];
}

void UMLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(UMLogManager *)[UMModuleRegistryProvider getSingletonModuleForClass:[UMLogManager class]] error:message];
}

void UMFatal(NSError *error) {
  [(UMLogManager *)[UMModuleRegistryProvider getSingletonModuleForClass:[UMLogManager class]] fatal:error];
}
