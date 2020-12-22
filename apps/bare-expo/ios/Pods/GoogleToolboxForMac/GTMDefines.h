//
// GTMDefines.h
//
//  Copyright 2008 Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not
//  use this file except in compliance with the License.  You may obtain a copy
//  of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
//  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
//  License for the specific language governing permissions and limitations under
//  the License.
//

// ============================================================================

#include <AvailabilityMacros.h>
#include <TargetConditionals.h>

#ifdef __OBJC__
#include <Foundation/NSObjCRuntime.h>
#endif  // __OBJC__

#if TARGET_OS_IPHONE
#include <Availability.h>
#endif  // TARGET_OS_IPHONE

// ----------------------------------------------------------------------------
// CPP symbols that can be overridden in a prefix to control how the toolbox
// is compiled.
// ----------------------------------------------------------------------------


// By setting the GTM_CONTAINERS_VALIDATION_FAILED_LOG and
// GTM_CONTAINERS_VALIDATION_FAILED_ASSERT macros you can control what happens
// when a validation fails. If you implement your own validators, you may want
// to control their internals using the same macros for consistency.
#ifndef GTM_CONTAINERS_VALIDATION_FAILED_ASSERT
  #define GTM_CONTAINERS_VALIDATION_FAILED_ASSERT 0
#endif

// Ensure __has_feature and __has_extension are safe to use.
// See http://clang-analyzer.llvm.org/annotations.html
#ifndef __has_feature      // Optional.
  #define __has_feature(x) 0 // Compatibility with non-clang compilers.
#endif

#ifndef __has_extension
  #define __has_extension __has_feature // Compatibility with pre-3.0 compilers.
#endif

// Give ourselves a consistent way to do inlines.  Apple's macros even use
// a few different actual definitions, so we're based off of the foundation
// one.
#if !defined(GTM_INLINE)
  #if (defined (__GNUC__) && (__GNUC__ == 4)) || defined (__clang__)
    #define GTM_INLINE static __inline__ __attribute__((always_inline))
  #else
    #define GTM_INLINE static __inline__
  #endif
#endif

// Give ourselves a consistent way of doing externs that links up nicely
// when mixing objc and objc++
#if !defined (GTM_EXTERN)
  #if defined __cplusplus
    #define GTM_EXTERN extern "C"
    #define GTM_EXTERN_C_BEGIN extern "C" {
    #define GTM_EXTERN_C_END }
  #else
    #define GTM_EXTERN extern
    #define GTM_EXTERN_C_BEGIN
    #define GTM_EXTERN_C_END
  #endif
#endif

// Give ourselves a consistent way of exporting things if we have visibility
// set to hidden.
#if !defined (GTM_EXPORT)
  #define GTM_EXPORT __attribute__((visibility("default")))
#endif

// Give ourselves a consistent way of declaring something as unused. This
// doesn't use __unused because that is only supported in gcc 4.2 and greater.
#if !defined (GTM_UNUSED)
#define GTM_UNUSED(x) ((void)(x))
#endif

// _GTMDevLog & _GTMDevAssert
//
// _GTMDevLog & _GTMDevAssert are meant to be a very lightweight shell for
// developer level errors.  This implementation simply macros to NSLog/NSAssert.
// It is not intended to be a general logging/reporting system.
//
// Please see http://code.google.com/p/google-toolbox-for-mac/wiki/DevLogNAssert
// for a little more background on the usage of these macros.
//
//    _GTMDevLog           log some error/problem in debug builds
//    _GTMDevAssert        assert if condition isn't met w/in a method/function
//                           in all builds.
//
// To replace this system, just provide different macro definitions in your
// prefix header.  Remember, any implementation you provide *must* be thread
// safe since this could be called by anything in what ever situation it has
// been placed in.
//

// Ignore the "Macro name is a reserved identifier" warning in this section
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wreserved-id-macro"

// We only define the simple macros if nothing else has defined this.
#ifndef _GTMDevLog

#ifdef DEBUG
  #define _GTMDevLog(...) NSLog(__VA_ARGS__)
#else
  #define _GTMDevLog(...) do { } while (0)
#endif

#endif // _GTMDevLog

#ifndef _GTMDevAssert
// we directly invoke the NSAssert handler so we can pass on the varargs
// (NSAssert doesn't have a macro we can use that takes varargs)
#if !defined(NS_BLOCK_ASSERTIONS)
  #define _GTMDevAssert(condition, ...)                                       \
    do {                                                                      \
      if (__builtin_expect(!(condition), 0)) {                                \
        NSString *__assert_func_name__ =                                      \
            [NSString stringWithUTF8String:__PRETTY_FUNCTION__];              \
        __assert_func_name__ = __assert_func_name__ ?: @"<Unknown Function>"; \
        NSString *__assert_file_name__ =                                      \
            [NSString stringWithUTF8String:__FILE__];                         \
        __assert_file_name__ = __assert_file_name__ ?: @"<Unknown File>";     \
        [[NSAssertionHandler currentHandler]                                  \
            handleFailureInFunction:__assert_func_name__                      \
                               file:__assert_file_name__                      \
                         lineNumber:__LINE__                                  \
                        description:__VA_ARGS__];                             \
      }                                                                       \
    } while(0)
#else // !defined(NS_BLOCK_ASSERTIONS)
  #define _GTMDevAssert(condition, ...) do { } while (0)
#endif // !defined(NS_BLOCK_ASSERTIONS)

#endif // _GTMDevAssert

// _GTMCompileAssert
//
// Note:  Software for current compilers should just use _Static_assert directly
// instead of this macro.
//
// _GTMCompileAssert is an assert that is meant to fire at compile time if you
// want to check things at compile instead of runtime. For example if you
// want to check that a wchar is 4 bytes instead of 2 you would use
// _GTMCompileAssert(sizeof(wchar_t) == 4, wchar_t_is_4_bytes_on_OS_X)
// Note that the second "arg" is not in quotes, and must be a valid processor
// symbol in it's own right (no spaces, punctuation etc).

// Wrapping this in an #ifndef allows external groups to define their own
// compile time assert scheme.
#ifndef _GTMCompileAssert
  #if __has_feature(c_static_assert) || __has_extension(c_static_assert)
    #define _GTMCompileAssert(test, msg) _Static_assert((test), #msg)
  #else
    // Pre-Xcode 7 support.
    //
    // We got this technique from here:
    // http://unixjunkie.blogspot.com/2007/10/better-compile-time-asserts_29.html
    #define _GTMCompileAssertSymbolInner(line, msg) _GTMCOMPILEASSERT ## line ## __ ## msg
    #define _GTMCompileAssertSymbol(line, msg) _GTMCompileAssertSymbolInner(line, msg)
    #define _GTMCompileAssert(test, msg) \
      typedef char _GTMCompileAssertSymbol(__LINE__, msg) [ ((test) ? 1 : -1) ]
  #endif  // __has_feature(c_static_assert) || __has_extension(c_static_assert)
#endif // _GTMCompileAssert

#pragma clang diagnostic pop

// ----------------------------------------------------------------------------
// CPP symbols defined based on the project settings so the GTM code has
// simple things to test against w/o scattering the knowledge of project
// setting through all the code.
// ----------------------------------------------------------------------------

// Provide a single constant CPP symbol that all of GTM uses for ifdefing
// iPhone code.
#if TARGET_OS_IPHONE // iPhone SDK
  // For iPhone specific stuff
  #define GTM_IPHONE_SDK 1
  #if TARGET_IPHONE_SIMULATOR
    #define GTM_IPHONE_DEVICE 0
    #define GTM_IPHONE_SIMULATOR 1
  #else
    #define GTM_IPHONE_DEVICE 1
    #define GTM_IPHONE_SIMULATOR 0
  #endif  // TARGET_IPHONE_SIMULATOR
  // By default, GTM has provided it's own unittesting support, define this
  // to use the support provided by Xcode, especially for the Xcode4 support
  // for unittesting.
  #ifndef GTM_USING_XCTEST
    #define GTM_USING_XCTEST 0
  #endif
  #define GTM_MACOS_SDK 0
#else
  // For MacOS specific stuff
  #define GTM_MACOS_SDK 1
  #define GTM_IPHONE_SDK 0
  #define GTM_IPHONE_SIMULATOR 0
  #define GTM_IPHONE_DEVICE 0
  #ifndef GTM_USING_XCTEST
    #define GTM_USING_XCTEST 0
  #endif
#endif

// Some of our own availability macros
#if GTM_MACOS_SDK
#define GTM_AVAILABLE_ONLY_ON_IPHONE UNAVAILABLE_ATTRIBUTE
#define GTM_AVAILABLE_ONLY_ON_MACOS
#else
#define GTM_AVAILABLE_ONLY_ON_IPHONE
#define GTM_AVAILABLE_ONLY_ON_MACOS UNAVAILABLE_ATTRIBUTE
#endif

// GC was dropped by Apple, define the old constant incase anyone still keys
// off of it.
#ifndef GTM_SUPPORT_GC
  #define GTM_SUPPORT_GC 0
#endif

// Some support for advanced clang static analysis functionality
#ifndef NS_RETURNS_RETAINED
  #if __has_feature(attribute_ns_returns_retained)
    #define NS_RETURNS_RETAINED __attribute__((ns_returns_retained))
  #else
    #define NS_RETURNS_RETAINED
  #endif
#endif

#ifndef NS_RETURNS_NOT_RETAINED
  #if __has_feature(attribute_ns_returns_not_retained)
    #define NS_RETURNS_NOT_RETAINED __attribute__((ns_returns_not_retained))
  #else
    #define NS_RETURNS_NOT_RETAINED
  #endif
#endif

#ifndef CF_RETURNS_RETAINED
  #if __has_feature(attribute_cf_returns_retained)
    #define CF_RETURNS_RETAINED __attribute__((cf_returns_retained))
  #else
    #define CF_RETURNS_RETAINED
  #endif
#endif

#ifndef CF_RETURNS_NOT_RETAINED
  #if __has_feature(attribute_cf_returns_not_retained)
    #define CF_RETURNS_NOT_RETAINED __attribute__((cf_returns_not_retained))
  #else
    #define CF_RETURNS_NOT_RETAINED
  #endif
#endif

#ifndef NS_CONSUMED
  #if __has_feature(attribute_ns_consumed)
    #define NS_CONSUMED __attribute__((ns_consumed))
  #else
    #define NS_CONSUMED
  #endif
#endif

#ifndef CF_CONSUMED
  #if __has_feature(attribute_cf_consumed)
    #define CF_CONSUMED __attribute__((cf_consumed))
  #else
    #define CF_CONSUMED
  #endif
#endif

#ifndef NS_CONSUMES_SELF
  #if __has_feature(attribute_ns_consumes_self)
    #define NS_CONSUMES_SELF __attribute__((ns_consumes_self))
  #else
    #define NS_CONSUMES_SELF
  #endif
#endif

#ifndef GTM_NONNULL
  #if defined(__has_attribute)
    #if __has_attribute(nonnull)
      #define GTM_NONNULL(x) __attribute__((nonnull x))
    #else
      #define GTM_NONNULL(x)
    #endif
  #else
    #define GTM_NONNULL(x)
  #endif
#endif

// Invalidates the initializer from which it's called.
#ifndef GTMInvalidateInitializer
  #if __has_feature(objc_arc)
    #define GTMInvalidateInitializer() \
      do { \
        [self class]; /* Avoid warning of dead store to |self|. */ \
        _GTMDevAssert(NO, @"Invalid initializer."); \
        return nil; \
      } while (0)
  #else
    #define GTMInvalidateInitializer() \
      do { \
        [self release]; \
        _GTMDevAssert(NO, @"Invalid initializer."); \
        return nil; \
      } while (0)
  #endif
#endif

#ifndef GTMCFAutorelease
  // GTMCFAutorelease returns an id.  In contrast, Apple's CFAutorelease returns
  // a CFTypeRef.
  #if __has_feature(objc_arc)
    #define GTMCFAutorelease(x) CFBridgingRelease(x)
  #else
    #define GTMCFAutorelease(x) ([(id)x autorelease])
  #endif
#endif

#ifdef __OBJC__


// Macro to allow you to create NSStrings out of other macros.
// #define FOO foo
// NSString *fooString = GTM_NSSTRINGIFY(FOO);
#if !defined (GTM_NSSTRINGIFY)
  #define GTM_NSSTRINGIFY_INNER(x) @#x
  #define GTM_NSSTRINGIFY(x) GTM_NSSTRINGIFY_INNER(x)
#endif

// ============================================================================

// GTM_SEL_STRING is for specifying selector (usually property) names to KVC
// or KVO methods.
// In debug it will generate warnings for undeclared selectors if
// -Wunknown-selector is turned on.
// In release it will have no runtime overhead.
#ifndef GTM_SEL_STRING
  #ifdef DEBUG
    #define GTM_SEL_STRING(selName) NSStringFromSelector(@selector(selName))
  #else
    #define GTM_SEL_STRING(selName) @#selName
  #endif  // DEBUG
#endif  // GTM_SEL_STRING

#ifndef GTM_WEAK
#if __has_feature(objc_arc_weak)
    // With ARC enabled, __weak means a reference that isn't implicitly
    // retained.  __weak objects are accessed through runtime functions, so
    // they are zeroed out, but this requires OS X 10.7+.
    // At clang r251041+, ARC-style zeroing weak references even work in
    // non-ARC mode.
    #define GTM_WEAK __weak
  #elif __has_feature(objc_arc)
    // ARC, but targeting 10.6 or older, where zeroing weak references don't
    // exist.
    #define GTM_WEAK __unsafe_unretained
  #else
    // With manual reference counting, __weak used to be silently ignored.
    // clang r251041 gives it the ARC semantics instead.  This means they
    // now require a deployment target of 10.7, while some clients of GTM
    // still target 10.6.  In these cases, expand to __unsafe_unretained instead
    #define GTM_WEAK
  #endif
#endif

#endif  // __OBJC__
