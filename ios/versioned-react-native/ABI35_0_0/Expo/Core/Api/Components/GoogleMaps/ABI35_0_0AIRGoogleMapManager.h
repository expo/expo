//
//  ABI35_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import "ABI35_0_0AIRGoogleMap.h"

@interface ABI35_0_0AIRGoogleMapManager : ABI35_0_0RCTViewManager
@property (nonatomic, assign) ABI35_0_0AIRGoogleMap *map;

@end

#endif
