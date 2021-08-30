// Copyright 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXLogManager.h>
#import <ExpoModulesCore/EXLogHandler.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>

@interface EXLogManager ()

@property (nonatomic, strong) NSSet<id<EXLogHandler>> *logHandlersCache;

@end

@implementation EXLogManager

EX_REGISTER_SINGLETON_MODULE(LogManager);

- (NSSet<id<EXLogHandler>> *)logHandlers
{
  if (!_logHandlersCache) {
    _logHandlersCache = [[EXModuleRegistryProvider singletonModules] filteredSetUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
      return [evaluatedObject conformsToProtocol:@protocol(EXLogHandler)];
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

void EXLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(EXLogManager *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXLogManager class]] info:message];
}

void EXLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(EXLogManager *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXLogManager class]] warn:message];
}

void EXLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(EXLogManager *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXLogManager class]] error:message];
}

void EXFatal(NSError *error) {
  [(EXLogManager *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXLogManager class]] fatal:error];
}
