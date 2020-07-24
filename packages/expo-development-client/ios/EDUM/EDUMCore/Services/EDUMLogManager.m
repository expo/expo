// Copyright 2019-present 650 Industries. All rights reserved.

#import <EDUMLogManager.h>
#import <EDUMLogHandler.h>
#import <EDUMModuleRegistryProvider.h>

@interface EDUMLogManager ()

@property (nonatomic, strong) NSSet<id<EDUMLogHandler>> *logHandlersCache;

@end

@implementation EDUMLogManager

EDUM_REGISTER_SINGLETON_MODULE(LogManager);

- (NSSet<id<EDUMLogHandler>> *)logHandlers
{
  if (!_logHandlersCache) {
    _logHandlersCache = [[EDUMModuleRegistryProvider singletonModules] filteredSetUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
      return [evaluatedObject conformsToProtocol:@protocol(EDUMLogHandler)];
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

void EDUMLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(EDUMLogManager *)[EDUMModuleRegistryProvider getSingletonModuleForClass:[EDUMLogManager class]] info:message];
}

void EDUMLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(EDUMLogManager *)[EDUMModuleRegistryProvider getSingletonModuleForClass:[EDUMLogManager class]] warn:message];
}

void EDUMLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(EDUMLogManager *)[EDUMModuleRegistryProvider getSingletonModuleForClass:[EDUMLogManager class]] error:message];
}

void EDUMFatal(NSError *error) {
  [(EDUMLogManager *)[EDUMModuleRegistryProvider getSingletonModuleForClass:[EDUMLogManager class]] fatal:error];
}
