#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <EXFirebaseFunctions/EXFirebaseFunctions.h>
#import <FirebaseFunctions/FIRFunctions.h>
#import <FirebaseFunctions/FIRHTTPSCallable.h>
#import <FirebaseFunctions/FIRError.h>

@implementation EXFirebaseFunctions

EX_EXPORT_MODULE(ExpoFirebaseFunctions);

EX_EXPORT_METHOD_AS(httpsCallable,
                    httpsCallable:(NSString *)appName
                    region:(NSString *)region
                    name:(NSString *)name
                    wrapper:(NSDictionary *)wrapper
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject){
  FIRApp *firebaseApp = [EXFirebaseAppUtil getApp:appName];
  FIRFunctions *functions = [FIRFunctions functionsForApp:firebaseApp region:region];
  FIRHTTPSCallable *callable = [functions HTTPSCallableWithName:name];

  [callable callWithObject:[wrapper valueForKey:@"data"] completion:^(FIRHTTPSCallableResult * _Nullable result, NSError * _Nullable error) {
     if (error) {
       NSObject *details = [NSNull null];
       NSString *message = error.localizedDescription;
       if (error.domain == FIRFunctionsErrorDomain) {
         details = error.userInfo[FIRFunctionsErrorDetailsKey];
         if (details == nil) {
           details = [NSNull null];
         }
       }
       resolve(@{
                 @"__error": @YES,
                    @"code": [EXFirebaseFunctions getErrorCodeName:error],
                 @"message": message,
                 @"details": details
                 });
     } else {
       resolve(@{ @"data": [result data] });
     }
   }];
}

EX_EXPORT_METHOD_AS(useFunctionsEmulator,
                    useFunctionsEmulator:(NSString *)appName
                    region:(NSString *)region
                    origin:(NSString *)origin
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject){
  FIRApp *firebaseApp = [EXFirebaseAppUtil getApp:appName];
  FIRFunctions *functions = [FIRFunctions functionsForApp:firebaseApp region:region];
  [functions useFunctionsEmulatorOrigin:origin];
  resolve([NSNull null]);
}

+ (NSString *)getErrorCodeName:(NSError *)error {
  switch (error.code) {
    case FIRFunctionsErrorCodeOK:
      return @"OK";
    case FIRFunctionsErrorCodeCancelled:
      return @"CANCELLED";
    case FIRFunctionsErrorCodeInvalidArgument:
      return @"INVALID_ARGUMENT";
    case FIRFunctionsErrorCodeDeadlineExceeded:
      return @"DEADLINE_EXCEEDED";
    case FIRFunctionsErrorCodeNotFound:
      return @"NOT_FOUND";
    case FIRFunctionsErrorCodeAlreadyExists:
      return @"ALREADY_EXISTS";
    case FIRFunctionsErrorCodePermissionDenied:
      return @"PERMISSION_DENIED";
    case FIRFunctionsErrorCodeResourceExhausted:
      return @"RESOURCE_EXHAUSTED";
    case FIRFunctionsErrorCodeFailedPrecondition:
      return @"FAILED_PRECONDITION";
    case FIRFunctionsErrorCodeAborted:
      return @"ABORTED";
    case FIRFunctionsErrorCodeOutOfRange:
      return @"OUT_OF_RANGE";
    case FIRFunctionsErrorCodeUnimplemented:
      return @"UNIMPLEMENTED";
    case FIRFunctionsErrorCodeInternal:
      return @"INTERNAL";
    case FIRFunctionsErrorCodeUnavailable:
      return @"UNAVAILABLE";
    case FIRFunctionsErrorCodeDataLoss:
      return @"DATA_LOSS";
    case FIRFunctionsErrorCodeUnauthenticated:
      return @"UNAUTHENTICATED";
    default:
      return @"UNKNOWN";
  }
}

@end
