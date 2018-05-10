// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <objc/runtime.h>
#import <EXCore/EXModuleRegistry+Downcasting.h>

@implementation EXModuleRegistry (Downcasting)

# pragma mark - Downcasting instances to protocols

- (id)downcastInstance:(id)instance toProtocol:(Protocol *)protocol
{
  // NOTE: We aren't able to check whether expected object types match
  // (i. e. `- (NSArray *)fetch;` and `- (NSString *)fetch;` won't throw an exception)
  
  // Check whether required instance methods match
  unsigned int requiredMethodsCount;
  struct objc_method_description *requiredMethodsDescriptions = protocol_copyMethodDescriptionList(protocol, YES, YES, &requiredMethodsCount);
  @try {
    for(int i = 0; i < requiredMethodsCount; i++) {
      struct objc_method_description protocolMethod = requiredMethodsDescriptions[i];
      NSMethodSignature *instanceMethodSignature = [instance methodSignatureForSelector:protocolMethod.name];
      [EXModuleRegistry passOrThrowOnMethodExistenceForMethodSignature:instanceMethodSignature andMethodDescription:protocolMethod inProtocol:protocol];
      [EXModuleRegistry passOrThrowOnArgumentTypesMatchForMethodSignature:instanceMethodSignature andMethodDescription:protocolMethod inProtocol:protocol];
      [EXModuleRegistry passOrThrowOnReturnTypesMatchForMethodSignature:instanceMethodSignature andMethodDescription:protocolMethod inProtocol:protocol];
    }
  }
  @finally {
    free(requiredMethodsDescriptions);
  }
  
  // Check whether optional instance methods match
  unsigned int optionalMethodsCount;
  struct objc_method_description *optionalMethodDescriptions = protocol_copyMethodDescriptionList(protocol, NO, YES, &optionalMethodsCount);
  @try {
    for(int i = 0; i < optionalMethodsCount; i++) {
      struct objc_method_description protocolMethod = optionalMethodDescriptions[i];
      NSMethodSignature *instanceMethodSignature = [instance methodSignatureForSelector:protocolMethod.name];
      // Optional methods are optional, but if they exist,
      // their argument and return types have to match
      if (instanceMethodSignature) {
        [EXModuleRegistry passOrThrowOnArgumentTypesMatchForMethodSignature:instanceMethodSignature andMethodDescription:protocolMethod inProtocol:protocol];
        [EXModuleRegistry passOrThrowOnReturnTypesMatchForMethodSignature:instanceMethodSignature andMethodDescription:protocolMethod inProtocol:protocol];
      }
    }
  }
  @finally {
    free(optionalMethodDescriptions);
  }
  
  return instance;
}

+ (void)passOrThrowOnMethodExistenceForMethodSignature:(NSMethodSignature *)methodSignature andMethodDescription:(struct objc_method_description)methodDescription inProtocol:(Protocol *)protocol
{
  if (!methodSignature) {
    @throw [self createMethodMissingException:NSStringFromSelector(methodDescription.name) inProtocol:NSStringFromProtocol(protocol)];
  }
}

+ (void)passOrThrowOnArgumentTypesMatchForMethodSignature:(NSMethodSignature *)methodSignature andMethodDescription:(struct objc_method_description)methodDescription inProtocol:(Protocol *)protocol
{
  NSString *instanceArgumentTypes = [self getArgumentsTypesForMethodSignature:methodSignature];
  NSString *protocolArgumentTypes = [[self getArgumentsTypesForMethodDescription:methodDescription] substringFromIndex:1];
  if (![instanceArgumentTypes isEqualToString:protocolArgumentTypes]) {
    @throw [self createArgumentsMismatchException:NSStringFromSelector(methodDescription.name) expectedArguments:protocolArgumentTypes offendingArguments:instanceArgumentTypes inProtocol:NSStringFromProtocol(protocol)];
  }
}

+ (void)passOrThrowOnReturnTypesMatchForMethodSignature:(NSMethodSignature *)methodSignature andMethodDescription:(struct objc_method_description)methodDescription inProtocol:(Protocol *)protocol
{
  NSString *protocolReturnType = [[self getArgumentsTypesForMethodDescription:methodDescription] substringToIndex:1];
  NSString *instanceReturnType = [self normalizeArgumentType:methodSignature.methodReturnType];
  if (![instanceReturnType isEqualToString:protocolReturnType]) {
    @throw [self createReturnTypeMismatchException:NSStringFromSelector(methodDescription.name) expectedReturnType:protocolReturnType offendingReturnType:instanceReturnType inProtocol:NSStringFromProtocol(protocol)];
  }
}

# pragma mark Utilities

+ (NSString *)normalizeArgumentType:(const char *)argumentType
{
  NSMutableString *stringBuffer = [[NSMutableString alloc] init];
  const char *pointer = argumentType;
  
  while (*pointer != 0) {
    // We should strip all the digits from the argument type string
    // See: https://stackoverflow.com/a/41525348/1123156
    if (*pointer < '0' || *pointer > '9') {
      [stringBuffer appendFormat:@"%c", *pointer];
    }
    pointer++;
  }
  
  return stringBuffer;
}

+ (NSString *)getArgumentsTypesForMethodDescription:(struct objc_method_description)description
{
  return [self normalizeArgumentType:description.types];
}

+ (NSString *)getArgumentsTypesForMethodSignature:(NSMethodSignature *)signature
{
  NSMutableString *argumentTypesBuffer = [[NSMutableString alloc] init];
  
  for (int i = 0; i < signature.numberOfArguments; i++) {
    const char *argumentType = [signature getArgumentTypeAtIndex:i];
    NSString *normalizedArgumentType = [self normalizeArgumentType:argumentType];
    [argumentTypesBuffer appendString:normalizedArgumentType];
  }
  
  return argumentTypesBuffer;
}

# pragma mark - Exceptions

+ (NSException *)createMethodMissingException:(NSString *)methodName inProtocol:(NSString *)protocolName
{
  NSString *reason = [[NSString alloc] initWithFormat:@"Instance does not conform to method `%@` in protocol `%@`", methodName, protocolName];
  return [NSException exceptionWithName:@"InstanceNotCompatible" reason:reason userInfo:nil];
}

+ (NSException *)createArgumentsMismatchException:(NSString *)methodName expectedArguments:(NSString *)expectedArguments offendingArguments:(NSString *)offendingArguments inProtocol:(NSString *)protocolName
{
  NSString *reason = [[NSString alloc] initWithFormat:@"Arguments mismatch for method `%@`: `%@` != `%@` in protocol `%@`", methodName, expectedArguments, offendingArguments, protocolName];
  return [NSException exceptionWithName:@"InstanceNotCompatible" reason:reason userInfo:nil];
}

+ (NSException *)createReturnTypeMismatchException:(NSString *)methodName expectedReturnType:(NSString *)expectedReturnType offendingReturnType:(NSString *)offendingReturnType inProtocol:(NSString *)protocolName
{
  NSString *reason = [[NSString alloc] initWithFormat:@"Return types mismatch for method `%@`: `%@` != `%@` in protocol `%@`", methodName, expectedReturnType, offendingReturnType, protocolName];
  return [NSException exceptionWithName:@"InstanceNotCompatible" reason:reason userInfo:nil];
}

@end

