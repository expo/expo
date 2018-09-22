//
//  BNCDeviceInfo.h
//  Branch-TestBed
//
//  Created by Sojan P.R. on 3/22/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
@import CoreGraphics;
#else
#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>
#endif

@interface BNCDeviceInfo : NSObject

//---------Properties-------------//
@property (atomic, copy, readonly) NSString *hardwareId;
@property (atomic, copy, readonly) NSString *hardwareIdType;
@property (atomic, readonly) BOOL isRealHardwareId;
@property (atomic, copy, readonly) NSString *vendorId;          //!< VendorId can be nil initially and non-nil later.
@property (atomic, copy, readonly) NSString *brandName;
@property (atomic, copy, readonly) NSString *modelName;
@property (atomic, copy, readonly) NSString *osName;
@property (atomic, copy, readonly) NSString *osVersion;
@property (atomic, copy, readonly) NSNumber *screenWidth;
@property (atomic, copy, readonly) NSNumber *screenHeight;
@property (atomic, readonly) BOOL isAdTrackingEnabled;

@property (atomic, copy, readonly) NSString         *extensionType;
@property (atomic, copy, readonly) NSString         *branchSDKVersion;
@property (atomic, copy, readonly) NSString         *applicationVersion;
@property (atomic, assign, readonly) CGFloat        screenScale;
@property (atomic, copy,   readonly) NSString*      adId;
@property (atomic, assign, readonly) BOOL           unidentifiedDevice;

@property (atomic, copy, readonly) NSString* country;            //!< The iso2 Country name (us, in,etc).
@property (atomic, copy, readonly) NSString* language;           //!< The iso2 language code (en, ml).
@property (atomic, copy, readonly) NSString* browserUserAgent;   //!< Simple user agent string.
@property (atomic, copy, readonly) NSString* localIPAddress;     //!< The current local IP address.
@property (atomic, copy, readonly) NSArray<NSString*> *allIPAddresses; //!< All local IP addresses.
//----------Methods----------------//
+ (BNCDeviceInfo *)getInstance;
+ (NSString*) userAgentString;          // Warning:  Has an implied lock on main thread on first call.
+ (NSString*) systemBuildVersion;

- (NSDictionary*) v2dictionary;
@end
