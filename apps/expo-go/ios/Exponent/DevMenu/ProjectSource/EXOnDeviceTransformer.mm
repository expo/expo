// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXOnDeviceTransformer.h"

#import <memory>
#import <string>

#import <hermes/hermes.h>
#import <jsi/jsi.h>

namespace jsi = facebook::jsi;

static NSString *const EXOnDeviceTransformerErrorDomain = @"EXOnDeviceTransformer";

typedef NS_ENUM(NSInteger, EXOnDeviceTransformerErrorCode) {
  EXOnDeviceTransformerErrorPayloadMissing = 1,
  EXOnDeviceTransformerErrorPayloadFailedToLoad = 2,
  EXOnDeviceTransformerErrorTransformFailed = 3,
};

static NSError *EXMakeError(EXOnDeviceTransformerErrorCode code, NSString *message)
{
  return [NSError errorWithDomain:EXOnDeviceTransformerErrorDomain
                             code:code
                         userInfo:@{ NSLocalizedDescriptionKey: message }];
}

@implementation EXOnDeviceTransformResult
- (instancetype)initWithCode:(NSString *)code dependencyNames:(NSArray<NSString *> *)dependencyNames
{
  if (self = [super init]) {
    _code = [code copy];
    _dependencyNames = [dependencyNames copy];
  }
  return self;
}
@end

@implementation EXOnDeviceTransformer {
  std::shared_ptr<jsi::Runtime> _runtime;
  // A jsi::Runtime has thread affinity; all access (creation, eval, calls)
  // must stay on one thread. The applier fires a detached task per save, so
  // serialize everything onto this queue.
  dispatch_queue_t _queue;
}

- (nullable instancetype)initWithBundle:(NSBundle *)bundle
                                  error:(NSError *_Nullable *_Nullable)error
{
  if (!(self = [super init])) {
    return nil;
  }

  NSString *payloadPath = [bundle pathForResource:@"device-transformer" ofType:@"js"];
  if (!payloadPath) {
    if (error) {
      *error = EXMakeError(EXOnDeviceTransformerErrorPayloadMissing,
                           @"The on-device transformer payload (device-transformer.js) is not bundled with this build of Expo Go.");
    }
    return nil;
  }

  NSError *readError = nil;
  NSString *payload = [NSString stringWithContentsOfFile:payloadPath encoding:NSUTF8StringEncoding error:&readError];
  if (!payload) {
    if (error) {
      *error = EXMakeError(EXOnDeviceTransformerErrorPayloadFailedToLoad,
                           readError.localizedDescription ?: @"could not read device-transformer.js");
    }
    return nil;
  }

  _queue = dispatch_queue_create("host.exp.exponent.OnDeviceTransformer", DISPATCH_QUEUE_SERIAL);

  __block NSError *loadError = nil;
  dispatch_sync(_queue, ^{
    try {
      // EnableEval defaults to true, so evaluating the payload as source keeps
      // Hermes's compiler in-process and babel's eval-based paths work.
      self->_runtime = facebook::hermes::makeHermesRuntime();
      auto buffer = std::make_shared<jsi::StringBuffer>(std::string(payload.UTF8String));
      self->_runtime->evaluateJavaScript(buffer, "device-transformer.js");
    } catch (const std::exception &e) {
      loadError = EXMakeError(EXOnDeviceTransformerErrorPayloadFailedToLoad,
                              [NSString stringWithUTF8String:e.what()]);
    }
  });
  if (loadError) {
    if (error) {
      *error = loadError;
    }
    return nil;
  }

  return self;
}

- (nullable EXOnDeviceTransformResult *)transformSource:(NSString *)source
                                               filename:(NSString *)filename
                                               moduleId:(NSInteger)moduleId
                                          dependencyIds:(NSArray<NSNumber *> *)dependencyIds
                                                  error:(NSError *_Nullable *_Nullable)error
{
  __block EXOnDeviceTransformResult *result = nil;
  __block NSError *transformError = nil;
  dispatch_sync(_queue, ^{
    result = [self _transformSource:source
                          filename:filename
                          moduleId:moduleId
                     dependencyIds:dependencyIds
                             error:&transformError];
  });
  if (transformError && error) {
    *error = transformError;
  }
  return result;
}

// Must run on _queue (jsi::Runtime is single-threaded).
- (nullable EXOnDeviceTransformResult *)_transformSource:(NSString *)source
                                                filename:(NSString *)filename
                                                moduleId:(NSInteger)moduleId
                                           dependencyIds:(NSArray<NSNumber *> *)dependencyIds
                                                   error:(NSError *_Nullable *_Nullable)error
{
  try {
    jsi::Runtime &rt = *_runtime;

    jsi::Value transformModule = rt.global().getProperty(rt, "transformModule");
    if (!transformModule.isObject() || !transformModule.getObject(rt).isFunction(rt)) {
      if (error) {
        *error = EXMakeError(EXOnDeviceTransformerErrorPayloadFailedToLoad,
                             @"transformModule is not defined by the payload");
      }
      return nil;
    }

    jsi::Array deps = jsi::Array(rt, dependencyIds.count);
    for (NSUInteger i = 0; i < dependencyIds.count; i++) {
      deps.setValueAtIndex(rt, i, jsi::Value((double)dependencyIds[i].integerValue));
    }

    jsi::Value result = transformModule.getObject(rt).getFunction(rt).call(
        rt,
        jsi::String::createFromUtf8(rt, source.UTF8String),
        jsi::String::createFromUtf8(rt, filename.UTF8String),
        jsi::Value((double)moduleId),
        std::move(deps));

    if (!result.isObject()) {
      if (error) {
        *error = EXMakeError(EXOnDeviceTransformerErrorTransformFailed, @"payload returned an unexpected shape");
      }
      return nil;
    }

    jsi::Object resultObject = result.getObject(rt);
    jsi::Value codeValue = resultObject.getProperty(rt, "code");
    jsi::Value depNamesValue = resultObject.getProperty(rt, "depNames");
    if (!codeValue.isString() || !depNamesValue.isObject() || !depNamesValue.getObject(rt).isArray(rt)) {
      if (error) {
        *error = EXMakeError(EXOnDeviceTransformerErrorTransformFailed, @"payload returned an unexpected shape");
      }
      return nil;
    }

    NSString *code = [NSString stringWithUTF8String:codeValue.getString(rt).utf8(rt).c_str()];

    jsi::Array depNamesArray = depNamesValue.getObject(rt).getArray(rt);
    size_t count = depNamesArray.size(rt);
    NSMutableArray<NSString *> *depNames = [NSMutableArray arrayWithCapacity:count];
    for (size_t i = 0; i < count; i++) {
      jsi::Value name = depNamesArray.getValueAtIndex(rt, i);
      [depNames addObject:[NSString stringWithUTF8String:name.getString(rt).utf8(rt).c_str()]];
    }

    return [[EXOnDeviceTransformResult alloc] initWithCode:code dependencyNames:depNames];
  } catch (const jsi::JSError &e) {
    // Log the full JS stack for debugging (babel failures need the call site);
    // surface only the concise message to the caller/UI.
    NSLog(@"[EXOnDeviceTransformer] transform failed for %@:\n%s\n%s", filename, e.getMessage().c_str(), e.getStack().c_str());
    if (error) {
      *error = EXMakeError(EXOnDeviceTransformerErrorTransformFailed, [NSString stringWithUTF8String:e.getMessage().c_str()]);
    }
    return nil;
  } catch (const std::exception &e) {
    if (error) {
      *error = EXMakeError(EXOnDeviceTransformerErrorTransformFailed, [NSString stringWithUTF8String:e.what()]);
    }
    return nil;
  }
}

@end
