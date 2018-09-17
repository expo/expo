

#import <EXFirebaseFunctions/EXFirebaseFunctions.h>
#import <FirebaseFunctions/FIRFunctions.h>
#import <FirebaseFunctions/FIRHTTPSCallable.h>
#import <FirebaseFunctions/FIRError.h>

@implementation EXFirebaseFunctions

EX_EXPORT_MODULE(ExpoFirebaseFunctions);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
}

EX_EXPORT_METHOD_AS(httpsCallable,
                    httpsCallable:(NSString *)name
                    wrapper:(NSDictionary *)wrapper
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject
                    ) {
  FIRFunctions *functions = [FIRFunctions functions];
  
  [[functions HTTPSCallableWithName:name] callWithObject:[wrapper valueForKey:@"data"] completion:^(FIRHTTPSCallableResult * _Nullable result, NSError * _Nullable error) {
    if (error) {
      NSObject *details = [NSNull null];
      NSString *message = error.localizedDescription;
      if (error.domain == FIRFunctionsErrorDomain) {
        details = error.userInfo[FIRFunctionsErrorDetailsKey];
        if (details == nil) {
          details = [NSNull null];
        }
      }
      // TODO: Evan: Reject?
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
