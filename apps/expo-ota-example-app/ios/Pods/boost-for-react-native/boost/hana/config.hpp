/*!
@file
Defines configuration macros used throughout the library.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_CONFIG_HPP
#define BOOST_HANA_CONFIG_HPP

#include <boost/hana/version.hpp>


//////////////////////////////////////////////////////////////////////////////
// Detect the compiler
//////////////////////////////////////////////////////////////////////////////

#if defined(_MSC_VER) && !defined(__clang__) // MSVC
    // This must be checked first, because otherwise it produces a fatal
    // error due to unrecognized #warning directives used below.
#   pragma message("Warning: the native Microsoft compiler is not supported due to lack of proper C++14 support.")

#elif defined(__clang__) && defined(_MSC_VER) // Clang-cl (Clang for Windows)

#   define BOOST_HANA_CONFIG_CLANG BOOST_HANA_CONFIG_VERSION(               \
                    __clang_major__, __clang_minor__, __clang_patchlevel__)

#   if BOOST_HANA_CONFIG_CLANG < BOOST_HANA_CONFIG_VERSION(3, 5, 0)
#       warning "Versions of Clang prior to 3.5.0 are not supported by Hana."
#   endif

#   if _MSC_VER < 1900
#       warning "Clang-cl is only supported with the -fms-compatibility-version parameter set to 19 and above."
#   endif

#elif defined(__clang__) && defined(__apple_build_version__) // Apple's Clang

#   if __apple_build_version__ >= 6020049
#       define BOOST_HANA_CONFIG_CLANG BOOST_HANA_CONFIG_VERSION(3, 6, 0)
#   else
#       warning "Versions of Apple's Clang prior to the one shipped with Xcode 6.3 are not supported by Hana."
#   endif

#elif defined(__clang__) // genuine Clang

#   define BOOST_HANA_CONFIG_CLANG BOOST_HANA_CONFIG_VERSION(               \
                __clang_major__, __clang_minor__, __clang_patchlevel__)

#   if BOOST_HANA_CONFIG_CLANG < BOOST_HANA_CONFIG_VERSION(3, 5, 0)
#       warning "Versions of Clang prior to 3.5.0 are not supported by Hana."
#   endif

#elif defined(__GNUC__) // GCC

#   define BOOST_HANA_CONFIG_GCC BOOST_HANA_CONFIG_VERSION(                 \
                            __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__)

#   if BOOST_HANA_CONFIG_GCC < BOOST_HANA_CONFIG_VERSION(6, 0, 0)
#       warning "Versions of GCC prior to 6.0.0 are not supported by Hana."
#   endif

#else

#   warning "Your compiler is not officially supported by Hana or it was not detected properly."

#endif

//////////////////////////////////////////////////////////////////////////////
// Check the compiler for general C++14 capabilities
//////////////////////////////////////////////////////////////////////////////
#if (__cplusplus < 201400)
#   if defined(_MSC_VER)
#       pragma message("Warning: Your compiler doesn't provide C++14 or higher capabilities. Try adding the compiler flag '-std=c++14' or '-std=c++1y'.")
#   else
#       warning "Your compiler doesn't provide C++14 or higher capabilities. Try adding the compiler flag '-std=c++14' or '-std=c++1y'."
#   endif
#endif

//////////////////////////////////////////////////////////////////////////////
// Detect the standard library
//////////////////////////////////////////////////////////////////////////////

// We include this header, which normally defines the proper detection macros.
// At least, libc++ and libstdc++ do.
#include <cstddef>

#if defined(_LIBCPP_VERSION)

#   define BOOST_HANA_CONFIG_LIBCPP BOOST_HANA_CONFIG_VERSION(              \
                ((_LIBCPP_VERSION) / 1000) % 10, 0, (_LIBCPP_VERSION) % 1000)

#   if BOOST_HANA_CONFIG_LIBCPP < BOOST_HANA_CONFIG_VERSION(1, 0, 101)
#       warning "Versions of libc++ prior to the one shipped with Clang 3.5.0 are not supported by Hana."
#   endif

#elif defined(__GLIBCXX__)

// We do not define a macro to keep track of libstdc++'s version, because
// we have no scalable way of associating a value of __GLIBCXX__ to the
// corresponding GCC release. Instead, we just check that the release date
// of the libstdc++ in use is recent enough, which should indicate that it
// was released with a GCC >= 5.1, which in turn indicates good enough C++14
// support.
#   if __GLIBCXX__ < 20150422 // --> the libstdc++ shipped with GCC 5.1.0
#       warning "Versions of libstdc++ prior to the one shipped with GCC 5.1.0 are not supported by Hana for lack of full C++14 support."
#   endif

#   define BOOST_HANA_CONFIG_LIBSTDCXX

#elif defined(_MSC_VER)

#   define BOOST_HANA_CONFIG_LIBMSVCCXX

#else

#   warning "Your standard library is not officially supported by Hana or it was not detected properly."

#endif


//////////////////////////////////////////////////////////////////////////////
// Caveats and other compiler-dependent options
//////////////////////////////////////////////////////////////////////////////

// BOOST_HANA_CONFIG_HAS_CONSTEXPR_LAMBDA enables some constructs requiring
// `constexpr` lambdas, which are not in the language (yet).
// Currently always disabled.
//
// BOOST_HANA_CONSTEXPR_LAMBDA expands to `constexpr` if constexpr lambdas
// are supported and to nothing otherwise.
#if 0
#   define BOOST_HANA_CONFIG_HAS_CONSTEXPR_LAMBDA
#   define BOOST_HANA_CONSTEXPR_LAMBDA constexpr
#else
#   define BOOST_HANA_CONSTEXPR_LAMBDA /* nothing */
#endif

// The std::tuple adapter is broken on libc++ prior to the one shipped
// with Clang 3.7.0.
#if defined(BOOST_HANA_CONFIG_LIBCPP) &&                                    \
        BOOST_HANA_CONFIG_LIBCPP < BOOST_HANA_CONFIG_VERSION(1, 0, 101)
#   define BOOST_HANA_CONFIG_HAS_NO_STD_TUPLE_ADAPTER
#endif

// There's a bug in std::tuple_cat in libc++ right now.
// See http://llvm.org/bugs/show_bug.cgi?id=22806.
#if defined(BOOST_HANA_CONFIG_LIBCPP)
#   define BOOST_HANA_CONFIG_LIBCPP_HAS_BUG_22806
#endif

//////////////////////////////////////////////////////////////////////////////
// Namespace macros
//////////////////////////////////////////////////////////////////////////////
#define BOOST_HANA_NAMESPACE_BEGIN namespace boost { namespace hana {

#define BOOST_HANA_NAMESPACE_END }}

//////////////////////////////////////////////////////////////////////////////
// Library features and options that can be tweaked by users
//////////////////////////////////////////////////////////////////////////////

#if defined(BOOST_HANA_DOXYGEN_INVOKED) || \
    (defined(NDEBUG) && !defined(BOOST_HANA_CONFIG_DISABLE_ASSERTIONS))
    //! @ingroup group-config
    //! Disables the `BOOST_HANA_*_ASSERT` macro & friends.
    //!
    //! When this macro is defined, the `BOOST_HANA_*_ASSERT` macro & friends
    //! are disabled, i.e. they expand to nothing.
    //!
    //! This macro is defined automatically when `NDEBUG` is defined. It can
    //! also be defined by users before including this header or defined on
    //! the command line.
#   define BOOST_HANA_CONFIG_DISABLE_ASSERTIONS
#endif

#if defined(BOOST_HANA_DOXYGEN_INVOKED)
    //! @ingroup group-config
    //! Disables concept checks in interface methods.
    //!
    //! When this macro is not defined (the default), tag-dispatched methods
    //! will make sure the arguments they are passed are models of the proper
    //! concept(s). This can be very helpful in catching programming errors,
    //! but it is also slightly less compile-time efficient. You should
    //! probably always leave the checks enabled (and hence never define this
    //! macro), except perhaps in translation units that are compiled very
    //! often but whose code using Hana is modified very rarely.
#   define BOOST_HANA_CONFIG_DISABLE_CONCEPT_CHECKS
#endif

#if defined(BOOST_HANA_DOXYGEN_INVOKED)
    //! @ingroup group-config
    //! Enables usage of the "string literal operator template" GNU extension.
    //!
    //! That operator is not part of the language yet, but it is supported by
    //! both Clang and GCC. This operator allows Hana to provide the nice `_s`
    //! user-defined literal for creating compile-time strings.
    //!
    //! When this macro is not defined, the GNU extension will be not used
    //! by Hana. Because this is a non-standard extension, the macro is not
    //! defined by default.
#   define BOOST_HANA_CONFIG_ENABLE_STRING_UDL
#endif

#if defined(BOOST_HANA_DOXYGEN_INVOKED)
    //! @ingroup group-config
    //! Enables additional assertions and sanity checks to be done by Hana.
    //!
    //! When this macro is defined (it is __not defined__ by default),
    //! additional sanity checks may be done by Hana. These checks may
    //! be costly to perform, either in terms of compilation time or in
    //! terms of execution time. These checks may help debugging an
    //! application during its initial development, but they should not
    //! be enabled as part of the normal configuration.
#   define BOOST_HANA_CONFIG_ENABLE_DEBUG_MODE
#endif

#endif // !BOOST_HANA_CONFIG_HPP
