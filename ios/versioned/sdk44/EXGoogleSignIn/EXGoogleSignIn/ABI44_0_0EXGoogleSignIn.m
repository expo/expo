// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXGoogleSignIn/ABI44_0_0EXGoogleSignIn.h>
#import <ABI44_0_0EXGoogleSignIn/ABI44_0_0EXAuthTask.h>
#import <ABI44_0_0EXGoogleSignIn/ABI44_0_0EXGoogleSignIn+Serialization.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilitiesInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilities.h>
#import <GoogleSignIn/GIDSignIn.h>

@interface ABI44_0_0EXGoogleSignIn ()

@property (nonatomic, weak) id<ABI44_0_0EXUtilitiesInterface> utilities;
@property (nonatomic, weak) ABI44_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) ABI44_0_0EXAuthTask *authTask;

@end

@implementation ABI44_0_0EXGoogleSignIn

ABI44_0_0EX_EXPORT_MODULE(ExpoGoogleSignIn);

- (instancetype)init
{
  if (self = [super init]) {
    _authTask = [[ABI44_0_0EXAuthTask alloc] init];
    [GIDSignIn sharedInstance].delegate = self;
    [GIDSignIn sharedInstance].shouldFetchBasicProfile = YES;
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXUtilitiesInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"ERRORS": @{
               @"SIGN_IN_CANCELLED": [@(kGIDSignInErrorCodeCanceled) stringValue],
               @"SIGN_IN_REQUIRED": [@(kGIDSignInErrorCodeHasNoAuthInKeychain) stringValue],
               @"TASK_IN_PROGRESS": ABI44_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS,
               @"SIGN_IN_EXCEPTION": ABI44_0_0EX_E_EXCEPTION
               },
           @"TYPES": @{},
           @"SCOPES": @{
               @"PROFILE": @"profile",
               @"EMAIL": @"email",
               @"OPEN_ID": @"openid",
               @"GAMES": @"https://www.googleapis.com/auth/games",
               @"GAMES_LITE": @"https://www.googleapis.com/auth/games_lite",
               @"CLOUD_SAVE": @"https://www.googleapis.com/auth/datastoremobile",
               @"APP_STATE": @"https://www.googleapis.com/auth/appstate",
               @"DRIVE_FILE": @"https://www.googleapis.com/auth/drive.file",
               @"DRIVE_APPFOLDER": @"https://www.googleapis.com/auth/drive.appdata",
               @"DRIVE_FULL": @"https://www.googleapis.com/auth/drive",
               @"DRIVE_APPS": @"https://www.googleapis.com/auth/drive.apps",
               @"CONNECTIONS_READ": @"https://www.googleapis.com/auth/connections.read",
               @"FITNESS_ACTIVITY_READ": @"https://www.googleapis.com/auth/fitness.activity.read",
               @"FITNESS_ACTIVITY_READ_WRITE": @"https://www.googleapis.com/auth/fitness.activity.write",
               @"FITNESS_LOCATION_READ": @"https://www.googleapis.com/auth/fitness.location.read",
               @"FITNESS_LOCATION_READ_WRITE": @"https://www.googleapis.com/auth/fitness.location.write",
               @"FITNESS_BODY_READ": @"https://www.googleapis.com/auth/fitness.body.read",
               @"FITNESS_BODY_READ_WRITE": @"https://www.googleapis.com/auth/fitness.body.write",
               @"FITNESS_NUTRITION_READ": @"https://www.googleapis.com/auth/fitness.nutrition.read",
               @"FITNESS_NUTRITION_READ_WRITE": @"https://www.googleapis.com/auth/fitness.nutrition.write",
               @"FITNESS_BLOOD_PRESSURE_READ": @"https://www.googleapis.com/auth/fitness.blood_pressure.read",
               @"FITNESS_BLOOD_PRESSURE_READ_WRITE": @"https://www.googleapis.com/auth/fitness.blood_pressure.write",
               @"FITNESS_BLOOD_GLUCOSE_READ": @"https://www.googleapis.com/auth/fitness.blood_glucose.read",
               @"FITNESS_BLOOD_GLUCOSE_READ_WRITE": @"https://www.googleapis.com/auth/fitness.blood_glucose.write",
               @"FITNESS_OXYGEN_SATURATION_READ": @"https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
               @"FITNESS_OXYGEN_SATURATION_READ_WRITE": @"https://www.googleapis.com/auth/fitness.oxygen_saturation.write",
               @"FITNESS_BODY_TEMPERATURE_READ": @"https://www.googleapis.com/auth/fitness.body_temperature.read",
               @"FITNESS_BODY_TEMPERATURE_READ_WRITE": @"https://www.googleapis.com/auth/fitness.body_temperature.write",
               @"FITNESS_REPRODUCTIVE_HEALTH_READ": @"https://www.googleapis.com/auth/fitness.reproductive_health.read",
               @"FITNESS_REPRODUCTIVE_HEALTH_READ_WRITE": @"https://www.googleapis.com/auth/fitness.reproductive_health.write",
               @"DISPLAY_ADS": @"https://www.googleapis.com/auth/display_ads",
               @"YOUTUBE_DATA_API": @"https://www.googleapis.com/auth/youtube"
               }
           };
}

- (NSString *)_getNativeClientIdOrReject:(ABI44_0_0EXPromiseRejectBlock)reject
{
  NSString *path = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  
  if (!path) {
    reject(ABI44_0_0EX_E_EXCEPTION, @"Missing GoogleService-Info.plist", nil);
    return nil;
  }
  NSDictionary *plist = [[NSDictionary alloc] initWithContentsOfFile:path];
  NSString *clientId = plist[@"CLIENT_ID"];
  if (clientId != nil && ![clientId isEqualToString:@""]) return clientId;
  reject(ABI44_0_0EX_E_EXCEPTION, @"GoogleService-Info.plist `CLIENT_ID` is invalid", nil);
  return nil;
}

- (void)_configureWithScopes:(NSArray *)scopes
                hostedDomain:(NSString *)hostedDomain
                    serverId:(NSString *)serverClientID
                   loginHint:(NSString *)loginHint
                    language:(NSString *)language
                 openIDRealm:(NSString *)openIDRealm
{
  if (scopes) [GIDSignIn sharedInstance].scopes = scopes;
  if (language) [GIDSignIn sharedInstance].language = language;
  if (openIDRealm) [GIDSignIn sharedInstance].openIDRealm = openIDRealm;
  if (loginHint) [GIDSignIn sharedInstance].loginHint = loginHint;
  if (hostedDomain) [GIDSignIn sharedInstance].hostedDomain = hostedDomain;
  if (serverClientID) [GIDSignIn sharedInstance].serverClientID = serverClientID;
}

ABI44_0_0EX_EXPORT_METHOD_AS(initAsync,
                    initAsync:(NSDictionary *)options
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  NSString *_clientId = options[@"clientId"];
  if (_clientId == nil || [_clientId isEqualToString:@""]) _clientId = [self _getNativeClientIdOrReject:reject];
  if (_clientId == nil) return;
  
  [GIDSignIn sharedInstance].clientID = _clientId;
  [GIDSignIn sharedInstance].presentingViewController = _utilities.currentViewController;
  
  [self _configureWithScopes:options[@"scopes"]
                hostedDomain:options[@"hostedDomain"]
                    serverId:options[@"webClientId"]
                   loginHint:options[@"accountName"]
                    language:options[@"language"]
                 openIDRealm:options[@"openIdRealm"]];
  resolve([NSNull null]);
}

ABI44_0_0EX_EXPORT_METHOD_AS(signInSilentlyAsync,
                    signInSilentlyAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  if ([self.authTask update:@"signInSilentlyAsync" resolver:resolve rejecter:reject])
    [[GIDSignIn sharedInstance] restorePreviousSignIn];
}

ABI44_0_0EX_EXPORT_METHOD_AS(signInAsync,
                    signInAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  if ([self.authTask update:@"signInAsync" resolver:resolve rejecter:reject])
    [[GIDSignIn sharedInstance] signIn];
}

ABI44_0_0EX_EXPORT_METHOD_AS(signOutAsync,
                    signOutAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  [[GIDSignIn sharedInstance] signOut];
  resolve([NSNull null]);
}

ABI44_0_0EX_EXPORT_METHOD_AS(disconnectAsync,
                    disconnectAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  if ([self.authTask update:@"disconnectAsync" resolver:resolve rejecter:reject])
    [[GIDSignIn sharedInstance] disconnect];
}

ABI44_0_0EX_EXPORT_METHOD_AS(isConnectedAsync,
                    isConnectedAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([[GIDSignIn sharedInstance] hasPreviousSignIn]));
}

ABI44_0_0EX_EXPORT_METHOD_AS(getCurrentUserAsync,
                    getCurrentUserAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  GIDGoogleUser *currentUser = [GIDSignIn sharedInstance].currentUser;
  resolve(ABI44_0_0EXNullIfNil([ABI44_0_0EXGoogleSignIn jsonFromGIDGoogleUser:currentUser]));
}

ABI44_0_0EX_EXPORT_METHOD_AS(getPhotoAsync,
                    getPhotoAsync:(NSNumber *)size
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  GIDGoogleUser *currentUser = [GIDSignIn sharedInstance].currentUser;
  if (currentUser == nil || currentUser.profile.hasImage == NO) {
    resolve([NSNull null]);
    return;
  }
  NSURL *imageURL = [currentUser.profile imageURLWithDimension:[size unsignedIntegerValue]];
  if (imageURL) {
    resolve([imageURL absoluteString]);
    return;
  }
}

ABI44_0_0EX_EXPORT_METHOD_AS(getTokensAsync,
                    getTokensAsync:(NSNumber *)shouldRefresh
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  GIDGoogleUser *currentUser = [GIDSignIn sharedInstance].currentUser;
  if (currentUser == nil) {
    reject(ABI44_0_0EX_E_EXCEPTION, @"getTokens requires a user to be signed in", nil);
    return;
  }

  GIDAuthenticationHandler handler = ^void(GIDAuthentication *authentication, NSError *error) {
    if (error) {
      reject(ABI44_0_0EX_E_EXCEPTION, error.localizedDescription, nil);
    } else {
      resolve(@{
                @"idToken" : authentication.idToken,
                @"accessToken" : authentication.accessToken,
                });
    }
  };
  
  GIDAuthentication *auth = currentUser.authentication;
  if ([shouldRefresh boolValue] == YES) {
    [auth refreshTokensWithHandler:handler];
  } else {
    [auth getTokensWithHandler:handler];
  }
}

- (void)signIn:(GIDSignIn *)signIn didSignInForUser:(GIDGoogleUser *)user withError:(NSError *)error {
  [self.authTask parse:[ABI44_0_0EXGoogleSignIn jsonFromGIDGoogleUser:user] error:error];
}

- (void)signIn:(GIDSignIn *)signIn didDisconnectWithUser:(GIDGoogleUser *)user withError:(NSError *)error {
  [self.authTask parse:[ABI44_0_0EXGoogleSignIn jsonFromGIDGoogleUser:user] error:error];
}

@end
