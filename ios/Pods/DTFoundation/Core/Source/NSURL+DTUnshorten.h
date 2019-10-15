//
//  NSURL+DTUnshorten.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 6/2/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/** Method for getting the full length URL for a shortened one. 
 
For example:
 
 NSURL *url = [NSURL URLWithString:@"buff.ly/L4uGoza"];
 
 [url unshortenWithCompletion:^(NSURL *url) {
 NSLog(@"Unshortened: %@", url);
 }];

 */

typedef void (^NSURLUnshortenCompletionHandler)(NSURL *);

@interface NSURL (DTUnshorten)

/**
 Unshortens the receiver and returns the long URL via the completion handler.
 
 Results are cached and therefore a subsequent call for the same receiver will return instantly if the result is still present in the cache.
 @param completion The completion handler
 */
- (void)unshortenWithCompletion:(NSURLUnshortenCompletionHandler)completion;

@end
