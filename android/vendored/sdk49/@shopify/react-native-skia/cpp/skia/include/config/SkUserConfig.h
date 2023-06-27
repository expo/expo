/*
 * Copyright 2006 The Android Open Source Project
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkUserConfig_DEFINED
#define SkUserConfig_DEFINED

/*  SkTypes.h, the root of the public header files, includes this file
    SkUserConfig.h after first initializing certain Skia defines, letting
    this file change or augment those flags.

    Below are optional defines that add, subtract, or change default behavior
    in Skia. Your port can locally edit this file to enable/disable flags as
    you choose, or these can be declared on your command line (i.e. -Dfoo).

    By default, this #include file will always default to having all the flags
    commented out, so including it will have no effect.
*/

///////////////////////////////////////////////////////////////////////////////

/*  Skia has lots of debug-only code. Often this is just null checks or other
    parameter checking, but sometimes it can be quite intrusive (e.g. check that
    each 32bit pixel is in premultiplied form). This code can be very useful
    during development, but will slow things down in a shipping product.

    By default, these mutually exclusive flags are defined in SkTypes.h,
    based on the presence or absence of NDEBUG, but that decision can be changed
    here.
*/
//#define SK_DEBUG
//#define SK_RELEASE

/*  To write debug messages to a console, skia will call SkDebugf(...) following
    printf conventions (e.g. const char* format, ...). If you want to redirect
    this to something other than printf, define yours here
*/
//#define SkDebugf(...)  MyFunction(__VA_ARGS__)

/* Skia has both debug and release asserts. When an assert fails SK_ABORT will
   be used to report an abort message. SK_ABORT is expected not to return. Skia
   provides a default implementation which will print the message with SkDebugf
   and then call sk_abort_no_print.
*/
//#define SK_ABORT(message, ...)

/* To specify a different default font strike cache memory limit, define this. If this is
   undefined, skia will use a built-in value.
*/
//#define SK_DEFAULT_FONT_CACHE_LIMIT   (1024 * 1024)

/* To specify a different default font strike cache count limit, define this. If this is
   undefined, skia will use a built-in value.
*/
// #define SK_DEFAULT_FONT_CACHE_COUNT_LIMIT   2048

/* To specify the default size of the image cache, undefine this and set it to
   the desired value (in bytes). SkGraphics.h as a runtime API to set this
   value as well. If this is undefined, a built-in value will be used.
*/
//#define SK_DEFAULT_IMAGE_CACHE_LIMIT (1024 * 1024)

/*  Define this to set the upper limit for text to support LCD. Values that
    are very large increase the cost in the font cache and draw slower, without
    improving readability. If this is undefined, Skia will use its default
    value (e.g. 48)
*/
//#define SK_MAX_SIZE_FOR_LCDTEXT     48

/*  Change the kN32_SkColorType ordering to BGRA to work in X windows.
*/
//#define SK_R32_SHIFT    16

/* Determines whether to build code that supports the Ganesh GPU backend. Some classes
   that are not GPU-specific, such as SkShader subclasses, have optional code
   that is used allows them to interact with this GPU backend. If you'd like to
   include this code, include -DSK_GANESH in your cflags or uncomment below.
   Defaults to not set (No Ganesh GPU backend).
   This define affects the ABI of Skia, so make sure it matches the client which uses
   the compiled version of Skia.
*/
//#define SK_GANESH

/* Skia makes use of histogram logging macros to trace the frequency of
   events. By default, Skia provides no-op versions of these macros.
   Skia consumers can provide their own definitions of these macros to
   integrate with their histogram collection backend.
*/
//#define SK_HISTOGRAM_BOOLEAN(name, sample)
//#define SK_HISTOGRAM_ENUMERATION(name, sample, enum_size)
//#define SK_HISTOGRAM_EXACT_LINEAR(name, sample, value_max)
//#define SK_HISTOGRAM_MEMORY_KB(name, sample)

/* Skia tries to make use of some non-standard C++ language extensions.
   By default, Skia provides msvc and clang/gcc versions of these macros.
   Skia consumers can provide their own definitions of these macros to
   integrate with their own compilers and build system.
*/
//#define SK_UNUSED [[maybe_unused]]
//#define SK_WARN_UNUSED_RESULT [[nodiscard]]
//#define SK_ALWAYS_INLINE inline __attribute__((always_inline))
//#define SK_NEVER_INLINE __attribute__((noinline))
//#define SK_PRINTF_LIKE(A, B) __attribute__((format(printf, (A), (B))))
//#define SK_NO_SANITIZE(A) __attribute__((no_sanitize(A)))
//#define SK_TRIVIAL_ABI [[clang::trivial_abi]]

/*
 * If compiling Skia as a DLL, public APIs should be exported. Skia will set
 * SK_API to something sensible for Clang and MSVC, but if clients need to
 * customize it for their build system or compiler, they may.
 * If a client needs to use SK_API (e.g. overriding SK_ABORT), then they
 * *must* define their own, the default will not be defined prior to loading
 * this file.
 */
//#define SK_API __declspec(dllexport)


#endif
