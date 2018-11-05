//
//  AMPConstants.m

#import "AMPConstants.h"

NSString *const kAMPLibrary = @"amplitude-ios";
NSString *const kAMPVersion = @"3.14.1";
NSString *const kAMPEventLogDomain = @"api.amplitude.com";
NSString *const kAMPEventLogUrl = @"https://api.amplitude.com/";
NSString *const kAMPDefaultInstance = @"$default_instance";
const int kAMPApiVersion = 3;
const int kAMPDBVersion = 3;
const int kAMPDBFirstVersion = 2; // to detect if DB exists yet

// for tvOS, upload events immediately, don't save too many events locally
#if TARGET_OS_TV
const int kAMPEventUploadThreshold = 1;
const int kAMPEventMaxCount = 100;
NSString *const kAMPPlatform = @"tvOS";
NSString *const kAMPOSName = @"tvos";
#else  // iOS
const int kAMPEventUploadThreshold = 30;
const int kAMPEventMaxCount = 1000;
NSString *const kAMPPlatform = @"iOS";
NSString *const kAMPOSName = @"ios";
#endif

const int kAMPEventUploadMaxBatchSize = 100;
const int kAMPEventRemoveBatchSize = 20;
const int kAMPEventUploadPeriodSeconds = 30; // 30s
const long kAMPMinTimeBetweenSessionsMillis = 5 * 60 * 1000; // 5m
const int kAMPMaxStringLength = 1024;
const int kAMPMaxPropertyKeys = 1000;

NSString *const IDENTIFY_EVENT = @"$identify";
NSString *const AMP_OP_ADD = @"$add";
NSString *const AMP_OP_APPEND = @"$append";
NSString *const AMP_OP_CLEAR_ALL = @"$clearAll";
NSString *const AMP_OP_PREPEND = @"$prepend";
NSString *const AMP_OP_SET = @"$set";
NSString *const AMP_OP_SET_ONCE = @"$setOnce";
NSString *const AMP_OP_UNSET = @"$unset";

NSString *const AMP_REVENUE_PRODUCT_ID = @"$productId";
NSString *const AMP_REVENUE_QUANTITY = @"$quantity";
NSString *const AMP_REVENUE_PRICE = @"$price";
NSString *const AMP_REVENUE_REVENUE_TYPE = @"$revenueType";
NSString *const AMP_REVENUE_RECEIPT = @"$receipt";
