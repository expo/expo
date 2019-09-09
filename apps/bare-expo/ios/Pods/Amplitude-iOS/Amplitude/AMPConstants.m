//
//  AMPConstants.m

#import "AMPConstants.h"

NSString *const kAMPLibrary = @"amplitude-ios";
NSString *const kAMPVersion = @"4.7.1";
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
NSString *const GROUP_IDENTIFY_EVENT = @"$groupidentify";
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

NSString *const AMP_TRACKING_OPTION_CARRIER = @"carrier";
NSString *const AMP_TRACKING_OPTION_CITY = @"city";
NSString *const AMP_TRACKING_OPTION_COUNTRY = @"country";
NSString *const AMP_TRACKING_OPTION_DEVICE_MANUFACTURER = @"device_manufacturer";
NSString *const AMP_TRACKING_OPTION_DEVICE_MODEL = @"device_model";
NSString *const AMP_TRACKING_OPTION_DMA = @"dma";
NSString *const AMP_TRACKING_OPTION_IDFA = @"idfa";
NSString *const AMP_TRACKING_OPTION_IDFV = @"idfv";
NSString *const AMP_TRACKING_OPTION_IP_ADDRESS = @"ip_address";
NSString *const AMP_TRACKING_OPTION_LANGUAGE = @"language";
NSString *const AMP_TRACKING_OPTION_LAT_LNG = @"lat_lng";
NSString *const AMP_TRACKING_OPTION_OS_NAME = @"os_name";
NSString *const AMP_TRACKING_OPTION_OS_VERSION = @"os_version";
NSString *const AMP_TRACKING_OPTION_PLATFORM = @"platform";
NSString *const AMP_TRACKING_OPTION_REGION = @"region";
NSString *const AMP_TRACKING_OPTION_VERSION_NAME = @"version_name";
