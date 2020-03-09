#import <XCTest/XCTest.h>

#import "EXApiV2Client.h"
#import "EXApiV2Client+EXRemoteNotifications.h"
#import "EXClientTestCase.h"
#import "EXKernel.h"
#import "EXRemoteNotificationManager.h"
#import "ExpoKit.h"

@interface EXApiV2Tests : EXClientTestCase

@property (nonatomic, strong) XCTestExpectation *expectToRegisterForRemoteNotifications;
@property (nonatomic, strong) XCTestExpectation *expectToPostDeviceToken;
@property (nonatomic, strong) XCTestExpectation *expectToFetchExpoPushToken;

@end

@implementation EXApiV2Tests

- (void)tearDown
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)testFetchVersions
{
  XCTestExpectation *expectToFetch = [[XCTestExpectation alloc] initWithDescription:@"Shared apiv2 client should download the versions endpoint"];
  [[EXApiV2Client sharedClient] callRemoteMethod:@"versions"
                                       arguments:nil
                                      httpMethod:@"GET"
                               completionHandler:^(EXApiV2Result * _Nullable response, NSError * _Nullable error) {
                                 XCTAssertNil(error, @"Unexpected error while fetching versions endpoint: %@", error.localizedDescription);
                                 // versions endpoint doesn't conform to `data` response format, so all we can check here is
                                 // whether anything was fetched at all
                                 if (response.httpStatusCode == 200) {
                                   [expectToFetch fulfill];
                                 } else {
                                   XCTAssert(NO, @"EXApiV2Client wasn't able to fetch the versions endpoint");
                                 }
                               }];
  [self waitForExpectations:@[ expectToFetch ] timeout:30.0f];
}

//- (void)testMalformedRequest
//{
//  XCTestExpectation *expectToFail = [[XCTestExpectation alloc] initWithDescription:@"Shared apiv2 client should receive a failed response from a malformed request"];
//  // this endpoint expects an `ids` parameter, omit it on purpose
//  [[EXApiV2Client sharedClient] callRemoteMethod:@"push/getReceipts"
//                                       arguments:nil
//                                      httpMethod:@"GET"
//                               completionHandler:^(EXApiV2Result * _Nullable response, NSError * _Nullable error) {
//                                 XCTAssert(response.httpStatusCode == 400, @"Malformed request expects http 400 response");
//                                 XCTAssertNotNil(response.error, @"Malformed request expects an error");
//                                 [expectToFail fulfill];
//                               }];
//  [self waitForExpectations:@[ expectToFail ] timeout:30.0f];
//}

- (void)testDeviceToken
{
  BOOL isDevice = YES;
#if TARGET_IPHONE_SIMULATOR
  isDevice = NO;
#endif
  if (!isDevice || ![UIApplication sharedApplication].isRegisteredForRemoteNotifications) {
    // don't try to run this if we don't have permission or aren't on a device.
  } else {
    _expectToRegisterForRemoteNotifications = [[XCTestExpectation alloc] initWithDescription:@"App should register for remote notifs"];
    _expectToPostDeviceToken = [[XCTestExpectation alloc] initWithDescription:@"EXApiV2Client should post the apns device token to the Expo server"];
    _expectToFetchExpoPushToken = [[XCTestExpectation alloc] initWithDescription:@"EXApiV2Client should fetch the Expo Push token"];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_didRegisterForRemoteNotifications:) name:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
    [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager registerForRemoteNotifications];
    [self waitForExpectations:@[ _expectToRegisterForRemoteNotifications, _expectToPostDeviceToken, _expectToFetchExpoPushToken ] timeout:30.0f];
  }
}

#pragma mark - notif listeners

- (void)_didRegisterForRemoteNotifications:(NSNotification *)notif
{
  [_expectToRegisterForRemoteNotifications fulfill];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
  NSData *token;
  if (notif.userInfo && notif.userInfo[@"token"]) {
    token = notif.userInfo[@"token"];
    [[EXApiV2Client sharedClient] updateDeviceToken:token completionHandler:^(NSError * _Nullable postError) {
      XCTAssertNil(postError, @"Unexpected error while posting device token: %@", postError.localizedDescription);
      [self->_expectToPostDeviceToken fulfill];
    }];
    [[EXApiV2Client sharedClient] getExpoPushTokenForExperience:@"@exponent/home"
                                                    deviceToken:token
                                              completionHandler:^(NSString * _Nullable expoPushToken, NSError * _Nullable error) {
                                                XCTAssertNil(error, @"Unexpected error while fetching Expo push token: %@", error.localizedDescription);
                                                XCTAssert([expoPushToken isKindOfClass:[NSString class]], @"Expo Push token should be a string");
                                                [self->_expectToFetchExpoPushToken fulfill];
                                              }];
  }
}

@end
