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

- (void)testUpdateDeviceToken
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
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_didRegisterForRemoteNotifications:) name:EXAppDidRegisterForRemoteNotificationsNotification object:nil];
    [[EXKernel sharedInstance].serviceRegistry.remoteNotificationManager registerForRemoteNotifications];
    [self waitForExpectations:@[ _expectToRegisterForRemoteNotifications, _expectToPostDeviceToken ] timeout:30.0f];
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
  }
}

@end
