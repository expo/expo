#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "EXBranchManager.h"
#import "BranchContentMetadata+RNBranch.h"
#import "BranchEvent+RNBranch.h"
#import "BranchLinkProperties+RNBranch.h"
#import "BranchUniversalObject+RNBranch.h"
#import "NSObject+RNBranch.h"
#import "RNBranch.h"
#import "RNBranchAgingDictionary.h"
#import "RNBranchAgingItem.h"
#import "RNBranchConfig.h"
#import "RNBranchEventEmitter.h"
#import "RNBranchProperty.h"

FOUNDATION_EXPORT double EXBranchVersionNumber;
FOUNDATION_EXPORT const unsigned char EXBranchVersionString[];

