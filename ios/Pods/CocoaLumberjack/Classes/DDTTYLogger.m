// Software License Agreement (BSD License)
//
// Copyright (c) 2010-2019, Deusty, LLC
// All rights reserved.
//
// Redistribution and use of this software in source and binary forms,
// with or without modification, are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
//
// * Neither the name of Deusty nor the names of its contributors may be used
//   to endorse or promote products derived from this software without specific
//   prior written permission of Deusty, LLC.

#import "DDTTYLogger.h"

#import <sys/uio.h>

#if !__has_feature(objc_arc)
#error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
#endif

// We probably shouldn't be using DDLog() statements within the DDLog implementation.
// But we still want to leave our log statements for any future debugging,
// and to allow other developers to trace the implementation (which is a great learning tool).
//
// So we use primitive logging macros around NSLog.
// We maintain the NS prefix on the macros to be explicit about the fact that we're using NSLog.

#ifndef DD_NSLOG_LEVEL
    #define DD_NSLOG_LEVEL 2
#endif

#define NSLogError(frmt, ...)    do{ if(DD_NSLOG_LEVEL >= 1) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogWarn(frmt, ...)     do{ if(DD_NSLOG_LEVEL >= 2) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogInfo(frmt, ...)     do{ if(DD_NSLOG_LEVEL >= 3) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogDebug(frmt, ...)    do{ if(DD_NSLOG_LEVEL >= 4) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogVerbose(frmt, ...)  do{ if(DD_NSLOG_LEVEL >= 5) NSLog((frmt), ##__VA_ARGS__); } while(0)

// Xcode does NOT natively support colors in the Xcode debugging console.
// You'll need to install the XcodeColors plugin to see colors in the Xcode console.
// https://github.com/robbiehanson/XcodeColors
//
// The following is documentation from the XcodeColors project:
//
//
// How to apply color formatting to your log statements:
//
// To set the foreground color:
// Insert the ESCAPE_SEQ into your string, followed by "fg124,12,255;" where r=124, g=12, b=255.
//
// To set the background color:
// Insert the ESCAPE_SEQ into your string, followed by "bg12,24,36;" where r=12, g=24, b=36.
//
// To reset the foreground color (to default value):
// Insert the ESCAPE_SEQ into your string, followed by "fg;"
//
// To reset the background color (to default value):
// Insert the ESCAPE_SEQ into your string, followed by "bg;"
//
// To reset the foreground and background color (to default values) in one operation:
// Insert the ESCAPE_SEQ into your string, followed by ";"

#define XCODE_COLORS_ESCAPE_SEQ "\033["

#define XCODE_COLORS_RESET_FG   XCODE_COLORS_ESCAPE_SEQ "fg;" // Clear any foreground color
#define XCODE_COLORS_RESET_BG   XCODE_COLORS_ESCAPE_SEQ "bg;" // Clear any background color
#define XCODE_COLORS_RESET      XCODE_COLORS_ESCAPE_SEQ ";"  // Clear any foreground or background color

// If running in a shell, not all RGB colors will be supported.
// In this case we automatically map to the closest available color.
// In order to provide this mapping, we have a hard-coded set of the standard RGB values available in the shell.
// However, not every shell is the same, and Apple likes to think different even when it comes to shell colors.
//
// Map to standard Terminal.app colors (1), or
// map to standard xterm colors (0).

#define MAP_TO_TERMINAL_APP_COLORS 1

typedef struct {
  uint8_t r;
  uint8_t g;
  uint8_t b;
} DDRGBColor;

@interface DDTTYLoggerColorProfile : NSObject {
    @public
    DDLogFlag mask;
    NSInteger context;

    uint8_t fg_r;
    uint8_t fg_g;
    uint8_t fg_b;

    uint8_t bg_r;
    uint8_t bg_g;
    uint8_t bg_b;

    NSUInteger fgCodeIndex;
    NSString *fgCodeRaw;

    NSUInteger bgCodeIndex;
    NSString *bgCodeRaw;

    char fgCode[24];
    size_t fgCodeLen;

    char bgCode[24];
    size_t bgCodeLen;

    char resetCode[8];
    size_t resetCodeLen;
}

- (instancetype)initWithForegroundColor:(DDColor *)fgColor backgroundColor:(DDColor *)bgColor flag:(DDLogFlag)mask context:(NSInteger)ctxt;

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface DDTTYLogger () {
    NSString *_appName;
    char *_app;
    size_t _appLen;
    
    NSString *_processID;
    char *_pid;
    size_t _pidLen;
    
    BOOL _colorsEnabled;
    NSMutableArray *_colorProfilesArray;
    NSMutableDictionary *_colorProfilesDict;
}

@end


@implementation DDTTYLogger

static BOOL isaColorTTY;
static BOOL isaColor256TTY;
static BOOL isaXcodeColorTTY;

static NSArray *codes_fg = nil;
static NSArray *codes_bg = nil;
static NSArray *colors   = nil;

static DDTTYLogger *sharedInstance;

/**
 * Initializes the colors array, as well as the codes_fg and codes_bg arrays, for 16 color mode.
 *
 * This method is used when the application is running from within a shell that only supports 16 color mode.
 * This method is not invoked if the application is running within Xcode, or via normal UI app launch.
 **/
+ (void)initialize_colors_16 {
    if (codes_fg || codes_bg || colors) {
        return;
    }

    NSMutableArray *m_colors   = [NSMutableArray arrayWithCapacity:16];

    // In a standard shell only 16 colors are supported.
    //
    // More information about ansi escape codes can be found online.
    // http://en.wikipedia.org/wiki/ANSI_escape_code
    codes_fg = @[
        @"30m",  // normal - black
        @"31m",  // normal - red
        @"32m",  // normal - green
        @"33m",  // normal - yellow
        @"34m",  // normal - blue
        @"35m",  // normal - magenta
        @"36m",  // normal - cyan
        @"37m",  // normal - gray
        @"1;30m",  // bright - darkgray
        @"1;31m",  // bright - red
        @"1;32m",  // bright - green
        @"1;33m",  // bright - yellow
        @"1;34m",  // bright - blue
        @"1;35m",  // bright - magenta
        @"1;36m",  // bright - cyan
        @"1;37m",  // bright - white
    ];

    codes_bg = @[
        @"40m",  // normal - black
        @"41m",  // normal - red
        @"42m",  // normal - green
        @"43m",  // normal - yellow
        @"44m",  // normal - blue
        @"45m",  // normal - magenta
        @"46m",  // normal - cyan
        @"47m",  // normal - gray
        @"1;40m",  // bright - darkgray
        @"1;41m",  // bright - red
        @"1;42m",  // bright - green
        @"1;43m",  // bright - yellow
        @"1;44m",  // bright - blue
        @"1;45m",  // bright - magenta
        @"1;46m",  // bright - cyan
        @"1;47m",  // bright - white
    ];


#if MAP_TO_TERMINAL_APP_COLORS

    // Standard Terminal.app colors:
    //
    // These are the default colors used by Apple's Terminal.app.
    DDRGBColor rgbColors[] = {
        {  0,   0,   0}, // normal - black
        {194,  54,  33}, // normal - red
        { 37, 188,  36}, // normal - green
        {173, 173,  39}, // normal - yellow
        { 73,  46, 225}, // normal - blue
        {211,  56, 211}, // normal - magenta
        { 51, 187, 200}, // normal - cyan
        {203, 204, 205}, // normal - gray
        {129, 131, 131}, // bright - darkgray
        {252,  57,  31}, // bright - red
        { 49, 231,  34}, // bright - green
        {234, 236,  35}, // bright - yellow
        { 88,  51, 255}, // bright - blue
        {249,  53, 248}, // bright - magenta
        { 20, 240, 240}, // bright - cyan
        {233, 235, 235}, // bright - white
    };

#else /* if MAP_TO_TERMINAL_APP_COLORS */

    // Standard xterm colors:
    //
    // These are the default colors used by most xterm shells.

    DDRGBColor rgbColors[] = {
        {  0,   0,   0}, // normal - black
        {205,   0,   0}, // normal - red
        {  0, 205,   0}, // normal - green
        {205, 205,   0}, // normal - yellow
        {  0,   0, 238}, // normal - blue
        {205,   0, 205}, // normal - magenta
        {  0, 205, 205}, // normal - cyan
        {229, 229, 229}, // normal - gray
        {127, 127, 127}, // bright - darkgray
        {255,   0,   0}, // bright - red
        {  0, 255,   0}, // bright - green
        {255, 255,   0}, // bright - yellow
        { 92,  92, 255}, // bright - blue
        {255,   0, 255}, // bright - magenta
        {  0, 255, 255}, // bright - cyan
        {255, 255, 255}, // bright - white
    };
#endif /* if MAP_TO_TERMINAL_APP_COLORS */

    for (size_t i = 0; i < sizeof(rgbColors) / sizeof(rgbColors[0]); ++i) {
        [m_colors addObject:DDMakeColor(rgbColors[i].r, rgbColors[i].g, rgbColors[i].b)];
    }
    colors   = [m_colors   copy];

    NSAssert([codes_fg count] == [codes_bg count], @"Invalid colors/codes array(s)");
    NSAssert([codes_fg count] == [colors count],   @"Invalid colors/codes array(s)");
}

/**
 * Initializes the colors array, as well as the codes_fg and codes_bg arrays, for 256 color mode.
 *
 * This method is used when the application is running from within a shell that supports 256 color mode.
 * This method is not invoked if the application is running within Xcode, or via normal UI app launch.
 **/
+ (void)initialize_colors_256 {
    if (codes_fg || codes_bg || colors) {
        return;
    }

    NSMutableArray *m_codes_fg = [NSMutableArray arrayWithCapacity:(256 - 16)];
    NSMutableArray *m_codes_bg = [NSMutableArray arrayWithCapacity:(256 - 16)];
    NSMutableArray *m_colors   = [NSMutableArray arrayWithCapacity:(256 - 16)];

    #if MAP_TO_TERMINAL_APP_COLORS

    // Standard Terminal.app colors:
    //
    // These are the colors the Terminal.app uses in xterm-256color mode.
    // In this mode, the terminal supports 256 different colors, specified by 256 color codes.
    //
    // The first 16 color codes map to the original 16 color codes supported by the earlier xterm-color mode.
    // These are actually configurable, and thus we ignore them for the purposes of mapping,
    // as we can't rely on them being constant. They are largely duplicated anyway.
    //
    // The next 216 color codes are designed to run the spectrum, with several shades of every color.
    // While the color codes are standardized, the actual RGB values for each color code is not.
    // Apple's Terminal.app uses different RGB values from that of a standard xterm.
    // Apple's choices in colors are designed to be a little nicer on the eyes.
    //
    // The last 24 color codes represent a grayscale.
    //
    // Unfortunately, unlike the standard xterm color chart,
    // Apple's RGB values cannot be calculated using a simple formula (at least not that I know of).
    // Also, I don't know of any ways to programmatically query the shell for the RGB values.
    // So this big giant color chart had to be made by hand.
    //
    // More information about ansi escape codes can be found online.
    // http://en.wikipedia.org/wiki/ANSI_escape_code

    // Colors
    DDRGBColor rgbColors[] = {
        { 47,  49,  49},
        { 60,  42, 144},
        { 66,  44, 183},
        { 73,  46, 222},
        { 81,  50, 253},
        { 88,  51, 255},

        { 42, 128,  37},
        { 42, 127, 128},
        { 44, 126, 169},
        { 56, 125, 209},
        { 59, 124, 245},
        { 66, 123, 255},

        { 51, 163,  41},
        { 39, 162, 121},
        { 42, 161, 162},
        { 53, 160, 202},
        { 45, 159, 240},
        { 58, 158, 255},

        { 31, 196,  37},
        { 48, 196, 115},
        { 39, 195, 155},
        { 49, 195, 195},
        { 32, 194, 235},
        { 53, 193, 255},

        { 50, 229,  35},
        { 40, 229, 109},
        { 27, 229, 149},
        { 49, 228, 189},
        { 33, 228, 228},
        { 53, 227, 255},

        { 27, 254,  30},
        { 30, 254, 103},
        { 45, 254, 143},
        { 38, 253, 182},
        { 38, 253, 222},
        { 42, 253, 252},

        {140,  48,  40},
        {136,  51, 136},
        {135,  52, 177},
        {134,  52, 217},
        {135,  56, 248},
        {134,  53, 255},

        {125, 125,  38},
        {124, 125, 125},
        {122, 124, 166},
        {123, 124, 207},
        {123, 122, 247},
        {124, 121, 255},

        {119, 160,  35},
        {117, 160, 120},
        {117, 160, 160},
        {115, 159, 201},
        {116, 158, 240},
        {117, 157, 255},

        {113, 195,  39},
        {110, 194, 114},
        {111, 194, 154},
        {108, 194, 194},
        {109, 193, 234},
        {108, 192, 255},

        {105, 228,  30},
        {103, 228, 109},
        {105, 228, 148},
        {100, 227, 188},
        { 99, 227, 227},
        { 99, 226, 253},

        { 92, 253,  34},
        { 96, 253, 103},
        { 97, 253, 142},
        { 88, 253, 182},
        { 93, 253, 221},
        { 88, 254, 251},

        {177,  53,  34},
        {174,  54, 131},
        {172,  55, 172},
        {171,  57, 213},
        {170,  55, 249},
        {170,  57, 255},

        {165, 123,  37},
        {163, 123, 123},
        {162, 123, 164},
        {161, 122, 205},
        {161, 121, 241},
        {161, 121, 255},

        {158, 159,  33},
        {157, 158, 118},
        {157, 158, 159},
        {155, 157, 199},
        {155, 157, 239},
        {154, 156, 255},

        {152, 193,  40},
        {151, 193, 113},
        {150, 193, 153},
        {150, 192, 193},
        {148, 192, 232},
        {149, 191, 253},

        {146, 227,  28},
        {144, 227, 108},
        {144, 227, 147},
        {144, 227, 187},
        {142, 226, 227},
        {142, 225, 252},

        {138, 253,  36},
        {137, 253, 102},
        {136, 253, 141},
        {138, 254, 181},
        {135, 255, 220},
        {133, 255, 250},

        {214,  57,  30},
        {211,  59, 126},
        {209,  57, 168},
        {208,  55, 208},
        {207,  58, 247},
        {206,  61, 255},

        {204, 121,  32},
        {202, 121, 121},
        {201, 121, 161},
        {200, 120, 202},
        {200, 120, 241},
        {198, 119, 255},

        {198, 157,  37},
        {196, 157, 116},
        {195, 156, 157},
        {195, 156, 197},
        {194, 155, 236},
        {193, 155, 255},

        {191, 192,  36},
        {190, 191, 112},
        {189, 191, 152},
        {189, 191, 191},
        {188, 190, 230},
        {187, 190, 253},

        {185, 226,  28},
        {184, 226, 106},
        {183, 225, 146},
        {183, 225, 186},
        {182, 225, 225},
        {181, 224, 252},

        {178, 255,  35},
        {178, 255, 101},
        {177, 254, 141},
        {176, 254, 180},
        {176, 254, 220},
        {175, 253, 249},

        {247,  56,  30},
        {245,  57, 122},
        {243,  59, 163},
        {244,  60, 204},
        {242,  59, 241},
        {240,  55, 255},

        {241, 119,  36},
        {240, 120, 118},
        {238, 119, 158},
        {237, 119, 199},
        {237, 118, 238},
        {236, 118, 255},

        {235, 154,  36},
        {235, 154, 114},
        {234, 154, 154},
        {232, 154, 194},
        {232, 153, 234},
        {232, 153, 255},

        {230, 190,  30},
        {229, 189, 110},
        {228, 189, 150},
        {227, 189, 190},
        {227, 189, 229},
        {226, 188, 255},

        {224, 224,  35},
        {223, 224, 105},
        {222, 224, 144},
        {222, 223, 184},
        {222, 223, 224},
        {220, 223, 253},

        {217, 253,  28},
        {217, 253,  99},
        {216, 252, 139},
        {216, 252, 179},
        {215, 252, 218},
        {215, 251, 250},

        {255,  61,  30},
        {255,  60, 118},
        {255,  58, 159},
        {255,  56, 199},
        {255,  55, 238},
        {255,  59, 255},

        {255, 117,  29},
        {255, 117, 115},
        {255, 117, 155},
        {255, 117, 195},
        {255, 116, 235},
        {254, 116, 255},

        {255, 152,  27},
        {255, 152, 111},
        {254, 152, 152},
        {255, 152, 192},
        {254, 151, 231},
        {253, 151, 253},

        {255, 187,  33},
        {253, 187, 107},
        {252, 187, 148},
        {253, 187, 187},
        {254, 187, 227},
        {252, 186, 252},

        {252, 222,  34},
        {251, 222, 103},
        {251, 222, 143},
        {250, 222, 182},
        {251, 221, 222},
        {252, 221, 252},

        {251, 252,  15},
        {251, 252,  97},
        {249, 252, 137},
        {247, 252, 177},
        {247, 253, 217},
        {254, 255, 255},

        // Grayscale

        { 52,  53,  53},
        { 57,  58,  59},
        { 66,  67,  67},
        { 75,  76,  76},
        { 83,  85,  85},
        { 92,  93,  94},

        {101, 102, 102},
        {109, 111, 111},
        {118, 119, 119},
        {126, 127, 128},
        {134, 136, 136},
        {143, 144, 145},

        {151, 152, 153},
        {159, 161, 161},
        {167, 169, 169},
        {176, 177, 177},
        {184, 185, 186},
        {192, 193, 194},

        {200, 201, 202},
        {208, 209, 210},
        {216, 218, 218},
        {224, 226, 226},
        {232, 234, 234},
        {240, 242, 242},
    };

    for (size_t i = 0; i < sizeof(rgbColors) / sizeof(rgbColors[0]); ++i) {
        [m_colors addObject:DDMakeColor(rgbColors[i].r, rgbColors[i].g, rgbColors[i].b)];
    }

    // Color codes

    int index = 16;

    while (index < 256) {
        [m_codes_fg addObject:[NSString stringWithFormat:@"38;5;%dm", index]];
        [m_codes_bg addObject:[NSString stringWithFormat:@"48;5;%dm", index]];

        index++;
    }

    #else /* if MAP_TO_TERMINAL_APP_COLORS */

    // Standard xterm colors:
    //
    // These are the colors xterm shells use in xterm-256color mode.
    // In this mode, the shell supports 256 different colors, specified by 256 color codes.
    //
    // The first 16 color codes map to the original 16 color codes supported by the earlier xterm-color mode.
    // These are generally configurable, and thus we ignore them for the purposes of mapping,
    // as we can't rely on them being constant. They are largely duplicated anyway.
    //
    // The next 216 color codes are designed to run the spectrum, with several shades of every color.
    // The last 24 color codes represent a grayscale.
    //
    // While the color codes are standardized, the actual RGB values for each color code is not.
    // However most standard xterms follow a well known color chart,
    // which can easily be calculated using the simple formula below.
    //
    // More information about ansi escape codes can be found online.
    // http://en.wikipedia.org/wiki/ANSI_escape_code

    int index = 16;

    int r; // red
    int g; // green
    int b; // blue

    int ri; // r increment
    int gi; // g increment
    int bi; // b increment

    // Calculate xterm colors (using standard algorithm)

    int r = 0;
    int g = 0;
    int b = 0;

    for (ri = 0; ri < 6; ri++) {
        r = (ri == 0) ? 0 : 95 + (40 * (ri - 1));

        for (gi = 0; gi < 6; gi++) {
            g = (gi == 0) ? 0 : 95 + (40 * (gi - 1));

            for (bi = 0; bi < 6; bi++) {
                b = (bi == 0) ? 0 : 95 + (40 * (bi - 1));

                [m_codes_fg addObject:[NSString stringWithFormat:@"38;5;%dm", index]];
                [m_codes_bg addObject:[NSString stringWithFormat:@"48;5;%dm", index]];
                [m_colors addObject:DDMakeColor(r, g, b)];

                index++;
            }
        }
    }

    // Calculate xterm grayscale (using standard algorithm)

    r = 8;
    g = 8;
    b = 8;

    while (index < 256) {
        [m_codes_fg addObject:[NSString stringWithFormat:@"38;5;%dm", index]];
        [m_codes_bg addObject:[NSString stringWithFormat:@"48;5;%dm", index]];
        [m_colors addObject:DDMakeColor(r, g, b)];

        r += 10;
        g += 10;
        b += 10;

        index++;
    }

    #endif /* if MAP_TO_TERMINAL_APP_COLORS */

    codes_fg = [m_codes_fg copy];
    codes_bg = [m_codes_bg copy];
    colors   = [m_colors   copy];

    NSAssert([codes_fg count] == [codes_bg count], @"Invalid colors/codes array(s)");
    NSAssert([codes_fg count] == [colors count],   @"Invalid colors/codes array(s)");
}

+ (void)getRed:(CGFloat *)rPtr green:(CGFloat *)gPtr blue:(CGFloat *)bPtr fromColor:(DDColor *)color {
    #if TARGET_OS_IPHONE

    // iOS

    BOOL done = NO;

    if ([color respondsToSelector:@selector(getRed:green:blue:alpha:)]) {
        done = [color getRed:rPtr green:gPtr blue:bPtr alpha:NULL];
    }

    if (!done) {
        // The method getRed:green:blue:alpha: was only available starting iOS 5.
        // So in iOS 4 and earlier, we have to jump through hoops.

        CGColorSpaceRef rgbColorSpace = CGColorSpaceCreateDeviceRGB();

        unsigned char pixel[4];
        CGContextRef context = CGBitmapContextCreate(&pixel, 1, 1, 8, 4, rgbColorSpace, (CGBitmapInfo)(kCGBitmapAlphaInfoMask & kCGImageAlphaNoneSkipLast));

        CGContextSetFillColorWithColor(context, [color CGColor]);
        CGContextFillRect(context, CGRectMake(0, 0, 1, 1));

        if (rPtr) {
            *rPtr = pixel[0] / 255.0f;
        }

        if (gPtr) {
            *gPtr = pixel[1] / 255.0f;
        }

        if (bPtr) {
            *bPtr = pixel[2] / 255.0f;
        }

        CGContextRelease(context);
        CGColorSpaceRelease(rgbColorSpace);
    }

    #elif defined(DD_CLI) || !__has_include(<AppKit/NSColor.h>)

    // OS X without AppKit

    [color getRed:rPtr green:gPtr blue:bPtr alpha:NULL];

    #else /* if TARGET_OS_IPHONE */

    // OS X with AppKit

    NSColor *safeColor = [color colorUsingColorSpaceName:NSCalibratedRGBColorSpace];

    [safeColor getRed:rPtr green:gPtr blue:bPtr alpha:NULL];
    #endif /* if TARGET_OS_IPHONE */
}

/**
 * Maps the given color to the closest available color supported by the shell.
 * The shell may support 256 colors, or only 16.
 *
 * This method loops through the known supported color set, and calculates the closest color.
 * The array index of that color, within the colors array, is then returned.
 * This array index may also be used as the index within the codes_fg and codes_bg arrays.
 **/
+ (NSUInteger)codeIndexForColor:(DDColor *)inColor {
    CGFloat inR, inG, inB;

    [self getRed:&inR green:&inG blue:&inB fromColor:inColor];

    NSUInteger bestIndex = 0;
    CGFloat lowestDistance = 100.0f;

    NSUInteger i = 0;

    for (DDColor *color in colors) {
        // Calculate Euclidean distance (lower value means closer to given color)

        CGFloat r, g, b;
        [self getRed:&r green:&g blue:&b fromColor:color];

    #if CGFLOAT_IS_DOUBLE
        CGFloat distance = sqrt(pow(r - inR, 2.0) + pow(g - inG, 2.0) + pow(b - inB, 2.0));
    #else
        CGFloat distance = sqrtf(powf(r - inR, 2.0f) + powf(g - inG, 2.0f) + powf(b - inB, 2.0f));
    #endif

        NSLogVerbose(@"DDTTYLogger: %3lu : %.3f,%.3f,%.3f & %.3f,%.3f,%.3f = %.6f",
                     (unsigned long)i, inR, inG, inB, r, g, b, distance);

        if (distance < lowestDistance) {
            bestIndex = i;
            lowestDistance = distance;

            NSLogVerbose(@"DDTTYLogger: New best index = %lu", (unsigned long)bestIndex);
        }

        i++;
    }

    return bestIndex;
}

+ (instancetype)sharedInstance {
    static dispatch_once_t DDTTYLoggerOnceToken;

    dispatch_once(&DDTTYLoggerOnceToken, ^{
        // Xcode does NOT natively support colors in the Xcode debugging console.
        // You'll need to install the XcodeColors plugin to see colors in the Xcode console.
        //
        // PS - Please read the header file before diving into the source code.

        char *xcode_colors = getenv("XcodeColors");
        char *term = getenv("TERM");

        if (xcode_colors && (strcmp(xcode_colors, "YES") == 0)) {
            isaXcodeColorTTY = YES;
        } else if (term) {
            if (strcasestr(term, "color") != NULL) {
                isaColorTTY = YES;
                isaColor256TTY = (strcasestr(term, "256") != NULL);

                if (isaColor256TTY) {
                    [self initialize_colors_256];
                } else {
                    [self initialize_colors_16];
                }
            }
        }

        NSLogInfo(@"DDTTYLogger: isaColorTTY = %@", (isaColorTTY ? @"YES" : @"NO"));
        NSLogInfo(@"DDTTYLogger: isaColor256TTY: %@", (isaColor256TTY ? @"YES" : @"NO"));
        NSLogInfo(@"DDTTYLogger: isaXcodeColorTTY: %@", (isaXcodeColorTTY ? @"YES" : @"NO"));

        sharedInstance = [[[self class] alloc] init];
    });

    return sharedInstance;
}

- (instancetype)init {
    if (sharedInstance != nil) {
        return nil;
    }

    if ((self = [super init])) {
        // Initialize 'app' variable (char *)

        _appName = [[NSProcessInfo processInfo] processName];

        _appLen = [_appName lengthOfBytesUsingEncoding:NSUTF8StringEncoding];

        if (_appLen == 0) {
            _appName = @"<UnnamedApp>";
            _appLen = [_appName lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
        }

        _app = (char *)calloc(_appLen + 1, sizeof(char));

        if (_app == NULL) {
            return nil;
        }

        BOOL processedAppName = [_appName getCString:_app maxLength:(_appLen + 1) encoding:NSUTF8StringEncoding];

        if (NO == processedAppName) {
            free(_app);
            return nil;
        }

        // Initialize 'pid' variable (char *)

        _processID = [NSString stringWithFormat:@"%i", (int)getpid()];

        _pidLen = [_processID lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
        _pid = (char *)calloc(_pidLen + 1, sizeof(char));

        if (_pid == NULL) {
            free(_app);
            return nil;
        }

        BOOL processedID = [_processID getCString:_pid maxLength:(_pidLen + 1) encoding:NSUTF8StringEncoding];

        if (NO == processedID) {
            free(_app);
            free(_pid);
            return nil;
        }

        // Initialize color stuff

        _colorsEnabled = NO;
        _colorProfilesArray = [[NSMutableArray alloc] initWithCapacity:8];
        _colorProfilesDict = [[NSMutableDictionary alloc] initWithCapacity:8];

        _automaticallyAppendNewlineForCustomFormatters = YES;
    }

    return self;
}

- (void)loadDefaultColorProfiles {
    [self setForegroundColor:DDMakeColor(214,  57,  30) backgroundColor:nil forFlag:DDLogFlagError];
    [self setForegroundColor:DDMakeColor(204, 121,  32) backgroundColor:nil forFlag:DDLogFlagWarning];
}

- (BOOL)colorsEnabled {
    // The design of this method is taken from the DDAbstractLogger implementation.
    // For extensive documentation please refer to the DDAbstractLogger implementation.

    // Note: The internal implementation MUST access the colorsEnabled variable directly,
    // This method is designed explicitly for external access.
    //
    // Using "self." syntax to go through this method will cause immediate deadlock.
    // This is the intended result. Fix it by accessing the ivar directly.
    // Great strides have been take to ensure this is safe to do. Plus it's MUCH faster.

    NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");
    NSAssert(![self isOnInternalLoggerQueue], @"MUST access ivar directly, NOT via self.* syntax.");

    dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];

    __block BOOL result;

    dispatch_sync(globalLoggingQueue, ^{
        dispatch_sync(self.loggerQueue, ^{
            result = self->_colorsEnabled;
        });
    });

    return result;
}

- (void)setColorsEnabled:(BOOL)newColorsEnabled {
    dispatch_block_t block = ^{
        @autoreleasepool {
            self->_colorsEnabled = newColorsEnabled;

            if ([self->_colorProfilesArray count] == 0) {
                [self loadDefaultColorProfiles];
            }
        }
    };

    // The design of this method is taken from the DDAbstractLogger implementation.
    // For extensive documentation please refer to the DDAbstractLogger implementation.

    // Note: The internal implementation MUST access the colorsEnabled variable directly,
    // This method is designed explicitly for external access.
    //
    // Using "self." syntax to go through this method will cause immediate deadlock.
    // This is the intended result. Fix it by accessing the ivar directly.
    // Great strides have been take to ensure this is safe to do. Plus it's MUCH faster.

    NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");
    NSAssert(![self isOnInternalLoggerQueue], @"MUST access ivar directly, NOT via self.* syntax.");

    dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];

    dispatch_async(globalLoggingQueue, ^{
        dispatch_async(self.loggerQueue, block);
    });
}

- (void)setForegroundColor:(DDColor *)txtColor backgroundColor:(DDColor *)bgColor forFlag:(DDLogFlag)mask {
    [self setForegroundColor:txtColor backgroundColor:bgColor forFlag:mask context:LOG_CONTEXT_ALL];
}

- (void)setForegroundColor:(DDColor *)txtColor backgroundColor:(DDColor *)bgColor forFlag:(DDLogFlag)mask context:(NSInteger)ctxt {
    dispatch_block_t block = ^{
        @autoreleasepool {
            DDTTYLoggerColorProfile *newColorProfile =
                [[DDTTYLoggerColorProfile alloc] initWithForegroundColor:txtColor
                                                         backgroundColor:bgColor
                                                                    flag:mask
                                                                 context:ctxt];

            NSLogInfo(@"DDTTYLogger: newColorProfile: %@", newColorProfile);

            NSUInteger i = 0;

            for (DDTTYLoggerColorProfile *colorProfile in self->_colorProfilesArray) {
                if ((colorProfile->mask == mask) && (colorProfile->context == ctxt)) {
                    break;
                }

                i++;
            }

            if (i < [self->_colorProfilesArray count]) {
                self->_colorProfilesArray[i] = newColorProfile;
            } else {
                [self->_colorProfilesArray addObject:newColorProfile];
            }
        }
    };

    // The design of the setter logic below is taken from the DDAbstractLogger implementation.
    // For documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)setForegroundColor:(DDColor *)txtColor backgroundColor:(DDColor *)bgColor forTag:(id <NSCopying>)tag {
    NSAssert([(id < NSObject >) tag conformsToProtocol: @protocol(NSCopying)], @"Invalid tag");

    dispatch_block_t block = ^{
        @autoreleasepool {
            DDTTYLoggerColorProfile *newColorProfile =
                [[DDTTYLoggerColorProfile alloc] initWithForegroundColor:txtColor
                                                         backgroundColor:bgColor
                                                                    flag:(DDLogFlag)0
                                                                 context:0];

            NSLogInfo(@"DDTTYLogger: newColorProfile: %@", newColorProfile);

            self->_colorProfilesDict[tag] = newColorProfile;
        }
    };

    // The design of the setter logic below is taken from the DDAbstractLogger implementation.
    // For documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)clearColorsForFlag:(DDLogFlag)mask {
    [self clearColorsForFlag:mask context:0];
}

- (void)clearColorsForFlag:(DDLogFlag)mask context:(NSInteger)context {
    dispatch_block_t block = ^{
        @autoreleasepool {
            NSUInteger i = 0;

            for (DDTTYLoggerColorProfile *colorProfile in self->_colorProfilesArray) {
                if ((colorProfile->mask == mask) && (colorProfile->context == context)) {
                    break;
                }

                i++;
            }

            if (i < [self->_colorProfilesArray count]) {
                [self->_colorProfilesArray removeObjectAtIndex:i];
            }
        }
    };

    // The design of the setter logic below is taken from the DDAbstractLogger implementation.
    // For documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)clearColorsForTag:(id <NSCopying>)tag {
    NSAssert([(id < NSObject >) tag conformsToProtocol: @protocol(NSCopying)], @"Invalid tag");

    dispatch_block_t block = ^{
        @autoreleasepool {
            [self->_colorProfilesDict removeObjectForKey:tag];
        }
    };

    // The design of the setter logic below is taken from the DDAbstractLogger implementation.
    // For documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)clearColorsForAllFlags {
    dispatch_block_t block = ^{
        @autoreleasepool {
            [self->_colorProfilesArray removeAllObjects];
        }
    };

    // The design of the setter logic below is taken from the DDAbstractLogger implementation.
    // For documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)clearColorsForAllTags {
    dispatch_block_t block = ^{
        @autoreleasepool {
            [self->_colorProfilesDict removeAllObjects];
        }
    };

    // The design of the setter logic below is taken from the DDAbstractLogger implementation.
    // For documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)clearAllColors {
    dispatch_block_t block = ^{
        @autoreleasepool {
            [self->_colorProfilesArray removeAllObjects];
            [self->_colorProfilesDict removeAllObjects];
        }
    };

    // The design of the setter logic below is taken from the DDAbstractLogger implementation.
    // For documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)logMessage:(DDLogMessage *)logMessage {
    NSString *logMsg = logMessage->_message;
    BOOL isFormatted = NO;

    if (_logFormatter) {
        logMsg = [_logFormatter formatLogMessage:logMessage];
        isFormatted = logMsg != logMessage->_message;
    }

    if (logMsg) {
        // Search for a color profile associated with the log message

        DDTTYLoggerColorProfile *colorProfile = nil;

        if (_colorsEnabled) {
            if (logMessage->_tag) {
                colorProfile = _colorProfilesDict[logMessage->_tag];
            }

            if (colorProfile == nil) {
                for (DDTTYLoggerColorProfile *cp in _colorProfilesArray) {
                    if (logMessage->_flag & cp->mask) {
                        // Color profile set for this context?
                        if (logMessage->_context == cp->context) {
                            colorProfile = cp;

                            // Stop searching
                            break;
                        }

                        // Check if LOG_CONTEXT_ALL was specified as a default color for this flag
                        if (cp->context == LOG_CONTEXT_ALL) {
                            colorProfile = cp;

                            // We don't break to keep searching for more specific color profiles for the context
                        }
                    }
                }
            }
        }

        // Convert log message to C string.
        //
        // We use the stack instead of the heap for speed if possible.
        // But we're extra cautious to avoid a stack overflow.

        NSUInteger msgLen = [logMsg lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
        const BOOL useStack = msgLen < (1024 * 4);

        char msgStack[useStack ? (msgLen + 1) : 1]; // Analyzer doesn't like zero-size array, hence the 1
        char *msg = useStack ? msgStack : (char *)calloc(msgLen + 1, sizeof(char));

        if (msg == NULL) {
            return;
        }

        BOOL logMsgEnc = [logMsg getCString:msg maxLength:(msgLen + 1) encoding:NSUTF8StringEncoding];

        if (!logMsgEnc) {
            if (!useStack && msg != NULL) {
                free(msg);
            }

            return;
        }

        // Write the log message to STDERR

        if (isFormatted) {
            // The log message has already been formatted.
            int iovec_len = (_automaticallyAppendNewlineForCustomFormatters) ? 5 : 4;
            struct iovec v[iovec_len];

            if (colorProfile) {
                v[0].iov_base = colorProfile->fgCode;
                v[0].iov_len = colorProfile->fgCodeLen;

                v[1].iov_base = colorProfile->bgCode;
                v[1].iov_len = colorProfile->bgCodeLen;

                v[iovec_len - 1].iov_base = colorProfile->resetCode;
                v[iovec_len - 1].iov_len = colorProfile->resetCodeLen;
            } else {
                v[0].iov_base = "";
                v[0].iov_len = 0;

                v[1].iov_base = "";
                v[1].iov_len = 0;

                v[iovec_len - 1].iov_base = "";
                v[iovec_len - 1].iov_len = 0;
            }

            v[2].iov_base = (char *)msg;
            v[2].iov_len = msgLen;

            if (iovec_len == 5) {
                v[3].iov_base = "\n";
                v[3].iov_len = (msg[msgLen] == '\n') ? 0 : 1;
            }

            writev(STDERR_FILENO, v, iovec_len);
        } else {
            // The log message is unformatted, so apply standard NSLog style formatting.

            int len;
            char ts[24] = "";
            size_t tsLen = 0;

            // Calculate timestamp.
            // The technique below is faster than using NSDateFormatter.
            if (logMessage->_timestamp) {
                NSTimeInterval epoch = [logMessage->_timestamp timeIntervalSince1970];
                struct tm tm;
                time_t time = (time_t)epoch;
                (void)localtime_r(&time, &tm);
                int milliseconds = (int)((epoch - floor(epoch)) * 1000.0);

                len = snprintf(ts, 24, "%04d-%02d-%02d %02d:%02d:%02d:%03d", // yyyy-MM-dd HH:mm:ss:SSS
                               tm.tm_year + 1900,
                               tm.tm_mon + 1,
                               tm.tm_mday,
                               tm.tm_hour,
                               tm.tm_min,
                               tm.tm_sec, milliseconds);

                tsLen = (NSUInteger)MAX(MIN(24 - 1, len), 0);
            }

            // Calculate thread ID
            //
            // How many characters do we need for the thread id?
            // logMessage->machThreadID is of type mach_port_t, which is an unsigned int.
            //
            // 1 hex char = 4 bits
            // 8 hex chars for 32 bit, plus ending '\0' = 9

            char tid[9];
            len = snprintf(tid, 9, "%s", [logMessage->_threadID cStringUsingEncoding:NSUTF8StringEncoding]);

            size_t tidLen = (NSUInteger)MAX(MIN(9 - 1, len), 0);

            // Here is our format: "%s %s[%i:%s] %s", timestamp, appName, processID, threadID, logMsg

            struct iovec v[13];

            if (colorProfile) {
                v[0].iov_base = colorProfile->fgCode;
                v[0].iov_len = colorProfile->fgCodeLen;

                v[1].iov_base = colorProfile->bgCode;
                v[1].iov_len = colorProfile->bgCodeLen;

                v[12].iov_base = colorProfile->resetCode;
                v[12].iov_len = colorProfile->resetCodeLen;
            } else {
                v[0].iov_base = "";
                v[0].iov_len = 0;

                v[1].iov_base = "";
                v[1].iov_len = 0;

                v[12].iov_base = "";
                v[12].iov_len = 0;
            }

            v[2].iov_base = ts;
            v[2].iov_len = tsLen;

            v[3].iov_base = " ";
            v[3].iov_len = 1;

            v[4].iov_base = _app;
            v[4].iov_len = _appLen;

            v[5].iov_base = "[";
            v[5].iov_len = 1;

            v[6].iov_base = _pid;
            v[6].iov_len = _pidLen;

            v[7].iov_base = ":";
            v[7].iov_len = 1;

            v[8].iov_base = tid;
            v[8].iov_len = MIN((size_t)8, tidLen); // snprintf doesn't return what you might think

            v[9].iov_base = "] ";
            v[9].iov_len = 2;

            v[10].iov_base = (char *)msg;
            v[10].iov_len = msgLen;

            v[11].iov_base = "\n";
            v[11].iov_len = (msg[msgLen] == '\n') ? 0 : 1;

            writev(STDERR_FILENO, v, 13);
        }

        if (!useStack) {
            free(msg);
        }
    }
}

- (DDLoggerName)loggerName {
    return DDLoggerNameTTY;
}

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@implementation DDTTYLoggerColorProfile

- (instancetype)initWithForegroundColor:(DDColor *)fgColor backgroundColor:(DDColor *)bgColor flag:(DDLogFlag)aMask context:(NSInteger)ctxt {
    if ((self = [super init])) {
        mask = aMask;
        context = ctxt;

        CGFloat r, g, b;

        if (fgColor) {
            [DDTTYLogger getRed:&r green:&g blue:&b fromColor:fgColor];

            fg_r = (uint8_t)(r * 255.0f);
            fg_g = (uint8_t)(g * 255.0f);
            fg_b = (uint8_t)(b * 255.0f);
        }

        if (bgColor) {
            [DDTTYLogger getRed:&r green:&g blue:&b fromColor:bgColor];

            bg_r = (uint8_t)(r * 255.0f);
            bg_g = (uint8_t)(g * 255.0f);
            bg_b = (uint8_t)(b * 255.0f);
        }

        if (fgColor && isaColorTTY) {
            // Map foreground color to closest available shell color

            fgCodeIndex = [DDTTYLogger codeIndexForColor:fgColor];
            fgCodeRaw   = codes_fg[fgCodeIndex];

            NSString *escapeSeq = @"\033[";

            NSUInteger len1 = [escapeSeq lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
            NSUInteger len2 = [fgCodeRaw lengthOfBytesUsingEncoding:NSUTF8StringEncoding];

            BOOL escapeSeqEnc = [escapeSeq getCString:(fgCode)      maxLength:(len1 + 1) encoding:NSUTF8StringEncoding];
            BOOL fgCodeRawEsc = [fgCodeRaw getCString:(fgCode + len1) maxLength:(len2 + 1) encoding:NSUTF8StringEncoding];

            if (!escapeSeqEnc || !fgCodeRawEsc) {
                return nil;
            }

            fgCodeLen = len1 + len2;
        } else if (fgColor && isaXcodeColorTTY) {
            // Convert foreground color to color code sequence

            const char *escapeSeq = XCODE_COLORS_ESCAPE_SEQ;

            int result = snprintf(fgCode, 24, "%sfg%u,%u,%u;", escapeSeq, fg_r, fg_g, fg_b);
            fgCodeLen = (NSUInteger)MAX(MIN(result, (24 - 1)), 0);
        } else {
            // No foreground color or no color support

            fgCode[0] = '\0';
            fgCodeLen = 0;
        }

        if (bgColor && isaColorTTY) {
            // Map background color to closest available shell color

            bgCodeIndex = [DDTTYLogger codeIndexForColor:bgColor];
            bgCodeRaw   = codes_bg[bgCodeIndex];

            NSString *escapeSeq = @"\033[";

            NSUInteger len1 = [escapeSeq lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
            NSUInteger len2 = [bgCodeRaw lengthOfBytesUsingEncoding:NSUTF8StringEncoding];

            BOOL escapeSeqEnc = [escapeSeq getCString:(bgCode)      maxLength:(len1 + 1) encoding:NSUTF8StringEncoding];
            BOOL bgCodeRawEsc = [bgCodeRaw getCString:(bgCode + len1) maxLength:(len2 + 1) encoding:NSUTF8StringEncoding];

            if (!escapeSeqEnc || !bgCodeRawEsc) {
                return nil;
            }

            bgCodeLen = len1 + len2;
        } else if (bgColor && isaXcodeColorTTY) {
            // Convert background color to color code sequence

            const char *escapeSeq = XCODE_COLORS_ESCAPE_SEQ;

            int result = snprintf(bgCode, 24, "%sbg%u,%u,%u;", escapeSeq, bg_r, bg_g, bg_b);
            bgCodeLen = (NSUInteger)MAX(MIN(result, (24 - 1)), 0);
        } else {
            // No background color or no color support

            bgCode[0] = '\0';
            bgCodeLen = 0;
        }

        if (isaColorTTY) {
            resetCodeLen = (NSUInteger)MAX(snprintf(resetCode, 8, "\033[0m"), 0);
        } else if (isaXcodeColorTTY) {
            resetCodeLen = (NSUInteger)MAX(snprintf(resetCode, 8, XCODE_COLORS_RESET), 0);
        } else {
            resetCode[0] = '\0';
            resetCodeLen = 0;
        }
    }

    return self;
}

- (NSString *)description {
    return [NSString stringWithFormat:
            @"<DDTTYLoggerColorProfile: %p mask:%i ctxt:%ld fg:%u,%u,%u bg:%u,%u,%u fgCode:%@ bgCode:%@>",
            self, (int)mask, (long)context, fg_r, fg_g, fg_b, bg_r, bg_g, bg_b, fgCodeRaw, bgCodeRaw];
}

@end
