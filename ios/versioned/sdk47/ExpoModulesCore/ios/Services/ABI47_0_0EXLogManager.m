// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXLogManager.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXLogHandler.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryProvider.h>

@interface ABI47_0_0EXLogManager ()

@property (nonatomic, strong) NSSet<id<ABI47_0_0EXLogHandler>> *logHandlersCache;

@end

@implementation ABI47_0_0EXLogManager

ABI47_0_0EX_REGISTER_SINGLETON_MODULE(LogManager);

- (NSSet<id<ABI47_0_0EXLogHandler>> *)logHandlers
{
  if (!_logHandlersCache) {
    _logHandlersCache = [[ABI47_0_0EXModuleRegistryProvider singletonModules] filteredSetUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
      return [evaluatedObject conformsToProtocol:@protocol(ABI47_0_0EXLogHandler)];
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

void ABI47_0_0EXLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(ABI47_0_0EXLogManager *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:[ABI47_0_0EXLogManager class]] info:message];
}

void ABI47_0_0EXLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(ABI47_0_0EXLogManager *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:[ABI47_0_0EXLogManager class]] warn:message];
}

void ABI47_0_0EXLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  [(ABI47_0_0EXLogManager *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:[ABI47_0_0EXLogManager class]] error:message];
}

void ABI47_0_0EXFatal(NSError *error) {
  [(ABI47_0_0EXLogManager *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:[ABI47_0_0EXLogManager class]] fatal:error];
}
