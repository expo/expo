// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <EXFirebaseAuth/EXFirebaseAuth.h>

static NSString *const keyIOS = @"iOS";
static NSString *const keyUrl = @"url";
static NSString *const keyUid = @"uid";
static NSString *const keyUser = @"user";
static NSString *const keyEmail = @"email";
static NSString *const keyAndroid = @"android";
static NSString *const keyProfile = @"profile";
static NSString *const keyNewUser = @"isNewUser";
static NSString *const keyUsername = @"username";
static NSString *const keyPhotoUrl = @"photoURL";
static NSString *const keyBundleId = @"bundleId";
static NSString *const keyInstallApp = @"installApp";
static NSString *const keyProviderId = @"providerId";
static NSString *const keyPhoneNumber = @"phoneNumber";
static NSString *const keyDisplayName = @"displayName";
static NSString *const keyPackageName = @"packageName";
static NSString *const keyMinVersion = @"minimumVersion";
static NSString *const constAppLanguage = @"APP_LANGUAGE";
static NSString *const constAppUser = @"APP_USER";
static NSString *const keyHandleCodeInApp = @"handleCodeInApp";
static NSString *const keyAdditionalUserInfo = @"additionalUserInfo";

static NSString *const AUTH_STATE_CHANGED_EVENT = @"Expo.Firebase.auth_state_changed";
static NSString *const AUTH_ID_TOKEN_CHANGED_EVENT = @"Expo.Firebase.auth_id_token_changed";
static NSString *const PHONE_AUTH_STATE_CHANGED_EVENT = @"Expo.Firebase.phone_auth_state_changed";

typedef void (^EXFirebaseAuthCallback)(NSError *_Nullable error);

static NSMutableDictionary *authStateHandlers;
static NSMutableDictionary *idTokenHandlers;

@interface EXFirebaseAuth()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@end

@implementation EXFirebaseAuth

EX_EXPORT_MODULE(ExpoFirebaseAuth);

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  self = [super init];

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    authStateHandlers = [[NSMutableDictionary alloc] init];
    idTokenHandlers = [[NSMutableDictionary alloc] init];
    NSLog(@"EXFirebaseAuth:instance-created");
  });
  
  return self;
}

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  NSLog(@"EXFirebaseAuth:instance-destroyed");
  
  for (NSString *key in authStateHandlers) {
    FIRApp *firApp = [EXFirebaseAppUtil getApp:key];
    [[FIRAuth authWithApp:firApp] removeAuthStateDidChangeListener:[authStateHandlers valueForKey:key]];
    [authStateHandlers removeObjectForKey:key];
  }
  
  for (NSString *key in idTokenHandlers) {
    FIRApp *firApp = [EXFirebaseAppUtil getApp:key];
    [[FIRAuth authWithApp:firApp] removeIDTokenDidChangeListener:[idTokenHandlers valueForKey:key]];
    [idTokenHandlers removeObjectForKey:key];
  }
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  [self invalidate];
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

/**
 addAuthStateListener
 
 */
EX_EXPORT_METHOD_AS(addAuthStateListener,
                    addAuthStateListener:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  
  if (![authStateHandlers valueForKey:firApp.name]) {
    FIRAuthStateDidChangeListenerHandle newListenerHandle = [[FIRAuth authWithApp:firApp] addAuthStateDidChangeListener:^(FIRAuth *_Nonnull auth, FIRUser *_Nullable user) {
      if (user != nil) {
        [EXFirebaseAppUtil sendJSEventWithAppName:self.eventEmitter app:firApp name:AUTH_STATE_CHANGED_EVENT body:@{@"user": [self firebaseUserToDict:user]}];
      } else {
        [EXFirebaseAppUtil sendJSEventWithAppName:self.eventEmitter app:firApp name:AUTH_STATE_CHANGED_EVENT body:@{}];
      }
    }];
    
    authStateHandlers[firApp.name] = [NSValue valueWithNonretainedObject:newListenerHandle];
  }
  resolve([NSNull null]);
}

/**
 removeAuthStateListener
 
 */
EX_EXPORT_METHOD_AS(removeAuthStateListener,
                    removeAuthStateListener:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  
  if ([authStateHandlers valueForKey:firApp.name]) {
    [[FIRAuth authWithApp:firApp] removeAuthStateDidChangeListener:[authStateHandlers valueForKey:firApp.name]];
    [authStateHandlers removeObjectForKey:firApp.name];
  }
  resolve([NSNull null]);
}

/**
 addIdTokenListener
 
 */
EX_EXPORT_METHOD_AS(addIdTokenListener,
                    addIdTokenListener:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  
  if (![idTokenHandlers valueForKey:firApp.name]) {
    FIRIDTokenDidChangeListenerHandle newListenerHandle = [[FIRAuth authWithApp:firApp] addIDTokenDidChangeListener:^(FIRAuth * _Nonnull auth, FIRUser * _Nullable user) {
      if (user != nil) {
        [EXFirebaseAppUtil sendJSEventWithAppName:self.eventEmitter app:firApp name:AUTH_ID_TOKEN_CHANGED_EVENT body:@{@"user": [self firebaseUserToDict:user]}];
      } else {
        [EXFirebaseAppUtil sendJSEventWithAppName:self.eventEmitter app:firApp name:AUTH_ID_TOKEN_CHANGED_EVENT body:@{}];
      }
    }];
    
    idTokenHandlers[firApp.name] = [NSValue valueWithNonretainedObject:newListenerHandle];
  }
  resolve([NSNull null]);
}

/**
 removeAuthStateListener
 
 */
EX_EXPORT_METHOD_AS(removeIdTokenListener,
                    removeIdTokenListener:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  
  if ([idTokenHandlers valueForKey:firApp.name]) {
    [[FIRAuth authWithApp:firApp] removeIDTokenDidChangeListener:[idTokenHandlers valueForKey:firApp.name]];
    [idTokenHandlers removeObjectForKey:firApp.name];
  }
  resolve([NSNull null]);
}

/**
 * Flag to determine whether app verification should be disabled for testing or not.
 *
 * @return
 */
EX_EXPORT_METHOD_AS(setAppVerificationDisabledForTesting,
                    setAppVerificationDisabledForTesting:(NSString *)appDisplayName
                    disabled:(NSNumber *)disabled
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [EXFirebaseAuth getAuth:appDisplayName].settings.appVerificationDisabledForTesting = [disabled boolValue];
  resolve([NSNull null]);
}


/**
 signOut
 
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(signOut,
                    signOut:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  if (auth.currentUser) {
    NSError *error;
    [auth signOut:&error];
    if (!error) [self promiseNoUser:resolve rejecter:reject isError:NO];
    else [self promiseRejectAuthException:reject error:error];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}


/**
 signInAnonymously
 
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(signInAnonymously,
                    signInAnonymously:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] signInAnonymouslyWithCompletion:[self getAuthDataResultCallback:resolve rejecter:reject]];
}

/**
 signInWithEmailAndPassword
 
 @param NSString NSString email
 @param NSString NSString password
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(signInWithEmailAndPassword,
                    signInWithEmailAndPassword:(NSString *)appDisplayName
                    email:(NSString *)email
                    pass:(NSString *)password
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] signInWithEmail:email password:password completion:[self getAuthDataResultCallback:resolve rejecter:reject]];
}

/**
 signInWithEmailLink
 
 @param NSString NSString email
 @param NSString NSString emailLink
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(signInWithEmailLink,
                    signInWithEmailLink:(NSString *)appDisplayName
                    email:(NSString *)email
                    emailLink:(NSString *)emailLink
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] signInWithEmail:email link:emailLink completion:[self getAuthDataResultCallback:resolve rejecter:reject]];
}

/**
 createUserWithEmailAndPassword
 
 @param NSString NSString email
 @param NSString NSString password
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(createUserWithEmailAndPassword,
                    createUserWithEmailAndPassword:(NSString *)appDisplayName
                    email:(NSString *)email
                    pass:(NSString *)password
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] createUserWithEmail:email password:password completion:[self getAuthDataResultCallback:resolve rejecter:reject]];
}

/**
 deleteUser
 
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(delete,
                    delete:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  if (auth.currentUser) {
    [auth.currentUser deleteWithCompletion:[self getNoUserProfileChangeCallback:resolve rejecter:reject]];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 reload
 
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(reload,
                    reload:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  if (auth.currentUser) {
    [self reloadAndReturnUser:auth.currentUser resolver:resolve rejecter: reject];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 sendEmailVerification
 
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(sendEmailVerification,
                    sendEmailVerification:(NSString *)appDisplayName
                    actionCodeSettings:(NSDictionary *)actionCodeSettings
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  FIRUser *user = auth.currentUser;
  
  if (user) {
    id handler = ^(NSError *_Nullable error) {
      if (error) {
        [self promiseRejectAuthException:reject error:error];
      } else {
        FIRUser *userAfterUpdate = auth.currentUser;
        [self promiseWithUser:resolve rejecter:reject user:userAfterUpdate];
      }
    };
    if (actionCodeSettings) {
      FIRActionCodeSettings *settings = [self buildActionCodeSettings:actionCodeSettings];
      [user sendEmailVerificationWithActionCodeSettings:settings completion:handler];
    } else {
      [user sendEmailVerificationWithCompletion:handler];
    }
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 updateEmail
 
 @param NSString email
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(updateEmail,
                    updateEmail:(NSString *)appDisplayName
                    email:(NSString *)email
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  if (auth.currentUser) {
    [auth.currentUser updateEmail:email completion:[self getUserProfileChangeCallback:auth resolver:resolve rejecter:reject]];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 updatePassword
 
 @param NSString password
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(updatePassword,
                    updatePassword:(NSString *)appDisplayName
                    password:(NSString *)password
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  if (auth.currentUser) {
    // TODO: Bacon: General completion block
    [auth.currentUser updatePassword:password completion:^(NSError *_Nullable error) {
      if (error) {
        [self promiseRejectAuthException:reject error:error];
      } else {
        FIRUser *userAfterUpdate = auth.currentUser;
        [self promiseWithUser:resolve rejecter:reject user:userAfterUpdate];
      }
    }];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 updatePhoneNumber
 @param NSString password
 @param NSString provider
 @param NSString authToken
 @param NSString authSecret
 @param RCTPromiseResolveBlock resolve
 @param RCTPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(updatePhoneNumber,
                    updatePhoneNumber:(NSString *)appDisplayName
                    provider:(NSString *)provider
                    token:(NSString *)authToken
                    secret:(NSString *)authSecret
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  if (auth.currentUser) {
    FIRPhoneAuthCredential *credential =
    (FIRPhoneAuthCredential *) [self getCredentialForProvider:provider token:authToken secret:authSecret];
    
    if (credential == nil) {
      return reject(@"auth/invalid-credential",
                    @"The supplied auth credential is malformed, has expired or is not currently supported.",
                    nil);
    }
    
    [auth.currentUser updatePhoneNumberCredential:credential completion:^(NSError *_Nullable error) {
      if (error) {
        [self promiseRejectAuthException:reject error:error];
      } else {
        FIRUser *userAfterUpdate = auth.currentUser;
        [self promiseWithUser:resolve rejecter:reject user:userAfterUpdate];
      }
    }];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}


/**
 updateProfile
 
 @param NSDictionary props
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return return
 */
EX_EXPORT_METHOD_AS(updateProfile,
                    updateProfile:(NSString *)appDisplayName
                    props:(NSDictionary *)props
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  
  if (auth.currentUser) {
    FIRUserProfileChangeRequest *changeRequest = [auth.currentUser profileChangeRequest];
    NSMutableArray *allKeys = [[props allKeys] mutableCopy];
    
    for (NSString *key in allKeys) {
      @try {
        if ([key isEqualToString:keyPhotoUrl]) {
          NSURL *url = [NSURL URLWithString:[props valueForKey:key]];
          [changeRequest setValue:url forKey:key];
        } else {
          [changeRequest setValue:props[key] forKey:key];
        }
      } @catch (NSException *exception) {
        NSLog(@"Exception occurred while configuring: %@", exception);
      }
    }
    
    [changeRequest commitChangesWithCompletion:[self getUserProfileChangeCallback:auth resolver:resolve rejecter:reject]];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 getToken
 
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(getToken,
                    getToken:(NSString *)appDisplayName
                    forceRefresh:(NSNumber *)forceRefresh
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRUser *user = [EXFirebaseAuth getAuth:appDisplayName].currentUser;
  
  if (user) {
    [user getIDTokenForcingRefresh:[forceRefresh boolValue] completion:^(NSString *token, NSError *_Nullable error) {
      if (error) {
        [self promiseRejectAuthException:reject error:error];
      } else {
        resolve(token);
      }
    }];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 getIdToken
 @param RCTPromiseResolveBlock resolve
 @param RCTPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(getIdToken,
                    getIdToken:(NSString *)appDisplayName
                    forceRefresh:(NSNumber *)forceRefresh
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRUser *user = [EXFirebaseAuth getAuth:appDisplayName].currentUser;
  
  if (user) {
    [user getIDTokenForcingRefresh:[forceRefresh boolValue] completion:^(NSString *token, NSError *_Nullable error) {
      if (error) {
        [self promiseRejectAuthException:reject error:error];
      } else {
        resolve(token);
      }
    }];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 * getIdTokenResult
 *
 * @param RCTPromiseResolveBlock resolve
 * @param RCTPromiseRejectBlock reject
 * @return
 */
EX_EXPORT_METHOD_AS(getIdTokenResult,
                    getIdTokenResult:(NSString *)appDisplayName
                    forceRefresh:(NSNumber *)forceRefresh
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRUser *user = [EXFirebaseAuth getAuth:appDisplayName].currentUser;
  
  if (user) {
    [user getIDTokenResultForcingRefresh:[forceRefresh boolValue] completion:^(FIRAuthTokenResult *_Nullable tokenResult,
                                                                               NSError *_Nullable error) {
      if (error) {
        [self promiseRejectAuthException:reject error:error];
      } else {
        NSMutableDictionary *tokenResultDict = [NSMutableDictionary dictionary];
        [tokenResultDict setValue:[EXFirebaseAppUtil getISO8601String:tokenResult.authDate] forKey:@"authTime"];
        [tokenResultDict setValue:[EXFirebaseAppUtil getISO8601String:tokenResult.issuedAtDate] forKey:@"issuedAtTime"];
        [tokenResultDict setValue:[EXFirebaseAppUtil getISO8601String:tokenResult.expirationDate] forKey:@"expirationTime"];
        
        [tokenResultDict setValue:tokenResult.token forKey:@"token"];
        [tokenResultDict setValue:tokenResult.claims forKey:@"claims"];
        
        NSString *provider = tokenResult.signInProvider;
        if (!provider) {
          provider = tokenResult.claims[@"firebase"][@"sign_in_provider"];
        }
        
        [tokenResultDict setValue:provider forKey:@"signInProvider"];
        resolve(tokenResultDict);
      }
    }];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 signInWithCredential
 
 @param NSString provider
 @param NSString authToken
 @param NSString authSecret
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(signInWithCredential,
                    signInWithCredential:(NSString *)appDisplayName
                    provider:(NSString *)provider
                    token:(NSString *)authToken
                    secret:(NSString *)authSecret
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuthCredential *credential = [self getCredentialForProvider:provider token:authToken secret:authSecret];
  
  if (credential == nil) {
    return reject(@"auth/invalid-credential",
                  @"The supplied auth credential is malformed, has expired or is not currently supported.",
                  nil);
  }
  
  [[EXFirebaseAuth getAuth:appDisplayName] signInAndRetrieveDataWithCredential:credential completion:[self getAuthDataResultCallback:resolve rejecter:reject]];
}

/**
 confirmPasswordReset
 
 @param NSString code
 @param NSString newPassword
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(confirmPasswordReset,
                    confirmPasswordReset:(NSString *)appDisplayName
                    code:(NSString *)code
                    newPassword:(NSString *)newPassword
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] confirmPasswordResetWithCode:code newPassword:newPassword completion:[self getNoUserProfileChangeCallback:resolve rejecter:reject]];
}


/**
 * applyActionCode
 *
 * @param NSString code
 * @param EXPromiseResolveBlock resolve
 * @param EXPromiseRejectBlock reject
 * @return
 */
EX_EXPORT_METHOD_AS(applyActionCode,
                    applyActionCode:(NSString *)appDisplayName
                    code:(NSString *)code
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] applyActionCode:code completion:[self getNoUserProfileChangeCallback:resolve rejecter:reject]];
}

/**
 * checkActionCode
 *
 * @param NSString code
 * @param EXPromiseResolveBlock resolve
 * @param EXPromiseRejectBlock reject
 * @return
 */
EX_EXPORT_METHOD_AS(checkActionCode,
                    checkActionCode:(NSString *)appDisplayName
                    code:(NSString *)code
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] checkActionCode:code completion:^(FIRActionCodeInfo *_Nullable info,
                                                                             NSError *_Nullable error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      NSString *actionType = @"ERROR";
      switch (info.operation) {
        case FIRActionCodeOperationPasswordReset:actionType = @"PASSWORD_RESET";
          break;
        case FIRActionCodeOperationVerifyEmail:actionType = @"VERIFY_EMAIL";
          break;
        case FIRActionCodeOperationUnknown:actionType = @"UNKNOWN";
          break;
        case FIRActionCodeOperationRecoverEmail:actionType = @"RECOVER_EMAIL";
          break;
        case FIRActionCodeOperationEmailLink:actionType = @"EMAIL_SIGNIN";
          break;
      }
      
      NSMutableDictionary *data = [NSMutableDictionary dictionary];
      
      if ([info dataForKey:FIRActionCodeEmailKey] != nil) {
        [data setValue:[info dataForKey:FIRActionCodeEmailKey] forKey:keyEmail];
      } else {
        [data setValue:[NSNull null] forKey:keyEmail];
      }
      
      if ([info dataForKey:FIRActionCodeFromEmailKey] != nil) {
        [data setValue:[info dataForKey:FIRActionCodeFromEmailKey] forKey:@"fromEmail"];
      } else {
        [data setValue:[NSNull null] forKey:@"fromEmail"];
      }
      
      NSDictionary *result = @{@"data": data, @"operation": actionType};
      
      resolve(result);
    }
  }];
}

/**
 sendPasswordResetEmail
 
 @param NSString email
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(sendPasswordResetEmail,
                    sendPasswordResetEmail:(NSString *)appDisplayName
                    email:(NSString *)email
                    actionCodeSettings:(NSDictionary *)actionCodeSettings
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  
  id handler = [self getNoUserProfileChangeCallback:resolve rejecter:reject];
  
  if (actionCodeSettings) {
    FIRActionCodeSettings *settings = [self buildActionCodeSettings:actionCodeSettings];
    [auth sendPasswordResetWithEmail:email actionCodeSettings:settings completion:handler];
  } else {
    [auth sendPasswordResetWithEmail:email completion:handler];
  }
}

/**
 sendSignInLinkToEmail
 
 @param NSString email
 @param NSDictionary actionCodeSettings
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(sendSignInLinkToEmail,
                    sendSignInLinkToEmail:(NSString *)appDisplayName
                    email:(NSString *)email
                    actionCodeSettings:(NSDictionary *)actionCodeSettings
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRActionCodeSettings *settings = [self buildActionCodeSettings:actionCodeSettings];
  [[EXFirebaseAuth getAuth:appDisplayName] sendSignInLinkToEmail:email actionCodeSettings:settings completion:[self getNoUserProfileChangeCallback:resolve rejecter:reject]];
}

/**
 signInWithCustomToken
 
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(signInWithCustomToken,
                    signInWithCustomToken:(NSString *)appDisplayName
                    customToken:(NSString *)customToken
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] signInWithCustomToken:customToken completion:[self getAuthDataResultCallback:resolve rejecter:reject]];
}

/**
 signInWithPhoneNumber
 
 @param string phoneNumber
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(signInWithPhoneNumber,
                    signInWithPhoneNumber:(NSString *)appDisplayName
                    phoneNumber:(NSString *)phoneNumber
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  // This will only work in Standalone
  [[FIRPhoneAuthProvider providerWithAuth:[EXFirebaseAuth getAuth:appDisplayName]] verifyPhoneNumber:phoneNumber UIDelegate:nil completion:^(
                                                                                                                                             NSString *_Nullable verificationID,
                                                                                                                                             NSError *_Nullable error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
      [defaults setObject:verificationID forKey:@"authVerificationID"];
      resolve(@{
                @"verificationId": verificationID
                });
    }
  }];
}

/**
 verifyPhoneNumber
 
 @param string phoneNumber
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(verifyPhoneNumber,
                    verifyPhoneNumber:(NSString *)appDisplayName
                    phoneNumber:(NSString *)phoneNumber
                    requestKey:(NSString *)requestKey
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  // This will only work in Standalone
  
  [[FIRPhoneAuthProvider providerWithAuth:[FIRAuth authWithApp:firApp]] verifyPhoneNumber:phoneNumber UIDelegate:nil completion:^(
                                                                                                                                  NSString *_Nullable verificationID,
                                                                                                                                  NSError *_Nullable error) {
    if (error) {
      NSDictionary *jsError = [self getJSError:(error)];
      NSDictionary *body = @{
                             @"type": @"onVerificationFailed",
                             @"requestKey": requestKey,
                             @"state": @{@"error": jsError},
                             };
      [EXFirebaseAppUtil sendJSEventWithAppName:self->_eventEmitter app:firApp name:PHONE_AUTH_STATE_CHANGED_EVENT body:body];
    } else {
      NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
      [defaults setObject:verificationID forKey:@"authVerificationID"];
      NSDictionary *body = @{
                             @"type": @"onCodeSent",
                             @"requestKey": requestKey,
                             @"state": @{@"verificationId": verificationID},
                             };
      [EXFirebaseAppUtil sendJSEventWithAppName:self->_eventEmitter app:firApp name:PHONE_AUTH_STATE_CHANGED_EVENT body:body];
    }
  }];
}

EX_EXPORT_METHOD_AS(_confirmVerificationCode,
                    _confirmVerificationCode:(NSString *)appDisplayName
                    verificationCode:(NSString *)verificationCode
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *verificationId = [defaults stringForKey:@"authVerificationID"];
  FIRAuthCredential *credential = [[FIRPhoneAuthProvider provider] credentialWithVerificationID:verificationId verificationCode:verificationCode];
  
  [[EXFirebaseAuth getAuth:appDisplayName] signInAndRetrieveDataWithCredential:credential completion:^(FIRAuthDataResult *authResult, NSError *error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      [self promiseWithUser:resolve rejecter:reject user:authResult.user];
    }
  }];
}

/**
 linkWithCredential
 
 @param NSString provider
 @param NSString authToken
 @param NSString authSecret
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(linkWithCredential,
                    linkWithCredential:(NSString *)appDisplayName
                    provider:(NSString *)provider
                    authToken:(NSString *)authToken
                    authSecret:(NSString *)authSecret
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRUser *user = [EXFirebaseAuth getAuth:appDisplayName].currentUser;
  FIRAuthCredential *credential = [self getCredentialForProvider:provider token:authToken secret:authSecret];
  if (credential == nil) {
    return reject(@"auth/invalid-credential",
                  @"The supplied auth credential is malformed, has expired or is not currently supported.",
                  nil);
  }
  if (user) {
    [user linkAndRetrieveDataWithCredential:credential completion:[self getAuthDataResultCallback:resolve rejecter:reject]];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 unlink
 
 @param NSString provider
 @param NSString authToken
 @param NSString authSecret
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(unlink,
                    unlink:(NSString *)appDisplayName
                    providerId:(NSString *)providerId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuth *auth = [EXFirebaseAuth getAuth:appDisplayName];
  if (auth.currentUser) {
    [auth.currentUser unlinkFromProvider:providerId completion:^(FIRUser *_Nullable _user, NSError *_Nullable error) {
      [self getUserProfileChangeCallback:auth resolver:resolve rejecter:reject](error);
    }];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 reauthenticateWithCredential
 
 @param NSString provider
 @param NSString authToken
 @param NSString authSecret
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(reauthenticateWithCredential,
                    reauthenticateWithCredential:(NSString *)appDisplayName
                    provider:(NSString *)provider
                    authToken:(NSString *)authToken
                    authSecret:(NSString *)authSecret
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRAuthCredential *credential = [self getCredentialForProvider:provider token:authToken secret:authSecret];
  
  if (credential == nil) {
    return reject(@"auth/invalid-credential",
                  @"The supplied auth credential is malformed, has expired or is not currently supported.",
                  nil);
  }
  
  FIRUser *user = [EXFirebaseAuth getAuth:appDisplayName].currentUser;
  
  if (user) {
    [user reauthenticateAndRetrieveDataWithCredential:credential completion:[self getAuthDataResultCallback:resolve rejecter:reject]];
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 fetchSignInMethodsForEmail
 
 @param NSString email
 @param EXPromiseResolveBlock resolve
 @param EXPromiseRejectBlock reject
 @return
 */
EX_EXPORT_METHOD_AS(fetchSignInMethodsForEmail,
                    fetchSignInMethodsForEmail:(NSString *)appDisplayName
                    email:(NSString *)email
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] fetchSignInMethodsForEmail:email completion:^(NSArray<NSString *> *_Nullable providers,
                                                                                         NSError *_Nullable error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else if (!providers) {
      NSMutableArray *emptyResponse = [[NSMutableArray alloc] init];
      resolve(emptyResponse);
    } else {
      resolve(providers);
    }
  }];
}

/**
 getCredentialForProvider
 
 @param provider string
 @param authToken string
 @param authTokenSecret string
 @return FIRAuthCredential
 */
- (FIRAuthCredential *)getCredentialForProvider:(NSString *)provider token:(NSString *)authToken secret:(NSString *)authTokenSecret {
  FIRAuthCredential *credential;
  
  if ([provider compare:@"twitter.com" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [FIRTwitterAuthProvider credentialWithToken:authToken secret:authTokenSecret];
  } else if ([provider compare:@"facebook.com" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [FIRFacebookAuthProvider credentialWithAccessToken:authToken];
  } else if ([provider compare:@"google.com" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [FIRGoogleAuthProvider credentialWithIDToken:authToken accessToken:authTokenSecret];
  } else if ([provider compare:@"password" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [FIREmailAuthProvider credentialWithEmail:authToken password:authTokenSecret];
  } else if ([provider compare:@"emailLink" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [FIREmailAuthProvider credentialWithEmail:authToken link:authTokenSecret];
  } else if ([provider compare:@"github.com" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [FIRGitHubAuthProvider credentialWithToken:authToken];
  } else if ([provider compare:@"phone" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [[FIRPhoneAuthProvider provider] credentialWithVerificationID:authToken verificationCode:authTokenSecret];
  } else if ([provider compare:@"oauth" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    credential = [FIROAuthProvider credentialWithProviderID:@"oauth" IDToken:authToken accessToken:authTokenSecret];
  } else {
    NSLog(@"Provider not yet handled: %@", provider);
  }
  
  return credential;
}

/**
 setLanguageCode
 
 @param NSString code
 @return
 */
EX_EXPORT_METHOD_AS(setLanguageCode,
                    setLanguageCode:(NSString *)appDisplayName
                    code:(NSString *)code
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [EXFirebaseAuth getAuth:appDisplayName].languageCode = code;
  resolve([NSNull null]);
}

/**
 useDeviceLanguage
 
 @param NSString code
 @return
 */
EX_EXPORT_METHOD_AS(useDeviceLanguage,
                    useDeviceLanguage:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] useAppLanguage];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(verifyPasswordResetCode,
                    verifyPasswordResetCode:(NSString *)appDisplayName
                    code:(NSString *)code
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[EXFirebaseAuth getAuth:appDisplayName] verifyPasswordResetCode:code completion:^(NSString * _Nullable email, NSError * _Nullable error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      resolve(email);
    }
  }];
}

// This is here to protect against bugs in the iOS SDK which don't
// correctly refresh the user object when performing certain operations
- (void)reloadAndReturnUser:(FIRUser *)user
                   resolver:(EXPromiseResolveBlock)resolve
                   rejecter:(EXPromiseRejectBlock)reject {
  [user reloadWithCompletion:^(NSError * _Nullable error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      [self promiseWithUser:resolve rejecter:reject user:user];
    }
  }];
}

/**
 Resolve or reject a promise based on isError value
 
 @param resolve EXPromiseResolveBlock
 @param reject EXPromiseRejectBlock
 @param isError BOOL
 */
- (void)promiseNoUser:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject isError:(BOOL)isError {
  if (isError) {
    reject(@"auth/no-current-user", @"No user currently signed in.", nil);
  } else {
    resolve([NSNull null]);
  }
}

/**
 Reject a promise with an auth exception
 
 @param reject EXPromiseRejectBlock
 @param error NSError
 */
- (void)promiseRejectAuthException:(EXPromiseRejectBlock)reject error:(NSError *)error {
  NSDictionary * jsError = [self getJSError:(error)];
  reject([jsError valueForKey:@"code"], [jsError valueForKey:@"message"], error);
}

/**
 Reject a promise with an auth exception
 
 @param error NSError
 */
- (NSDictionary *)getJSError:(NSError *)error {
  NSString *code = AuthErrorCode_toJSErrorCode[error.code];
  NSString *message = [error localizedDescription];
  NSString *nativeErrorMessage = [error localizedDescription];
  
  if (code == nil) code =  @"auth/unknown";
  
  // TODO: Salakar: replace these with a AuthErrorCode_toJSErrorMessage map (like codes now does)
  switch (error.code) {
    case FIRAuthErrorCodeInvalidCustomToken:
      message = @"The custom token format is incorrect. Please check the documentation.";
      break;
    case FIRAuthErrorCodeCustomTokenMismatch:
      message = @"The custom token corresponds to a different audience.";
      break;
    case FIRAuthErrorCodeInvalidCredential:
      message = @"The supplied auth credential is malformed or has expired.";
      break;
    case FIRAuthErrorCodeInvalidEmail:
      message = @"The email address is badly formatted.";
      break;
    case FIRAuthErrorCodeWrongPassword:
      message = @"The password is invalid or the user does not have a password.";
      break;
    case FIRAuthErrorCodeUserMismatch:
      message = @"The supplied credentials do not correspond to the previously signed in user.";
      break;
    case FIRAuthErrorCodeRequiresRecentLogin:
      message =
      @"This operation is sensitive and requires recent authentication. Log in again before retrying this request.";
      break;
    case FIRAuthErrorCodeAccountExistsWithDifferentCredential:
      message =
      @"An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.";
      break;
    case FIRAuthErrorCodeEmailAlreadyInUse:
      message = @"The email address is already in use by another account.";
      break;
    case FIRAuthErrorCodeCredentialAlreadyInUse:
      message = @"This credential is already associated with a different user account.";
      break;
    case FIRAuthErrorCodeUserDisabled:
      message = @"The user account has been disabled by an administrator.";
      break;
    case FIRAuthErrorCodeUserTokenExpired:
      message = @"The user's credential is no longer valid. The user must sign in again.";
      break;
    case FIRAuthErrorCodeUserNotFound:
      message = @"There is no user record corresponding to this identifier. The user may have been deleted.";
      break;
    case FIRAuthErrorCodeInvalidUserToken:
      message = @"The user's credential is no longer valid. The user must sign in again.";
      break;
    case FIRAuthErrorCodeWeakPassword:
      message = @"The given password is invalid.";
      break;
    case FIRAuthErrorCodeOperationNotAllowed:
      message = @"This operation is not allowed. You must enable this service in the console.";
      break;
    case FIRAuthErrorCodeNetworkError:
      message = @"A network error has occurred, please try again.";
      break;
    case FIRAuthErrorCodeInternalError:
      message = @"An internal error has occurred, please try again.";
      break;
    default:
      break;
  }
  
  return @{
           @"code": code,
           @"message": message,
           @"nativeErrorMessage": nativeErrorMessage,
           };
}


/**
 Resolve or reject a promise based on FIRUser value existance
 
 @param resolve EXPromiseResolveBlock
 @param reject EXPromiseRejectBlock
 @param user FIRUser
 */
- (void)promiseWithUser:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject user:(FIRUser *)user {
  if (user) {
    NSDictionary *userDict = [self firebaseUserToDict:user];
    resolve(userDict);
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 Resolve or reject a promise based on FIRAuthResult value existance
 
 @param resolve EXPromiseResolveBlock
 @param reject EXPromiseRejectBlock
 @param authResult FIRAuthDataResult
 */
- (void)promiseWithAuthResult:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject authResult:(FIRAuthDataResult *)authResult {
  if (authResult && authResult.user) {
    NSMutableDictionary *authResultDict = [NSMutableDictionary dictionary];
    
    // additionalUserInfo
    if (authResult.additionalUserInfo) {
      NSMutableDictionary *additionalUserInfo = [NSMutableDictionary dictionary];
      
      // isNewUser
      [additionalUserInfo setValue:@(authResult.additionalUserInfo.isNewUser) forKey:keyNewUser];
      
      // profile
      if (authResult.additionalUserInfo.profile) {
        [additionalUserInfo setValue:authResult.additionalUserInfo.profile forKey:keyProfile];
      } else {
        [additionalUserInfo setValue:[NSNull null] forKey:keyProfile];
      }
      
      // providerId
      if (authResult.additionalUserInfo.providerID) {
        [additionalUserInfo setValue:authResult.additionalUserInfo.providerID forKey:keyProviderId];
      } else {
        [additionalUserInfo setValue:[NSNull null] forKey:keyProviderId];
      }
      
      // username
      if (authResult.additionalUserInfo.username) {
        [additionalUserInfo setValue:authResult.additionalUserInfo.username forKey:keyUsername];
      } else {
        [additionalUserInfo setValue:[NSNull null] forKey:keyUsername];
      }
      
      [authResultDict setValue:additionalUserInfo forKey:keyAdditionalUserInfo];
    } else {
      [authResultDict setValue:[NSNull null] forKey:keyAdditionalUserInfo];
    }
    
    // user
    [authResultDict setValue:[self firebaseUserToDict:authResult.user] forKey:keyUser];
    resolve(authResultDict);
  } else {
    [self promiseNoUser:resolve rejecter:reject isError:YES];
  }
}

/**
 Converts an array of FIRUserInfo instances into the correct format to match the web sdk
 
 @param providerData FIRUser.providerData
 @return NSArray
 */
- (NSArray <NSObject *> *)convertProviderData:(NSArray <id <FIRUserInfo>> *)providerData {
  NSMutableArray *output = [NSMutableArray array];
  
  for (id<FIRUserInfo> userInfo in providerData) {
    NSMutableDictionary *pData = [NSMutableDictionary dictionary];
    
    if (userInfo.providerID != nil) {
      [pData setValue:userInfo.providerID forKey:keyProviderId];
    }
    
    if (userInfo.uid != nil) {
      [pData setValue:userInfo.uid forKey:keyUid];
    }
    
    if (userInfo.displayName != nil) {
      [pData setValue:userInfo.displayName forKey:keyDisplayName];
    }
    
    if (userInfo.photoURL != nil) {
      [pData setValue:[userInfo.photoURL absoluteString] forKey:keyPhotoUrl];
    }
    
    if (userInfo.email != nil) {
      [pData setValue:userInfo.email forKey:keyEmail];
    }
    
    if (userInfo.phoneNumber != nil) {
      [pData setValue:userInfo.phoneNumber forKey:keyPhoneNumber];
    }
    
    [output addObject:pData];
  }
  
  return output;
}

/**
 * React native constant exports - exports native firebase apps mainly
 * @return NSDictionary
 */
- (NSDictionary *)constantsToExport {
  NSDictionary *firApps = [FIRApp allApps];
  NSMutableDictionary *constants = [NSMutableDictionary new];
  NSMutableDictionary *appLanguage = [NSMutableDictionary new];
  NSMutableDictionary *appUser = [NSMutableDictionary new];
  
  for (id key in firApps) {
    FIRApp *firApp = firApps[key];
    NSString *appName = firApp.name;
    FIRUser *user = [FIRAuth authWithApp:firApp].currentUser;
    
    if ([appName isEqualToString:@"__FIRAPP_DEFAULT"]) {
      appName = @"[DEFAULT]";
    }
    
    appLanguage[firApp.name] = [FIRAuth authWithApp:firApp].languageCode;
    
    if (user != nil) {
      appUser[appName] = [self firebaseUserToDict: user];
    }
  }
  
  constants[constAppLanguage] = appLanguage;
  constants[constAppUser] = appUser;
  return constants;
}

/**
 Converts a FIRUser instance into a dictionary to send via RNBridge
 
 @param user FIRUser
 @return NSDictionary
 */
- (NSDictionary *)firebaseUserToDict:(FIRUser *)user {
  return @{
           keyDisplayName: user.displayName ? user.displayName : [NSNull null],
           keyEmail: user.email ? user.email : [NSNull null],
           @"emailVerified": @(user.emailVerified),
           @"isAnonymous": @(user.anonymous),
           @"metadata": @{
               @"creationTime": user.metadata.creationDate ? @(round(
                                                                     [user.metadata.creationDate timeIntervalSince1970] * 1000.0)) : [NSNull null],
               @"lastSignInTime": user.metadata.lastSignInDate ? @(round(
                                                                         [user.metadata.lastSignInDate timeIntervalSince1970] * 1000.0)) : [NSNull null],
               },
           keyPhoneNumber: user.phoneNumber ? user.phoneNumber : [NSNull null],
           keyPhotoUrl: user.photoURL ? [user.photoURL absoluteString] : [NSNull null],
           @"providerData": [self convertProviderData:user.providerData],
           keyProviderId: [user.providerID lowercaseString],
           @"refreshToken": user.refreshToken,
           keyUid: user.uid
           };
}

/**
 * Create a FIRActionCodeSettings instance from JS args
 *
 * @param actionCodeSettings NSDictionary
 * @return FIRActionCodeSettings
 */
- (FIRActionCodeSettings *)buildActionCodeSettings:(NSDictionary *)actionCodeSettings {
  NSString *url = actionCodeSettings[keyUrl];
  NSDictionary *ios = actionCodeSettings[keyIOS];
  NSDictionary *android = actionCodeSettings[keyAndroid];
  BOOL handleCodeInApp = [actionCodeSettings[keyHandleCodeInApp] boolValue];
  
  FIRActionCodeSettings *settings = [[FIRActionCodeSettings alloc] init];
  
  if (android) {
    NSString *packageName = android[keyPackageName];
    NSString *minimumVersion = android[keyMinVersion];
    BOOL installApp = [android[keyInstallApp] boolValue];
    
    [settings setAndroidPackageName:packageName installIfNotAvailable:installApp minimumVersion:minimumVersion];
  }
  
  if (handleCodeInApp) {
    [settings setHandleCodeInApp:handleCodeInApp];
  }
  
  if (ios && ios[keyBundleId]) {
    [settings setIOSBundleID:ios[keyBundleId]];
  }
  
  if (url) {
    [settings setURL:[NSURL URLWithString:url]];
  }
  
  return settings;
}

#pragma mark - EXEventEmitter

- (NSArray<NSString *> *)supportedEvents {
  return @[AUTH_STATE_CHANGED_EVENT, AUTH_ID_TOKEN_CHANGED_EVENT, PHONE_AUTH_STATE_CHANGED_EVENT];
}

- (void)startObserving {
  
}

- (void)stopObserving {
  
}

- (FIRUserProfileChangeCallback)getUserProfileChangeCallback:(FIRAuth *)auth
                                                    resolver:(EXPromiseResolveBlock)resolve
                                                    rejecter:(EXPromiseRejectBlock)reject
{
  return ^(NSError *_Nullable error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      [self reloadAndReturnUser:auth.currentUser resolver:resolve rejecter:reject];
    }
  };
}

- (FIRAuthDataResultCallback)getAuthDataResultCallback:(EXPromiseResolveBlock)resolve
                                              rejecter:(EXPromiseRejectBlock)reject
{
  return ^(FIRAuthDataResult *authResult, NSError *error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      [self promiseWithAuthResult:resolve rejecter:reject authResult:authResult];
    }
  };
}

- (FIRUserProfileChangeCallback)getNoUserProfileChangeCallback:(EXPromiseResolveBlock)resolve
                                                      rejecter:(EXPromiseRejectBlock)reject
{
  return ^(NSError *_Nullable error) {
    if (error) {
      [self promiseRejectAuthException:reject error:error];
    } else {
      [self promiseNoUser:resolve rejecter:reject isError:NO];
    }
  };
}

+ (FIRAuth *)getAuth:(NSString *)appName
{
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appName];
  return [FIRAuth authWithApp:firApp];
}


@end
