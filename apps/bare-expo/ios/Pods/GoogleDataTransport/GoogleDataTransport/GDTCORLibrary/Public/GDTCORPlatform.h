/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

#if !TARGET_OS_WATCH
#import <SystemConfiguration/SystemConfiguration.h>
#endif

#if TARGET_OS_IOS || TARGET_OS_TV
#import <UIKit/UIKit.h>
#elif TARGET_OS_OSX
#import <AppKit/AppKit.h>
#elif TARGET_OS_WATCH
#import <WatchKit/WatchKit.h>
#endif  // TARGET_OS_IOS || TARGET_OS_TV

#if TARGET_OS_IOS
#import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif

NS_ASSUME_NONNULL_BEGIN

/** The GoogleDataTransport library version. */
FOUNDATION_EXPORT NSString *const kGDTCORVersion;

/** A notification sent out if the app is backgrounding. */
FOUNDATION_EXPORT NSString *const kGDTCORApplicationDidEnterBackgroundNotification;

/** A notification sent out if the app is foregrounding. */
FOUNDATION_EXPORT NSString *const kGDTCORApplicationWillEnterForegroundNotification;

/** A notification sent out if the app is terminating. */
FOUNDATION_EXPORT NSString *const kGDTCORApplicationWillTerminateNotification;

/** The different possible network connection type. */
typedef NS_ENUM(NSInteger, GDTCORNetworkType) {
  GDTCORNetworkTypeUNKNOWN = 0,
  GDTCORNetworkTypeWIFI = 1,
  GDTCORNetworkTypeMobile = 2,
};

/** The different possible network connection mobile subtype. */
typedef NS_ENUM(NSInteger, GDTCORNetworkMobileSubtype) {
  GDTCORNetworkMobileSubtypeUNKNOWN = 0,
  GDTCORNetworkMobileSubtypeGPRS = 1,
  GDTCORNetworkMobileSubtypeEdge = 2,
  GDTCORNetworkMobileSubtypeWCDMA = 3,
  GDTCORNetworkMobileSubtypeHSDPA = 4,
  GDTCORNetworkMobileSubtypeHSUPA = 5,
  GDTCORNetworkMobileSubtypeCDMA1x = 6,
  GDTCORNetworkMobileSubtypeCDMAEVDORev0 = 7,
  GDTCORNetworkMobileSubtypeCDMAEVDORevA = 8,
  GDTCORNetworkMobileSubtypeCDMAEVDORevB = 9,
  GDTCORNetworkMobileSubtypeHRPD = 10,
  GDTCORNetworkMobileSubtypeLTE = 11,
};

#if !TARGET_OS_WATCH
/** Define SCNetworkReachabilityFlags as GDTCORNetworkReachabilityFlags on non-watchOS. */
typedef SCNetworkReachabilityFlags GDTCORNetworkReachabilityFlags;

/** Define SCNetworkReachabilityRef as GDTCORNetworkReachabilityRef on non-watchOS. */
typedef SCNetworkReachabilityRef GDTCORNetworkReachabilityRef;

#else
/** The different possible reachabilityFlags option on watchOS. */
typedef NS_OPTIONS(uint32_t, GDTCORNetworkReachabilityFlags) {
  kGDTCORNetworkReachabilityFlagsReachable = 1 << 1,
  // TODO(doudounan): Add more options on watchOS if watchOS network connection information relative
  // APIs available in the future.
};

/** Define a struct as GDTCORNetworkReachabilityRef on watchOS to store network connection
 * information. */
typedef struct {
  // TODO(doudounan): Store network connection information on watchOS if watchOS network connection
  // information relative APIs available in the future.
} GDTCORNetworkReachabilityRef;
#endif

/** Returns a URL to the root directory under which all GDT-associated data must be saved.
 *
 * @return A URL to the root directory under which all GDT-associated data must be saved.
 */
NSURL *GDTCORRootDirectory(void);

/** Compares flags with the reachable flag (on non-watchos with both reachable and
 * connectionRequired flags), if available, and returns YES if network reachable.
 *
 * @param flags The set of reachability flags.
 * @return YES if the network is reachable, NO otherwise.
 */
BOOL GDTCORReachabilityFlagsReachable(GDTCORNetworkReachabilityFlags flags);

/** Compares flags with the WWAN reachability flag, if available, and returns YES if present.
 *
 * @param flags The set of reachability flags.
 * @return YES if the WWAN flag is set, NO otherwise.
 */
BOOL GDTCORReachabilityFlagsContainWWAN(GDTCORNetworkReachabilityFlags flags);

/** Generates an enum message GDTCORNetworkType representing network connection type.
 *
 * @return A GDTCORNetworkType representing network connection type.
 */
GDTCORNetworkType GDTCORNetworkTypeMessage(void);

/** Generates an enum message GDTCORNetworkMobileSubtype representing network connection mobile
 * subtype.
 *
 * @return A GDTCORNetworkMobileSubtype representing network connection mobile subtype.
 */
GDTCORNetworkMobileSubtype GDTCORNetworkMobileSubTypeMessage(void);

/** Writes the given object to the given fileURL and populates the given error if it fails.
 *
 * @param obj The object to encode.
 * @param filePath The path to write the object to. Can be nil if you just need the data.
 * @param error The error to populate if something goes wrong.
 * @return The data of the archive. If error is nil, it's been written to disk.
 */
NSData *_Nullable GDTCOREncodeArchive(id<NSSecureCoding> obj,
                                      NSString *_Nullable filePath,
                                      NSError *_Nullable *error);

/** Decodes an object of the given class from the given archive path or data and populates the given
 * error if it fails.
 *
 * @param archiveClass The class of the archive's root object.
 * @param archivePath The path to the archived data. Don't use with the archiveData param.
 * @param archiveData The data to decode. Don't use with the archivePath param.
 * @param error The error to populate if something goes wrong.
 */
id<NSSecureCoding> _Nullable GDTCORDecodeArchive(Class archiveClass,
                                                 NSString *_Nullable archivePath,
                                                 NSData *_Nullable archiveData,
                                                 NSError *_Nullable *error);

/** A typedef identify background identifiers. */
typedef volatile NSUInteger GDTCORBackgroundIdentifier;

/** A background task's invalid sentinel value. */
FOUNDATION_EXPORT const GDTCORBackgroundIdentifier GDTCORBackgroundIdentifierInvalid;

#if TARGET_OS_IOS || TARGET_OS_TV
/** A protocol that wraps UIApplicationDelegate, WKExtensionDelegate or NSObject protocol, depending
 * on the platform.
 */
@protocol GDTCORApplicationDelegate <UIApplicationDelegate>
#elif TARGET_OS_OSX
@protocol GDTCORApplicationDelegate <NSApplicationDelegate>
#elif TARGET_OS_WATCH
@protocol GDTCORApplicationDelegate <WKExtensionDelegate>
#else
@protocol GDTCORApplicationDelegate <NSObject>
#endif  // TARGET_OS_IOS || TARGET_OS_TV

@end

/** A cross-platform application class. */
@interface GDTCORApplication : NSObject <GDTCORApplicationDelegate>

/** Flag to determine if the application is running in the background. */
@property(atomic, readonly) BOOL isRunningInBackground;

/** Creates and/or returns the shared application instance.
 *
 * @return The shared application instance.
 */
+ (nullable GDTCORApplication *)sharedApplication;

/** Creates a background task with the returned identifier if on a suitable platform.
 *
 * @name name The name of the task, useful for debugging which background tasks are running.
 * @param handler The handler block that is called if the background task expires.
 * @return An identifier for the background task, or GDTCORBackgroundIdentifierInvalid if one
 * couldn't be created.
 */
- (GDTCORBackgroundIdentifier)beginBackgroundTaskWithName:(NSString *)name
                                        expirationHandler:(void (^__nullable)(void))handler;

/** Ends the background task if the identifier is valid.
 *
 * @param bgID The background task to end.
 */
- (void)endBackgroundTask:(GDTCORBackgroundIdentifier)bgID;

@end

NS_ASSUME_NONNULL_END
