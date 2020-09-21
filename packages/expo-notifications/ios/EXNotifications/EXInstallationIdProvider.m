// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXInstallationIdProvider.h>

static NSString * const kEXInstallationIdFileName = @"expo-notifications-installation-id.txt";
static NSUInteger const kEXInstallationIdEncoding = NSUTF8StringEncoding;
static NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";

@implementation EXInstallationIdProvider

UM_EXPORT_MODULE(NotificationsInstallationIdProvider)

UM_EXPORT_METHOD_AS(getInstallationIdAsync, getInstallationIdAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([self getInstallationId]);
}

- (NSString *)getInstallationId
{
  NSString *installationId = [self fetchInstallationId];
  // We have already migrated from NSUserDefaults to local file.
  if (installationId) {
    return installationId;
  }
  
  // Migration section - from NSUserDefaults (legacy storage) to file-based storage
  // which allows us to exclude the installation ID from device backup.
  NSString *legacyInstallationId = [self fetchLegacyInstallationId];
  // If there's a legacy installation ID let's try to move it to new storage.
  if (legacyInstallationId) {
    NSError *error = [self persistInstallationId:legacyInstallationId];
    if (error) {
      NSLog(@"[expo-notifications] Error encountered while trying to persist an installation ID (%@): %@", legacyInstallationId, error.debugDescription);
      NSLog(@"[expo-notifications] Bailing out from removing this legacy notification ID from storage.");
    } else {
      // If there was no error when persisting legacy installation ID in new storage
      // we are safe to clear the legacy storage.
      [self removeLegacyInstallationId];
    }
    return legacyInstallationId;
  }
  
  // There's no installation ID available, neither legacy nor current one.
  installationId = [self generateNewInstallationId];
  NSError *error = [self persistInstallationId:legacyInstallationId];
  if (error) {
    NSLog(@"[expo-notifications] Error encountered while trying to persist an installation ID (%@): %@", installationId, error.debugDescription);
    NSLog(@"[expo-notifications] Installation ID may change.");
  }
  return installationId;
}

- (NSString *)generateNewInstallationId
{
  return [[NSUUID UUID] UUIDString];
}

# pragma mark - Installation ID storage methods

- (NSString *)fetchInstallationId
{
  return [NSString stringWithContentsOfURL:[self installationIdFileUrl] encoding:kEXInstallationIdEncoding error:NULL];
}

- (NSError *)persistInstallationId:(NSString *)installationId
{
  NSError *error = nil;
  [installationId writeToURL:[self installationIdFileUrl] atomically:YES encoding:kEXInstallationIdEncoding error:&error];
  return error;
}

- (NSURL *)installationIdFileUrl
{
  NSString *documentDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  NSURL *installationIdUrl = [NSURL fileURLWithPath:kEXInstallationIdFileName relativeToURL:[NSURL fileURLWithPath:documentDirectory]];
  // YES, exclude the file from backup
  NSError *error;
  [installationIdUrl setResourceValue:@(YES) forKey:NSURLIsExcludedFromBackupKey error:&error];
  if (error) {
    NSLog(@"[expo-notifications] Error encountered while trying to exclude installation ID file from backup: %@", error.debugDescription);
  }
  return installationIdUrl;
}

# pragma mark - Legacy installation ID storage methods

- (NSString *)fetchLegacyInstallationId
{
  return [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallUUIDKey];
}

- (void)removeLegacyInstallationId
{
  [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXDeviceInstallUUIDKey];
}

@end
