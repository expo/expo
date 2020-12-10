#if (defined(__IPHONE_OS_VERSION_MIN_REQUIRED) && (!defined(__IPHONE_6_0) || __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_6_0)) || \
    (defined(__MAC_OS_X_VERSION_MIN_REQUIRED) && (!defined(__MAC_10_8) || __MAC_OS_X_VERSION_MIN_REQUIRED < __MAC_10_8))
#define PT_DISPATCH_RETAIN_RELEASE 1
#else
#define PT_DISPATCH_RETAIN_RELEASE 0
#endif

#if PT_DISPATCH_RETAIN_RELEASE
#define PT_PRECISE_LIFETIME
#define PT_PRECISE_LIFETIME_UNUSED
#else
#define PT_PRECISE_LIFETIME __attribute__((objc_precise_lifetime))
#define PT_PRECISE_LIFETIME_UNUSED __attribute__((objc_precise_lifetime, unused))
#endif
