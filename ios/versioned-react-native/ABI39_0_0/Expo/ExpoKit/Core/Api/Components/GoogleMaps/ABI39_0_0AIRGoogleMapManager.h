//
//  ABI39_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS

#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import "ABI39_0_0AIRGoogleMap.h"

@interface ABI39_0_0AIRGoogleMapManager : ABI39_0_0RCTViewManager
@property (nonatomic, assign) ABI39_0_0AIRGoogleMap *map;

@end

#endif
