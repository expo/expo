//
//  ABI41_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import "ABI41_0_0AIRGoogleMap.h"

@interface ABI41_0_0AIRGoogleMapManager : ABI41_0_0RCTViewManager
@property (nonatomic, assign) ABI41_0_0AIRGoogleMap *map;

@end

#endif
