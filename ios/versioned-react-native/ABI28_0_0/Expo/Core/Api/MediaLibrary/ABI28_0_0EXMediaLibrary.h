//
//  ABI28_0_0EXMediaLibrary.h
//  Exponent
//
//  Created by Tomasz Sapeta on 29.01.2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <Photos/Photos.h>
#import "ABI28_0_0EXScopedEventEmitter.h"

@interface ABI28_0_0EXMediaLibrary : ABI28_0_0EXScopedEventEmitter <PHPhotoLibraryChangeObserver>

@end
