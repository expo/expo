//
//  ABI36_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import "ABI36_0_0AIRGoogleMap.h"

@interface ABI36_0_0AIRGoogleMapManager : ABI36_0_0RCTViewManager
@property (nonatomic, assign) ABI36_0_0AIRGoogleMap *map;

@end

#endif
