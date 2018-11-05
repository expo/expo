//
//  GMSCompatabilityMacros.h
//  Google Maps SDK for iOS
//
//  Copyright 2015 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <Foundation/Foundation.h>

#if defined(SWIFT_SDK_OVERLAY_UIKIT_EPOCH)
#define GMS_SWIFT_NAME_2_0_3_0(name_swift_2, name_swift_3) NS_SWIFT_NAME(name_swift_3)
#else
#define GMS_SWIFT_NAME_2_0_3_0(name_swift_2, name_swift_3) NS_SWIFT_NAME(name_swift_2)
#endif
