//
//  ABI42_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS

#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import "ABI42_0_0AIRGoogleMap.h"

@interface ABI42_0_0AIRGoogleMapManager : ABI42_0_0RCTViewManager
@property (nonatomic, assign) ABI42_0_0AIRGoogleMap *map;

@end

#endif
