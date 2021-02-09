//
//  GADMediaAspectRatio.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

/// Media aspect ratio.
typedef NS_ENUM(NSInteger, GADMediaAspectRatio) {
  /// Unknown media aspect ratio.
  GADMediaAspectRatioUnknown = 0,
  /// Any media aspect ratio.
  GADMediaAspectRatioAny = 1,
  /// Landscape media aspect ratio.
  GADMediaAspectRatioLandscape = 2,
  /// Portrait media aspect ratio.
  GADMediaAspectRatioPortrait = 3,
  /// Close to square media aspect ratio. This is not a strict 1:1 aspect ratio.
  GADMediaAspectRatioSquare = 4
};
