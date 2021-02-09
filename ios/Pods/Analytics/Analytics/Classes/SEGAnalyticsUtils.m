#import "SEGAnalyticsUtils.h"
#import "SEGAnalytics.h"

static BOOL kAnalyticsLoggerShowLogs = NO;

// Logging

void SEGSetShowDebugLogs(BOOL showDebugLogs)
{
    kAnalyticsLoggerShowLogs = showDebugLogs;
}

void SEGLog(NSString *format, ...)
{
    if (!kAnalyticsLoggerShowLogs)
        return;

    va_list args;
    va_start(args, format);
    NSLogv(format, args);
    va_end(args);
}

