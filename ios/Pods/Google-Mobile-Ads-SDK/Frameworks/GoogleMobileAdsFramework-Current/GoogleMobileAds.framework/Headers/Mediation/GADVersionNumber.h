//
//  GADVersionNumber.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

/// Version number information.
typedef struct {
  NSInteger majorVersion;  ///< Major version.
  NSInteger minorVersion;  ///< Minor version.
  NSInteger patchVersion;  ///< Patch version.
} GADVersionNumber;
