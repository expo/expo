//
//  ABI40_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import "ABI40_0_0AIRGoogleMap.h"

@interface ABI40_0_0AIRGoogleMapManager : ABI40_0_0RCTViewManager
@property (nonatomic, assign) ABI40_0_0AIRGoogleMap *map;

@end

#endif
