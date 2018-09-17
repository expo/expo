#import <EXFirebaseInstanceID/EXFirebaseInstanceID.h>
#import <FirebaseMessaging/FirebaseMessaging.h>
#import <FirebaseInstanceID/FIRInstanceID.h>

@implementation EXFirebaseInstanceID
EX_EXPORT_MODULE(ExpoFirebaseInstanceID);

EX_EXPORT_METHOD_AS(delete,
                    delete:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRInstanceID instanceID] deleteIDWithHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"instance_id_error", @"Failed to delete instance id", error);
    } else {
      resolve(nil);
    }
  }];
}

EX_EXPORT_METHOD_AS(get,
                    get:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRInstanceID instanceID] getIDWithHandler:^(NSString * _Nullable identity, NSError * _Nullable error) {
    if (error) {
      reject(@"instance_id_error", @"Failed to get instance id", error);
    } else {
      resolve(identity);
    }
  }];
}

EX_EXPORT_METHOD_AS(getToken,
                    getToken:(NSString *)authorizedEntity
                    scope:(NSString *)scope
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  NSDictionary * options = nil;
  //    if ([FIRMessaging messaging].APNSToken) {
  //        options = @{@"apns_token": [FIRMessaging messaging].APNSToken};
  //    }
  [[FIRInstanceID instanceID] tokenWithAuthorizedEntity:authorizedEntity scope:scope options:options handler:^(NSString * _Nullable identity, NSError * _Nullable error) {
    if (error) {
      reject(@"instance_id_error", @"Failed to getToken", error);
    } else {
      resolve(identity);
    }
  }];
}

EX_EXPORT_METHOD_AS(deleteToken,
                    deleteToken:(NSString *)authorizedEntity
                    scope:(NSString *)scope
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRInstanceID instanceID] deleteTokenWithAuthorizedEntity:authorizedEntity scope:scope handler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"instance_id_error", @"Failed to deleteToken", error);
    } else {
      resolve(nil);
    }
  }];
}

@end
