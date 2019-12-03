//
//  GADMediationAdSize.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google. All rights reserved.
//

#import <GoogleMobileAds/GoogleMobileAds.h>

/// Returns the closest valid ad size from possibleAdSizes as compared to |original|. The selected
/// size must be smaller than or equal in size to the original. The selected size must also be
/// within a configurable fraction of the width and height of the original. If no valid size exists,
/// returns kGADAdSizeInvalid.
GAD_EXTERN GADAdSize GADClosestValidSizeForAdSizes(GADAdSize original,
                                                   NSArray<NSValue *> *_Nonnull possibleAdSizes);
