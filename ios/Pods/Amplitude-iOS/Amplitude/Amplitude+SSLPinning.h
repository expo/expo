//
//  Amplitude+SSLPinning
//  Amplitude
//
//  Created by Allan on 3/11/15.
//  Copyright (c) 2015 Amplitude. All rights reserved.
//

@import Foundation;
#import "Amplitude.h"

@interface Amplitude (SSLPinning)

#ifdef AMPLITUDE_SSL_PINNING
@property (nonatomic, assign) BOOL sslPinningEnabled;
#endif

@end
