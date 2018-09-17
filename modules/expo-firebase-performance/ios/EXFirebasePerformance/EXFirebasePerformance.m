

#import <EXFirebasePerformance/EXFirebasePerformance.h>
#import <FirebasePerformance/FIRPerformance.h>
#import <FirebasePerformance/FIRHTTPMetric.h>

@implementation EXFirebasePerformance

EX_EXPORT_MODULE(ExpoFirebasePerformance);

- (id)init {
  self = [super init];
  if (self != nil) {
    _traces = [[NSMutableDictionary alloc] init];
    _httpMetrics = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (FIRHTTPMethod) mapStringToMethod:(NSString *) value {
  if ([value compare:@"get" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodGET;
  if ([value compare:@"put" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodPUT;
  if ([value compare:@"post" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodPUT;
  if ([value compare:@"delete" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodDELETE;
  if ([value compare:@"head" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodHEAD;
  if ([value compare:@"patch" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodPATCH;
  if ([value compare:@"options" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodOPTIONS;
  if ([value compare:@"trace" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodTRACE;
  if ([value compare:@"connect" options:NSCaseInsensitiveSearch] == NSOrderedSame) return FIRHTTPMethodCONNECT;
  return FIRHTTPMethodGET;
}

- (FIRTrace *)getOrCreateTrace:(NSString *)identifier {
  if (_traces[identifier]) {
    return _traces[identifier];
  }
  FIRTrace *trace = [[FIRPerformance sharedInstance] traceWithName:identifier];
  _traces[identifier] = trace;
  return trace;
}

- (FIRHTTPMetric *)getOrCreateHttpMetric:(NSString *)url httpMethod:(NSString *) httpMethod {
  NSString *identifier = [NSString stringWithFormat:@"%@%@", url, httpMethod];
  if (_httpMetrics[identifier]) {
    return _httpMetrics[identifier];
  }
  NSURL * toURL = [NSURL URLWithString:url];
  FIRHTTPMethod method = [self mapStringToMethod:httpMethod];
  FIRHTTPMetric *httpMetric = [[FIRHTTPMetric alloc] initWithURL:toURL HTTPMethod:method];
  _httpMetrics[identifier] = httpMetric;
  return httpMetric;
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
}

EX_EXPORT_METHOD_AS(setPerformanceCollectionEnabled,
                    setPerformanceCollectionEnabled:(BOOL *)enabled
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [FIRPerformance sharedInstance].dataCollectionEnabled = (BOOL)enabled;
  resolve(@([FIRPerformance sharedInstance].dataCollectionEnabled));
}

EX_EXPORT_METHOD_AS(startTrace,
                    startTrace:(NSString *)identifier
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateTrace:identifier] start];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(stopTrace,
                    stopTrace:(NSString *)identifier
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateTrace:identifier] stop];
  [_traces removeObjectForKey:identifier];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(getTraceAttribute,
                    getTraceAttribute:(NSString *)identifier
                    attribute:(NSString *)attribute
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  NSString *value = [[self getOrCreateTrace:identifier] valueForAttribute:attribute];
  resolve(value ? value : nil);
}

EX_EXPORT_METHOD_AS(getTraceAttributes,
                    getTraceAttributes:(NSString *)identifier
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  resolve([[self getOrCreateTrace:identifier] attributes]);
}

EX_EXPORT_METHOD_AS(getTraceLongMetric,
                    getTraceLongMetric:(NSString *)identifier
                    metricName:(NSString *)metricName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  int64_t value = [[self getOrCreateTrace:identifier] valueForIntMetric:metricName];
  resolve(@(value));
}

EX_EXPORT_METHOD_AS(incrementTraceMetric,
                    incrementTraceMetric:(NSString *)identifier
                    metricName:(NSString *)metricName
                    incrementBy:(NSNumber *)incrementBy
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  int64_t byInt = [incrementBy intValue];
  [[self getOrCreateTrace:identifier] incrementMetric:metricName byInt:byInt];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(putTraceAttribute,
                    putTraceAttribute:(NSString *)identifier
                    attribute:(NSString *)attribute
                    value:(NSString *)value
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRTrace * trace = [self getOrCreateTrace:identifier];
  [trace setValue:value forAttribute:attribute];
  
  if (trace.attributes[attribute] != nil) {
    resolve(@YES);
  } else {
    resolve(@NO);
  }
}

EX_EXPORT_METHOD_AS(putTraceMetric,
                    putTraceMetric:(NSString *)identifier
                    attribute:(NSString *)attribute
                    value:(NSNumber *)value
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  int64_t byInt = [value intValue];
  [[self getOrCreateTrace:identifier] setIntValue:byInt forMetric:attribute];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(removeTraceAttribute,
                    removeTraceAttribute:(NSString *)identifier
                    attribute:(NSString *)attribute
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateTrace:identifier] removeAttribute:attribute];
  resolve(nil);
}

/**
 * HTTP Metric
 */

EX_EXPORT_METHOD_AS(startHttpMetric,
                    startHttpMetric:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateHttpMetric:url httpMethod:httpMethod] start];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(stopHttpMetric,
                    stopHttpMetric:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateHttpMetric:url httpMethod:httpMethod] stop];
  [_httpMetrics removeObjectForKey:[NSString stringWithFormat:@"%@%@", url, httpMethod]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(getHttpMetricAttribute,
                    getHttpMetricAttribute:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    attribute:(NSString *)attribute
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  NSString *value = [[self getOrCreateHttpMetric:url httpMethod:httpMethod] valueForAttribute:attribute];
  resolve(value ? value : nil);
}

EX_EXPORT_METHOD_AS(getHttpMetricAttributes,
                    getHttpMetricAttributes:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  resolve([[self getOrCreateHttpMetric:url httpMethod:httpMethod] attributes]);
}

EX_EXPORT_METHOD_AS(putHttpMetricAttribute,
                    putHttpMetricAttribute:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    attribute:(NSString *)attribute
                    value:(NSString *)value
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRHTTPMetric * httpMetric = [self getOrCreateHttpMetric:url httpMethod:httpMethod];
  [httpMetric setValue:value forAttribute:attribute];
  
  if (httpMetric.attributes[attribute] != nil) {
    resolve(@YES);
  } else {
    resolve(@NO);
  }
}

EX_EXPORT_METHOD_AS(removeHttpMetricAttribute,
                    removeHttpMetricAttribute:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    attribute:(NSString *)attribute
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateHttpMetric:url httpMethod:httpMethod] removeAttribute:attribute];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setHttpMetricResponseCode,
                    setHttpMetricResponseCode:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    code:(NSNumber *)code
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateHttpMetric:url httpMethod:httpMethod] setResponseCode:[code integerValue]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setHttpMetricRequestPayloadSize,
                    setHttpMetricRequestPayloadSize:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    bytes:(NSNumber *)bytes
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateHttpMetric:url httpMethod:httpMethod] setRequestPayloadSize:[bytes longLongValue]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setHttpMetricResponseContentType,
                    setHttpMetricResponseContentType:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    type:(NSString *)type
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateHttpMetric:url httpMethod:httpMethod] setResponseContentType:type];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setHttpMetricResponsePayloadSize,
                    setHttpMetricResponsePayloadSize:(NSString *)url
                    httpMethod:(NSString *)httpMethod
                    bytes:(NSNumber *)bytes
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[self getOrCreateHttpMetric:url httpMethod:httpMethod] setResponsePayloadSize:[bytes longLongValue]];
  resolve(nil);
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}


@end
