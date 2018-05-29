//
//  EXMediaLibrary.h
//  Exponent
//
//  Created by Tomasz Sapeta on 29.01.2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <Photos/Photos.h>
#import "EXScopedEventEmitter.h"

@interface EXMediaLibrary : EXScopedEventEmitter <PHPhotoLibraryChangeObserver>

@end
