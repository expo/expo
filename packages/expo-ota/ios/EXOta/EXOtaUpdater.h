//
//  EXOtaUpdater.h
//  EXOta
//
//  Created by Michał Czernek on 05/09/2019.
//

#ifndef EXOtaUpdater_h
#define EXOtaUpdater_h

#import <Foundation/Foundation.h>

@interface EXOtaUpdater: NSObject

- (void)downloadManifest:(NSURL *)url;

@end

#endif /* EXOtaUpdater_h */
