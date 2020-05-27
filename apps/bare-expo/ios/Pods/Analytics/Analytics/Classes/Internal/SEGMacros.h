//
//  SEGMacros.h
//  Analytics
//
//  Created by Brandon Sneed on 12/20/19.
//  Copyright © 2019 Segment. All rights reserved.
//

#ifndef SEGMacros_h
#define SEGMacros_h

#define __deprecated__(s) __attribute__((deprecated(s)))

#define weakify(var) __weak typeof(var) __weak_##var = var;

#define strongify(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong typeof(var) var = __weak_##var; \
_Pragma("clang diagnostic pop")

#endif /* SEGMacros_h */
