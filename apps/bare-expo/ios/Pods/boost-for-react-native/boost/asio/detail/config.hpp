//
// detail/config.hpp
// ~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_CONFIG_HPP
#define BOOST_ASIO_DETAIL_CONFIG_HPP

#if defined(BOOST_ASIO_STANDALONE)
# define BOOST_ASIO_DISABLE_BOOST_ARRAY 1
# define BOOST_ASIO_DISABLE_BOOST_ASSERT 1
# define BOOST_ASIO_DISABLE_BOOST_BIND 1
# define BOOST_ASIO_DISABLE_BOOST_CHRONO 1
# define BOOST_ASIO_DISABLE_BOOST_DATE_TIME 1
# define BOOST_ASIO_DISABLE_BOOST_LIMITS 1
# define BOOST_ASIO_DISABLE_BOOST_REGEX 1
# define BOOST_ASIO_DISABLE_BOOST_STATIC_CONSTANT 1
# define BOOST_ASIO_DISABLE_BOOST_THROW_EXCEPTION 1
# define BOOST_ASIO_DISABLE_BOOST_WORKAROUND 1
#else // defined(BOOST_ASIO_STANDALONE)
# include <boost/config.hpp>
# include <boost/version.hpp>
# define BOOST_ASIO_HAS_BOOST_CONFIG 1
#endif // defined(BOOST_ASIO_STANDALONE)

// Default to a header-only implementation. The user must specifically request
// separate compilation by defining either BOOST_ASIO_SEPARATE_COMPILATION or
// BOOST_ASIO_DYN_LINK (as a DLL/shared library implies separate compilation).
#if !defined(BOOST_ASIO_HEADER_ONLY)
# if !defined(BOOST_ASIO_SEPARATE_COMPILATION)
#  if !defined(BOOST_ASIO_DYN_LINK)
#   define BOOST_ASIO_HEADER_ONLY 1
#  endif // !defined(BOOST_ASIO_DYN_LINK)
# endif // !defined(BOOST_ASIO_SEPARATE_COMPILATION)
#endif // !defined(BOOST_ASIO_HEADER_ONLY)

#if defined(BOOST_ASIO_HEADER_ONLY)
# define BOOST_ASIO_DECL inline
#else // defined(BOOST_ASIO_HEADER_ONLY)
# if defined(_MSC_VER) || defined(__BORLANDC__) || defined(__CODEGEARC__)
// We need to import/export our code only if the user has specifically asked
// for it by defining BOOST_ASIO_DYN_LINK.
#  if defined(BOOST_ASIO_DYN_LINK)
// Export if this is our own source, otherwise import.
#   if defined(BOOST_ASIO_SOURCE)
#    define BOOST_ASIO_DECL __declspec(dllexport)
#   else // defined(BOOST_ASIO_SOURCE)
#    define BOOST_ASIO_DECL __declspec(dllimport)
#   endif // defined(BOOST_ASIO_SOURCE)
#  endif // defined(BOOST_ASIO_DYN_LINK)
# endif // defined(_MSC_VER) || defined(__BORLANDC__) || defined(__CODEGEARC__)
#endif // defined(BOOST_ASIO_HEADER_ONLY)

// If BOOST_ASIO_DECL isn't defined yet define it now.
#if !defined(BOOST_ASIO_DECL)
# define BOOST_ASIO_DECL
#endif // !defined(BOOST_ASIO_DECL)

// Microsoft Visual C++ detection.
#if !defined(BOOST_ASIO_MSVC)
# if defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_MSVC)
#  define BOOST_ASIO_MSVC BOOST_MSVC
# elif defined(_MSC_VER) && !defined(__MWERKS__) && !defined(__EDG_VERSION__)
#  define BOOST_ASIO_MSVC _MSC_VER
# endif // defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_MSVC)
#endif // defined(BOOST_ASIO_MSVC)

// Clang / libc++ detection.
#if defined(__clang__)
# if (__cplusplus >= 201103)
#  if __has_include(<__config>)
#   include <__config>
#   if defined(_LIBCPP_VERSION)
#    define BOOST_ASIO_HAS_CLANG_LIBCXX 1
#   endif // defined(_LIBCPP_VERSION)
#  endif // __has_include(<__config>)
# endif // (__cplusplus >= 201103)
#endif // defined(__clang__)

// Support move construction and assignment on compilers known to allow it.
#if !defined(BOOST_ASIO_HAS_MOVE)
# if !defined(BOOST_ASIO_DISABLE_MOVE)
#  if defined(__clang__)
#   if __has_feature(__cxx_rvalue_references__)
#    define BOOST_ASIO_HAS_MOVE 1
#   endif // __has_feature(__cxx_rvalue_references__)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_MOVE 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_MOVE 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_MOVE)
#endif // !defined(BOOST_ASIO_HAS_MOVE)

// If BOOST_ASIO_MOVE_CAST isn't defined, and move support is available, define
// BOOST_ASIO_MOVE_ARG and BOOST_ASIO_MOVE_CAST to take advantage of rvalue
// references and perfect forwarding.
#if defined(BOOST_ASIO_HAS_MOVE) && !defined(BOOST_ASIO_MOVE_CAST)
# define BOOST_ASIO_MOVE_ARG(type) type&&
# define BOOST_ASIO_MOVE_CAST(type) static_cast<type&&>
# define BOOST_ASIO_MOVE_CAST2(type1, type2) static_cast<type1, type2&&>
#endif // defined(BOOST_ASIO_HAS_MOVE) && !defined(BOOST_ASIO_MOVE_CAST)

// If BOOST_ASIO_MOVE_CAST still isn't defined, default to a C++03-compatible
// implementation. Note that older g++ and MSVC versions don't like it when you
// pass a non-member function through a const reference, so for most compilers
// we'll play it safe and stick with the old approach of passing the handler by
// value.
#if !defined(BOOST_ASIO_MOVE_CAST)
# if defined(__GNUC__)
#  if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 1)) || (__GNUC__ > 4)
#   define BOOST_ASIO_MOVE_ARG(type) const type&
#  else // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 1)) || (__GNUC__ > 4)
#   define BOOST_ASIO_MOVE_ARG(type) type
#  endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 1)) || (__GNUC__ > 4)
# elif defined(BOOST_ASIO_MSVC)
#  if (_MSC_VER >= 1400)
#   define BOOST_ASIO_MOVE_ARG(type) const type&
#  else // (_MSC_VER >= 1400)
#   define BOOST_ASIO_MOVE_ARG(type) type
#  endif // (_MSC_VER >= 1400)
# else
#  define BOOST_ASIO_MOVE_ARG(type) type
# endif
# define BOOST_ASIO_MOVE_CAST(type) static_cast<const type&>
# define BOOST_ASIO_MOVE_CAST2(type1, type2) static_cast<const type1, type2&>
#endif // !defined(BOOST_ASIO_MOVE_CAST)

// Support variadic templates on compilers known to allow it.
#if !defined(BOOST_ASIO_HAS_VARIADIC_TEMPLATES)
# if !defined(BOOST_ASIO_DISABLE_VARIADIC_TEMPLATES)
#  if defined(__clang__)
#   if __has_feature(__cxx_variadic_templates__)
#    define BOOST_ASIO_HAS_VARIADIC_TEMPLATES 1
#   endif // __has_feature(__cxx_variadic_templates__)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_VARIADIC_TEMPLATES 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
# endif // !defined(BOOST_ASIO_DISABLE_VARIADIC_TEMPLATES)
#endif // !defined(BOOST_ASIO_HAS_VARIADIC_TEMPLATES)

// Support constexpr on compilers known to allow it.
#if !defined(BOOST_ASIO_HAS_CONSTEXPR)
# if !defined(BOOST_ASIO_DISABLE_CONSTEXPR)
#  if defined(__clang__)
#   if __has_feature(__cxx_constexpr__)
#    define BOOST_ASIO_HAS_CONSTEXPR 1
#   endif // __has_feature(__cxx_constexr__)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_CONSTEXPR 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
# endif // !defined(BOOST_ASIO_DISABLE_CONSTEXPR)
#endif // !defined(BOOST_ASIO_HAS_CONSTEXPR)
#if !defined(BOOST_ASIO_CONSTEXPR)
# if defined(BOOST_ASIO_HAS_CONSTEXPR)
#  define BOOST_ASIO_CONSTEXPR constexpr
# else // defined(BOOST_ASIO_HAS_CONSTEXPR)
#  define BOOST_ASIO_CONSTEXPR
# endif // defined(BOOST_ASIO_HAS_CONSTEXPR)
#endif // !defined(BOOST_ASIO_CONSTEXPR)

// Standard library support for system errors.
# if !defined(BOOST_ASIO_DISABLE_STD_SYSTEM_ERROR)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_SYSTEM_ERROR 1
#   elif (__cplusplus >= 201103)
#    if __has_include(<system_error>)
#     define BOOST_ASIO_HAS_STD_SYSTEM_ERROR 1
#    endif // __has_include(<system_error>)
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_SYSTEM_ERROR 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_SYSTEM_ERROR 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_SYSTEM_ERROR)

// Compliant C++11 compilers put noexcept specifiers on error_category members.
#if !defined(BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT)
# if (BOOST_VERSION >= 105300)
#  define BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT BOOST_NOEXCEPT
# elif defined(__clang__)
#  if __has_feature(__cxx_noexcept__)
#   define BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT noexcept(true)
#  endif // __has_feature(__cxx_noexcept__)
# elif defined(__GNUC__)
#  if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 7)) || (__GNUC__ > 4)
#   if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT noexcept(true)
#   endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#  endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 7)) || (__GNUC__ > 4)
# elif defined(BOOST_ASIO_MSVC)
#  if (_MSC_VER >= 1900)
#   define BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT noexcept(true)
#  endif // (_MSC_VER >= 1900)
# endif // defined(BOOST_ASIO_MSVC)
# if !defined(BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT)
#  define BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT
# endif // !defined(BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT)
#endif // !defined(BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT)

// Standard library support for arrays.
#if !defined(BOOST_ASIO_HAS_STD_ARRAY)
# if !defined(BOOST_ASIO_DISABLE_STD_ARRAY)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_ARRAY 1
#   elif (__cplusplus >= 201103)
#    if __has_include(<array>)
#     define BOOST_ASIO_HAS_STD_ARRAY 1
#    endif // __has_include(<array>)
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_ARRAY 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1600)
#    define BOOST_ASIO_HAS_STD_ARRAY 1
#   endif // (_MSC_VER >= 1600)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_ARRAY)
#endif // !defined(BOOST_ASIO_HAS_STD_ARRAY)

// Standard library support for shared_ptr and weak_ptr.
#if !defined(BOOST_ASIO_HAS_STD_SHARED_PTR)
# if !defined(BOOST_ASIO_DISABLE_STD_SHARED_PTR)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_SHARED_PTR 1
#   elif (__cplusplus >= 201103)
#    define BOOST_ASIO_HAS_STD_SHARED_PTR 1
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_SHARED_PTR 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1600)
#    define BOOST_ASIO_HAS_STD_SHARED_PTR 1
#   endif // (_MSC_VER >= 1600)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_SHARED_PTR)
#endif // !defined(BOOST_ASIO_HAS_STD_SHARED_PTR)

// Standard library support for atomic operations.
#if !defined(BOOST_ASIO_HAS_STD_ATOMIC)
# if !defined(BOOST_ASIO_DISABLE_STD_ATOMIC)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_ATOMIC 1
#   elif (__cplusplus >= 201103)
#    if __has_include(<atomic>)
#     define BOOST_ASIO_HAS_STD_ATOMIC 1
#    endif // __has_include(<atomic>)
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_ATOMIC 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_ATOMIC 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_ATOMIC)
#endif // !defined(BOOST_ASIO_HAS_STD_ATOMIC)

// Standard library support for chrono. Some standard libraries (such as the
// libstdc++ shipped with gcc 4.6) provide monotonic_clock as per early C++0x
// drafts, rather than the eventually standardised name of steady_clock.
#if !defined(BOOST_ASIO_HAS_STD_CHRONO)
# if !defined(BOOST_ASIO_DISABLE_STD_CHRONO)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_CHRONO 1
#   elif (__cplusplus >= 201103)
#    if __has_include(<chrono>)
#     define BOOST_ASIO_HAS_STD_CHRONO 1
#    endif // __has_include(<chrono>)
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_CHRONO 1
#     if ((__GNUC__ == 4) && (__GNUC_MINOR__ == 6))
#      define BOOST_ASIO_HAS_STD_CHRONO_MONOTONIC_CLOCK 1
#     endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ == 6))
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_CHRONO 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_CHRONO)
#endif // !defined(BOOST_ASIO_HAS_STD_CHRONO)

// Boost support for chrono.
#if !defined(BOOST_ASIO_HAS_BOOST_CHRONO)
# if !defined(BOOST_ASIO_DISABLE_BOOST_CHRONO)
#  if (BOOST_VERSION >= 104700)
#   define BOOST_ASIO_HAS_BOOST_CHRONO 1
#  endif // (BOOST_VERSION >= 104700)
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_CHRONO)
#endif // !defined(BOOST_ASIO_HAS_BOOST_CHRONO)

// Boost support for the DateTime library.
#if !defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)
# if !defined(BOOST_ASIO_DISABLE_BOOST_DATE_TIME)
#  define BOOST_ASIO_HAS_BOOST_DATE_TIME 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_DATE_TIME)
#endif // !defined(BOOST_ASIO_HAS_BOOST_DATE_TIME)

// Standard library support for addressof.
#if !defined(BOOST_ASIO_HAS_STD_ADDRESSOF)
# if !defined(BOOST_ASIO_DISABLE_STD_ADDRESSOF)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_ADDRESSOF 1
#   elif (__cplusplus >= 201103)
#    define BOOST_ASIO_HAS_STD_ADDRESSOF 1
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_ADDRESSOF 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 6)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_ADDRESSOF 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_ADDRESSOF)
#endif // !defined(BOOST_ASIO_HAS_STD_ADDRESSOF)

// Standard library support for the function class.
#if !defined(BOOST_ASIO_HAS_STD_FUNCTION)
# if !defined(BOOST_ASIO_DISABLE_STD_FUNCTION)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_FUNCTION 1
#   elif (__cplusplus >= 201103)
#    define BOOST_ASIO_HAS_STD_FUNCTION 1
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_FUNCTION 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_FUNCTION 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_FUNCTION)
#endif // !defined(BOOST_ASIO_HAS_STD_FUNCTION)

// Standard library support for type traits.
#if !defined(BOOST_ASIO_HAS_STD_TYPE_TRAITS)
# if !defined(BOOST_ASIO_DISABLE_STD_TYPE_TRAITS)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_TYPE_TRAITS 1
#   elif (__cplusplus >= 201103)
#    if __has_include(<type_traits>)
#     define BOOST_ASIO_HAS_STD_TYPE_TRAITS 1
#    endif // __has_include(<type_traits>)
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_TYPE_TRAITS 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_TYPE_TRAITS 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_TYPE_TRAITS)
#endif // !defined(BOOST_ASIO_HAS_STD_TYPE_TRAITS)

// Standard library support for the cstdint header.
#if !defined(BOOST_ASIO_HAS_CSTDINT)
# if !defined(BOOST_ASIO_DISABLE_CSTDINT)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_CSTDINT 1
#   elif (__cplusplus >= 201103)
#    define BOOST_ASIO_HAS_CSTDINT 1
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_CSTDINT 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 5)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_CSTDINT 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_CSTDINT)
#endif // !defined(BOOST_ASIO_HAS_CSTDINT)

// Standard library support for the thread class.
#if !defined(BOOST_ASIO_HAS_STD_THREAD)
# if !defined(BOOST_ASIO_DISABLE_STD_THREAD)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_THREAD 1
#   elif (__cplusplus >= 201103)
#    if __has_include(<thread>)
#     define BOOST_ASIO_HAS_STD_THREAD 1
#    endif // __has_include(<thread>)
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 7)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_THREAD 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 7)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_THREAD 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_THREAD)
#endif // !defined(BOOST_ASIO_HAS_STD_THREAD)

// Standard library support for the mutex and condition variable classes.
#if !defined(BOOST_ASIO_HAS_STD_MUTEX_AND_CONDVAR)
# if !defined(BOOST_ASIO_DISABLE_STD_MUTEX_AND_CONDVAR)
#  if defined(__clang__)
#   if defined(BOOST_ASIO_HAS_CLANG_LIBCXX)
#    define BOOST_ASIO_HAS_STD_MUTEX_AND_CONDVAR 1
#   elif (__cplusplus >= 201103)
#    if __has_include(<mutex>)
#     define BOOST_ASIO_HAS_STD_MUTEX_AND_CONDVAR 1
#    endif // __has_include(<mutex>)
#   endif // (__cplusplus >= 201103)
#  endif // defined(__clang__)
#  if defined(__GNUC__)
#   if ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 7)) || (__GNUC__ > 4)
#    if defined(__GXX_EXPERIMENTAL_CXX0X__)
#     define BOOST_ASIO_HAS_STD_MUTEX_AND_CONDVAR 1
#    endif // defined(__GXX_EXPERIMENTAL_CXX0X__)
#   endif // ((__GNUC__ == 4) && (__GNUC_MINOR__ >= 7)) || (__GNUC__ > 4)
#  endif // defined(__GNUC__)
#  if defined(BOOST_ASIO_MSVC)
#   if (_MSC_VER >= 1700)
#    define BOOST_ASIO_HAS_STD_MUTEX_AND_CONDVAR 1
#   endif // (_MSC_VER >= 1700)
#  endif // defined(BOOST_ASIO_MSVC)
# endif // !defined(BOOST_ASIO_DISABLE_STD_MUTEX_AND_CONDVAR)
#endif // !defined(BOOST_ASIO_HAS_STD_MUTEX_AND_CONDVAR)

// Windows App target. Windows but with a limited API.
#if !defined(BOOST_ASIO_WINDOWS_APP)
# if defined(_WIN32_WINNT) && (_WIN32_WINNT >= 0x0603)
#  include <winapifamily.h>
#  if WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_APP) \
   && !WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)
#   define BOOST_ASIO_WINDOWS_APP 1
#  endif // WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_APP)
         // && !WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)
# endif // defined(_WIN32_WINNT) && (_WIN32_WINNT >= 0x0603)
#endif // !defined(BOOST_ASIO_WINDOWS_APP)

// Legacy WinRT target. Windows App is preferred.
#if !defined(BOOST_ASIO_WINDOWS_RUNTIME)
# if !defined(BOOST_ASIO_WINDOWS_APP)
#  if defined(__cplusplus_winrt)
#   include <winapifamily.h>
#   if WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_APP) \
    && !WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)
#    define BOOST_ASIO_WINDOWS_RUNTIME 1
#   endif // WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_APP)
          // && !WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)
#  endif // defined(__cplusplus_winrt)
# endif // !defined(BOOST_ASIO_WINDOWS_APP)
#endif // !defined(BOOST_ASIO_WINDOWS_RUNTIME)

// Windows target. Excludes WinRT but includes Windows App targets.
#if !defined(BOOST_ASIO_WINDOWS)
# if !defined(BOOST_ASIO_WINDOWS_RUNTIME)
#  if defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_WINDOWS)
#   define BOOST_ASIO_WINDOWS 1
#  elif defined(WIN32) || defined(_WIN32) || defined(__WIN32__)
#   define BOOST_ASIO_WINDOWS 1
#  elif defined(BOOST_ASIO_WINDOWS_APP)
#   define BOOST_ASIO_WINDOWS 1
#  endif // defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_WINDOWS)
# endif // !defined(BOOST_ASIO_WINDOWS_RUNTIME)
#endif // !defined(BOOST_ASIO_WINDOWS)

// Windows: target OS version.
#if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
# if !defined(_WIN32_WINNT) && !defined(_WIN32_WINDOWS)
#  if defined(_MSC_VER) || defined(__BORLANDC__)
#   pragma message( \
  "Please define _WIN32_WINNT or _WIN32_WINDOWS appropriately. For example:\n"\
  "- add -D_WIN32_WINNT=0x0501 to the compiler command line; or\n"\
  "- add _WIN32_WINNT=0x0501 to your project's Preprocessor Definitions.\n"\
  "Assuming _WIN32_WINNT=0x0501 (i.e. Windows XP target).")
#  else // defined(_MSC_VER) || defined(__BORLANDC__)
#   warning Please define _WIN32_WINNT or _WIN32_WINDOWS appropriately.
#   warning For example, add -D_WIN32_WINNT=0x0501 to the compiler command line.
#   warning Assuming _WIN32_WINNT=0x0501 (i.e. Windows XP target).
#  endif // defined(_MSC_VER) || defined(__BORLANDC__)
#  define _WIN32_WINNT 0x0501
# endif // !defined(_WIN32_WINNT) && !defined(_WIN32_WINDOWS)
# if defined(_MSC_VER)
#  if defined(_WIN32) && !defined(WIN32)
#   if !defined(_WINSOCK2API_)
#    define WIN32 // Needed for correct types in winsock2.h
#   else // !defined(_WINSOCK2API_)
#    error Please define the macro WIN32 in your compiler options
#   endif // !defined(_WINSOCK2API_)
#  endif // defined(_WIN32) && !defined(WIN32)
# endif // defined(_MSC_VER)
# if defined(__BORLANDC__)
#  if defined(__WIN32__) && !defined(WIN32)
#   if !defined(_WINSOCK2API_)
#    define WIN32 // Needed for correct types in winsock2.h
#   else // !defined(_WINSOCK2API_)
#    error Please define the macro WIN32 in your compiler options
#   endif // !defined(_WINSOCK2API_)
#  endif // defined(__WIN32__) && !defined(WIN32)
# endif // defined(__BORLANDC__)
# if defined(__CYGWIN__)
#  if !defined(__USE_W32_SOCKETS)
#   error You must add -D__USE_W32_SOCKETS to your compiler options.
#  endif // !defined(__USE_W32_SOCKETS)
# endif // defined(__CYGWIN__)
#endif // defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)

// Windows: minimise header inclusion.
#if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
# if !defined(BOOST_ASIO_NO_WIN32_LEAN_AND_MEAN)
#  if !defined(WIN32_LEAN_AND_MEAN)
#   define WIN32_LEAN_AND_MEAN
#  endif // !defined(WIN32_LEAN_AND_MEAN)
# endif // !defined(BOOST_ASIO_NO_WIN32_LEAN_AND_MEAN)
#endif // defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)

// Windows: suppress definition of "min" and "max" macros.
#if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
# if !defined(BOOST_ASIO_NO_NOMINMAX)
#  if !defined(NOMINMAX)
#   define NOMINMAX 1
#  endif // !defined(NOMINMAX)
# endif // !defined(BOOST_ASIO_NO_NOMINMAX)
#endif // defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)

// Windows: IO Completion Ports.
#if !defined(BOOST_ASIO_HAS_IOCP)
# if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
#  if defined(_WIN32_WINNT) && (_WIN32_WINNT >= 0x0400)
#   if !defined(UNDER_CE) && !defined(BOOST_ASIO_WINDOWS_APP)
#    if !defined(BOOST_ASIO_DISABLE_IOCP)
#     define BOOST_ASIO_HAS_IOCP 1
#    endif // !defined(BOOST_ASIO_DISABLE_IOCP)
#   endif // !defined(UNDER_CE) && !defined(BOOST_ASIO_WINDOWS_APP)
#  endif // defined(_WIN32_WINNT) && (_WIN32_WINNT >= 0x0400)
# endif // defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
#endif // !defined(BOOST_ASIO_HAS_IOCP)

// On POSIX (and POSIX-like) platforms we need to include unistd.h in order to
// get access to the various platform feature macros, e.g. to be able to test
// for threads support.
#if !defined(BOOST_ASIO_HAS_UNISTD_H)
# if !defined(BOOST_ASIO_HAS_BOOST_CONFIG)
#  if defined(unix) \
   || defined(__unix) \
   || defined(_XOPEN_SOURCE) \
   || defined(_POSIX_SOURCE) \
   || (defined(__MACH__) && defined(__APPLE__)) \
   || defined(__FreeBSD__) \
   || defined(__NetBSD__) \
   || defined(__OpenBSD__) \
   || defined(__linux__)
#   define BOOST_ASIO_HAS_UNISTD_H 1
#  endif
# endif // !defined(BOOST_ASIO_HAS_BOOST_CONFIG)
#endif // !defined(BOOST_ASIO_HAS_UNISTD_H)
#if defined(BOOST_ASIO_HAS_UNISTD_H)
# include <unistd.h>
#endif // defined(BOOST_ASIO_HAS_UNISTD_H)

// Linux: epoll, eventfd and timerfd.
#if defined(__linux__)
# include <linux/version.h>
# if !defined(BOOST_ASIO_HAS_EPOLL)
#  if !defined(BOOST_ASIO_DISABLE_EPOLL)
#   if LINUX_VERSION_CODE >= KERNEL_VERSION(2,5,45)
#    define BOOST_ASIO_HAS_EPOLL 1
#   endif // LINUX_VERSION_CODE >= KERNEL_VERSION(2,5,45)
#  endif // !defined(BOOST_ASIO_DISABLE_EPOLL)
# endif // !defined(BOOST_ASIO_HAS_EPOLL)
# if !defined(BOOST_ASIO_HAS_EVENTFD)
#  if !defined(BOOST_ASIO_DISABLE_EVENTFD)
#   if LINUX_VERSION_CODE >= KERNEL_VERSION(2,6,22)
#    define BOOST_ASIO_HAS_EVENTFD 1
#   endif // LINUX_VERSION_CODE >= KERNEL_VERSION(2,6,22)
#  endif // !defined(BOOST_ASIO_DISABLE_EVENTFD)
# endif // !defined(BOOST_ASIO_HAS_EVENTFD)
# if !defined(BOOST_ASIO_HAS_TIMERFD)
#  if defined(BOOST_ASIO_HAS_EPOLL)
#   if (__GLIBC__ > 2) || (__GLIBC__ == 2 && __GLIBC_MINOR__ >= 8)
#    define BOOST_ASIO_HAS_TIMERFD 1
#   endif // (__GLIBC__ > 2) || (__GLIBC__ == 2 && __GLIBC_MINOR__ >= 8)
#  endif // defined(BOOST_ASIO_HAS_EPOLL)
# endif // !defined(BOOST_ASIO_HAS_TIMERFD)
#endif // defined(__linux__)

// Mac OS X, FreeBSD, NetBSD, OpenBSD: kqueue.
#if (defined(__MACH__) && defined(__APPLE__)) \
  || defined(__FreeBSD__) \
  || defined(__NetBSD__) \
  || defined(__OpenBSD__)
# if !defined(BOOST_ASIO_HAS_KQUEUE)
#  if !defined(BOOST_ASIO_DISABLE_KQUEUE)
#   define BOOST_ASIO_HAS_KQUEUE 1
#  endif // !defined(BOOST_ASIO_DISABLE_KQUEUE)
# endif // !defined(BOOST_ASIO_HAS_KQUEUE)
#endif // (defined(__MACH__) && defined(__APPLE__))
       //   || defined(__FreeBSD__)
       //   || defined(__NetBSD__)
       //   || defined(__OpenBSD__)

// Solaris: /dev/poll.
#if defined(__sun)
# if !defined(BOOST_ASIO_HAS_DEV_POLL)
#  if !defined(BOOST_ASIO_DISABLE_DEV_POLL)
#   define BOOST_ASIO_HAS_DEV_POLL 1
#  endif // !defined(BOOST_ASIO_DISABLE_DEV_POLL)
# endif // !defined(BOOST_ASIO_HAS_DEV_POLL)
#endif // defined(__sun)

// Serial ports.
#if !defined(BOOST_ASIO_HAS_SERIAL_PORT)
# if defined(BOOST_ASIO_HAS_IOCP) \
  || !defined(BOOST_ASIO_WINDOWS) \
  && !defined(BOOST_ASIO_WINDOWS_RUNTIME) \
  && !defined(__CYGWIN__)
#  if !defined(__SYMBIAN32__)
#   if !defined(BOOST_ASIO_DISABLE_SERIAL_PORT)
#    define BOOST_ASIO_HAS_SERIAL_PORT 1
#   endif // !defined(BOOST_ASIO_DISABLE_SERIAL_PORT)
#  endif // !defined(__SYMBIAN32__)
# endif // defined(BOOST_ASIO_HAS_IOCP)
        //   || !defined(BOOST_ASIO_WINDOWS)
        //   && !defined(BOOST_ASIO_WINDOWS_RUNTIME)
        //   && !defined(__CYGWIN__)
#endif // !defined(BOOST_ASIO_HAS_SERIAL_PORT)

// Windows: stream handles.
#if !defined(BOOST_ASIO_HAS_WINDOWS_STREAM_HANDLE)
# if !defined(BOOST_ASIO_DISABLE_WINDOWS_STREAM_HANDLE)
#  if defined(BOOST_ASIO_HAS_IOCP)
#   define BOOST_ASIO_HAS_WINDOWS_STREAM_HANDLE 1
#  endif // defined(BOOST_ASIO_HAS_IOCP)
# endif // !defined(BOOST_ASIO_DISABLE_WINDOWS_STREAM_HANDLE)
#endif // !defined(BOOST_ASIO_HAS_WINDOWS_STREAM_HANDLE)

// Windows: random access handles.
#if !defined(BOOST_ASIO_HAS_WINDOWS_RANDOM_ACCESS_HANDLE)
# if !defined(BOOST_ASIO_DISABLE_WINDOWS_RANDOM_ACCESS_HANDLE)
#  if defined(BOOST_ASIO_HAS_IOCP)
#   define BOOST_ASIO_HAS_WINDOWS_RANDOM_ACCESS_HANDLE 1
#  endif // defined(BOOST_ASIO_HAS_IOCP)
# endif // !defined(BOOST_ASIO_DISABLE_WINDOWS_RANDOM_ACCESS_HANDLE)
#endif // !defined(BOOST_ASIO_HAS_WINDOWS_RANDOM_ACCESS_HANDLE)

// Windows: object handles.
#if !defined(BOOST_ASIO_HAS_WINDOWS_OBJECT_HANDLE)
# if !defined(BOOST_ASIO_DISABLE_WINDOWS_OBJECT_HANDLE)
#  if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
#   if !defined(UNDER_CE) && !defined(BOOST_ASIO_WINDOWS_APP)
#    define BOOST_ASIO_HAS_WINDOWS_OBJECT_HANDLE 1
#   endif // !defined(UNDER_CE) && !defined(BOOST_ASIO_WINDOWS_APP)
#  endif // defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
# endif // !defined(BOOST_ASIO_DISABLE_WINDOWS_OBJECT_HANDLE)
#endif // !defined(BOOST_ASIO_HAS_WINDOWS_OBJECT_HANDLE)

// Windows: OVERLAPPED wrapper.
#if !defined(BOOST_ASIO_HAS_WINDOWS_OVERLAPPED_PTR)
# if !defined(BOOST_ASIO_DISABLE_WINDOWS_OVERLAPPED_PTR)
#  if defined(BOOST_ASIO_HAS_IOCP)
#   define BOOST_ASIO_HAS_WINDOWS_OVERLAPPED_PTR 1
#  endif // defined(BOOST_ASIO_HAS_IOCP)
# endif // !defined(BOOST_ASIO_DISABLE_WINDOWS_OVERLAPPED_PTR)
#endif // !defined(BOOST_ASIO_HAS_WINDOWS_OVERLAPPED_PTR)

// POSIX: stream-oriented file descriptors.
#if !defined(BOOST_ASIO_HAS_POSIX_STREAM_DESCRIPTOR)
# if !defined(BOOST_ASIO_DISABLE_POSIX_STREAM_DESCRIPTOR)
#  if !defined(BOOST_ASIO_WINDOWS) \
  && !defined(BOOST_ASIO_WINDOWS_RUNTIME) \
  && !defined(__CYGWIN__)
#   define BOOST_ASIO_HAS_POSIX_STREAM_DESCRIPTOR 1
#  endif // !defined(BOOST_ASIO_WINDOWS)
         //   && !defined(BOOST_ASIO_WINDOWS_RUNTIME)
         //   && !defined(__CYGWIN__)
# endif // !defined(BOOST_ASIO_DISABLE_POSIX_STREAM_DESCRIPTOR)
#endif // !defined(BOOST_ASIO_HAS_POSIX_STREAM_DESCRIPTOR)

// UNIX domain sockets.
#if !defined(BOOST_ASIO_HAS_LOCAL_SOCKETS)
# if !defined(BOOST_ASIO_DISABLE_LOCAL_SOCKETS)
#  if !defined(BOOST_ASIO_WINDOWS) \
  && !defined(BOOST_ASIO_WINDOWS_RUNTIME) \
  && !defined(__CYGWIN__)
#   define BOOST_ASIO_HAS_LOCAL_SOCKETS 1
#  endif // !defined(BOOST_ASIO_WINDOWS)
         //   && !defined(BOOST_ASIO_WINDOWS_RUNTIME)
         //   && !defined(__CYGWIN__)
# endif // !defined(BOOST_ASIO_DISABLE_LOCAL_SOCKETS)
#endif // !defined(BOOST_ASIO_HAS_LOCAL_SOCKETS)

// Can use sigaction() instead of signal().
#if !defined(BOOST_ASIO_HAS_SIGACTION)
# if !defined(BOOST_ASIO_DISABLE_SIGACTION)
#  if !defined(BOOST_ASIO_WINDOWS) \
  && !defined(BOOST_ASIO_WINDOWS_RUNTIME) \
  && !defined(__CYGWIN__)
#   define BOOST_ASIO_HAS_SIGACTION 1
#  endif // !defined(BOOST_ASIO_WINDOWS)
         //   && !defined(BOOST_ASIO_WINDOWS_RUNTIME)
         //   && !defined(__CYGWIN__)
# endif // !defined(BOOST_ASIO_DISABLE_SIGACTION)
#endif // !defined(BOOST_ASIO_HAS_SIGACTION)

// Can use signal().
#if !defined(BOOST_ASIO_HAS_SIGNAL)
# if !defined(BOOST_ASIO_DISABLE_SIGNAL)
#  if !defined(UNDER_CE)
#   define BOOST_ASIO_HAS_SIGNAL 1
#  endif // !defined(UNDER_CE)
# endif // !defined(BOOST_ASIO_DISABLE_SIGNAL)
#endif // !defined(BOOST_ASIO_HAS_SIGNAL)

// Can use getaddrinfo() and getnameinfo().
#if !defined(BOOST_ASIO_HAS_GETADDRINFO)
# if !defined(BOOST_ASIO_DISABLE_GETADDRINFO)
#  if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
#   if defined(_WIN32_WINNT) && (_WIN32_WINNT >= 0x0501)
#    define BOOST_ASIO_HAS_GETADDRINFO 1
#   elif defined(UNDER_CE)
#    define BOOST_ASIO_HAS_GETADDRINFO 1
#   endif // defined(UNDER_CE)
#  elif defined(__MACH__) && defined(__APPLE__)
#   if defined(__MAC_OS_X_VERSION_MIN_REQUIRED)
#    if (__MAC_OS_X_VERSION_MIN_REQUIRED >= 1050)
#     define BOOST_ASIO_HAS_GETADDRINFO 1
#    endif // (__MAC_OS_X_VERSION_MIN_REQUIRED >= 1050)
#   else // defined(__MAC_OS_X_VERSION_MIN_REQUIRED)
#    define BOOST_ASIO_HAS_GETADDRINFO 1
#   endif // defined(__MAC_OS_X_VERSION_MIN_REQUIRED)
#  else // defined(__MACH__) && defined(__APPLE__)
#   define BOOST_ASIO_HAS_GETADDRINFO 1
#  endif // defined(__MACH__) && defined(__APPLE__)
# endif // !defined(BOOST_ASIO_DISABLE_GETADDRINFO)
#endif // !defined(BOOST_ASIO_HAS_GETADDRINFO)

// Whether standard iostreams are disabled.
#if !defined(BOOST_ASIO_NO_IOSTREAM)
# if defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_NO_IOSTREAM)
#  define BOOST_ASIO_NO_IOSTREAM 1
# endif // !defined(BOOST_NO_IOSTREAM)
#endif // !defined(BOOST_ASIO_NO_IOSTREAM)

// Whether exception handling is disabled.
#if !defined(BOOST_ASIO_NO_EXCEPTIONS)
# if defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_NO_EXCEPTIONS)
#  define BOOST_ASIO_NO_EXCEPTIONS 1
# endif // !defined(BOOST_NO_EXCEPTIONS)
#endif // !defined(BOOST_ASIO_NO_EXCEPTIONS)

// Whether the typeid operator is supported.
#if !defined(BOOST_ASIO_NO_TYPEID)
# if defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_NO_TYPEID)
#  define BOOST_ASIO_NO_TYPEID 1
# endif // !defined(BOOST_NO_TYPEID)
#endif // !defined(BOOST_ASIO_NO_TYPEID)

// Threads.
#if !defined(BOOST_ASIO_HAS_THREADS)
# if !defined(BOOST_ASIO_DISABLE_THREADS)
#  if defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_HAS_THREADS)
#   define BOOST_ASIO_HAS_THREADS 1
#  elif defined(_MSC_VER) && defined(_MT)
#   define BOOST_ASIO_HAS_THREADS 1
#  elif defined(__BORLANDC__) && defined(__MT__)
#   define BOOST_ASIO_HAS_THREADS 1
#  elif defined(_POSIX_THREADS)
#   define BOOST_ASIO_HAS_THREADS 1
#  endif // defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_HAS_THREADS)
# endif // !defined(BOOST_ASIO_DISABLE_THREADS)
#endif // !defined(BOOST_ASIO_HAS_THREADS)

// POSIX threads.
#if !defined(BOOST_ASIO_HAS_PTHREADS)
# if defined(BOOST_ASIO_HAS_THREADS)
#  if defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_HAS_PTHREADS)
#   define BOOST_ASIO_HAS_PTHREADS 1
#  elif defined(_POSIX_THREADS)
#   define BOOST_ASIO_HAS_PTHREADS 1
#  endif // defined(BOOST_ASIO_HAS_BOOST_CONFIG) && defined(BOOST_HAS_PTHREADS)
# endif // defined(BOOST_ASIO_HAS_THREADS)
#endif // !defined(BOOST_ASIO_HAS_PTHREADS)

// Helper to prevent macro expansion.
#define BOOST_ASIO_PREVENT_MACRO_SUBSTITUTION

// Helper to define in-class constants.
#if !defined(BOOST_ASIO_STATIC_CONSTANT)
# if !defined(BOOST_ASIO_DISABLE_BOOST_STATIC_CONSTANT)
#  define BOOST_ASIO_STATIC_CONSTANT(type, assignment) \
    BOOST_STATIC_CONSTANT(type, assignment)
# else // !defined(BOOST_ASIO_DISABLE_BOOST_STATIC_CONSTANT)
#  define BOOST_ASIO_STATIC_CONSTANT(type, assignment) \
    static const type assignment
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_STATIC_CONSTANT)
#endif // !defined(BOOST_ASIO_STATIC_CONSTANT)

// Boost array library.
#if !defined(BOOST_ASIO_HAS_BOOST_ARRAY)
# if !defined(BOOST_ASIO_DISABLE_BOOST_ARRAY)
#  define BOOST_ASIO_HAS_BOOST_ARRAY 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_ARRAY)
#endif // !defined(BOOST_ASIO_HAS_BOOST_ARRAY)

// Boost assert macro.
#if !defined(BOOST_ASIO_HAS_BOOST_ASSERT)
# if !defined(BOOST_ASIO_DISABLE_BOOST_ASSERT)
#  define BOOST_ASIO_HAS_BOOST_ASSERT 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_ASSERT)
#endif // !defined(BOOST_ASIO_HAS_BOOST_ASSERT)

// Boost limits header.
#if !defined(BOOST_ASIO_HAS_BOOST_LIMITS)
# if !defined(BOOST_ASIO_DISABLE_BOOST_LIMITS)
#  define BOOST_ASIO_HAS_BOOST_LIMITS 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_LIMITS)
#endif // !defined(BOOST_ASIO_HAS_BOOST_LIMITS)

// Boost throw_exception function.
#if !defined(BOOST_ASIO_HAS_BOOST_THROW_EXCEPTION)
# if !defined(BOOST_ASIO_DISABLE_BOOST_THROW_EXCEPTION)
#  define BOOST_ASIO_HAS_BOOST_THROW_EXCEPTION 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_THROW_EXCEPTION)
#endif // !defined(BOOST_ASIO_HAS_BOOST_THROW_EXCEPTION)

// Boost regex library.
#if !defined(BOOST_ASIO_HAS_BOOST_REGEX)
# if !defined(BOOST_ASIO_DISABLE_BOOST_REGEX)
#  define BOOST_ASIO_HAS_BOOST_REGEX 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_REGEX)
#endif // !defined(BOOST_ASIO_HAS_BOOST_REGEX)

// Boost bind function.
#if !defined(BOOST_ASIO_HAS_BOOST_BIND)
# if !defined(BOOST_ASIO_DISABLE_BOOST_BIND)
#  define BOOST_ASIO_HAS_BOOST_BIND 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_BIND)
#endif // !defined(BOOST_ASIO_HAS_BOOST_BIND)

// Boost's BOOST_WORKAROUND macro.
#if !defined(BOOST_ASIO_HAS_BOOST_WORKAROUND)
# if !defined(BOOST_ASIO_DISABLE_BOOST_WORKAROUND)
#  define BOOST_ASIO_HAS_BOOST_WORKAROUND 1
# endif // !defined(BOOST_ASIO_DISABLE_BOOST_WORKAROUND)
#endif // !defined(BOOST_ASIO_HAS_BOOST_WORKAROUND)

// Microsoft Visual C++'s secure C runtime library.
#if !defined(BOOST_ASIO_HAS_SECURE_RTL)
# if !defined(BOOST_ASIO_DISABLE_SECURE_RTL)
#  if defined(BOOST_ASIO_MSVC) \
    && (BOOST_ASIO_MSVC >= 1400) \
    && !defined(UNDER_CE)
#   define BOOST_ASIO_HAS_SECURE_RTL 1
#  endif // defined(BOOST_ASIO_MSVC)
         // && (BOOST_ASIO_MSVC >= 1400)
         // && !defined(UNDER_CE)
# endif // !defined(BOOST_ASIO_DISABLE_SECURE_RTL)
#endif // !defined(BOOST_ASIO_HAS_SECURE_RTL)

// Handler hooking. Disabled for ancient Borland C++ and gcc compilers.
#if !defined(BOOST_ASIO_HAS_HANDLER_HOOKS)
# if !defined(BOOST_ASIO_DISABLE_HANDLER_HOOKS)
#  if defined(__GNUC__)
#   if (__GNUC__ >= 3)
#    define BOOST_ASIO_HAS_HANDLER_HOOKS 1
#   endif // (__GNUC__ >= 3)
#  elif !defined(__BORLANDC__)
#   define BOOST_ASIO_HAS_HANDLER_HOOKS 1
#  endif // !defined(__BORLANDC__)
# endif // !defined(BOOST_ASIO_DISABLE_HANDLER_HOOKS)
#endif // !defined(BOOST_ASIO_HAS_HANDLER_HOOKS)

// Support for the __thread keyword extension.
#if !defined(BOOST_ASIO_DISABLE_THREAD_KEYWORD_EXTENSION)
# if defined(__linux__)
#  if defined(__GNUC__) && (defined(__i386__) || defined(__x86_64__))
#   if ((__GNUC__ == 3) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 3)
#    if !defined(__INTEL_COMPILER) && !defined(__ICL)
#     define BOOST_ASIO_HAS_THREAD_KEYWORD_EXTENSION 1
#     define BOOST_ASIO_THREAD_KEYWORD __thread
#    elif defined(__INTEL_COMPILER) && (__INTEL_COMPILER >= 1100)
#     define BOOST_ASIO_HAS_THREAD_KEYWORD_EXTENSION 1
#    endif // defined(__INTEL_COMPILER) && (__INTEL_COMPILER >= 1100)
#   endif // ((__GNUC__ == 3) && (__GNUC_MINOR__ >= 3)) || (__GNUC__ > 3)
#  endif // defined(__GNUC__) && (defined(__i386__) || defined(__x86_64__))
# endif // defined(__linux__)
# if defined(BOOST_ASIO_MSVC) && defined(BOOST_ASIO_WINDOWS_RUNTIME)
#  if (_MSC_VER >= 1700)
#   define BOOST_ASIO_HAS_THREAD_KEYWORD_EXTENSION 1
#   define BOOST_ASIO_THREAD_KEYWORD __declspec(thread)
#  endif // (_MSC_VER >= 1700)
# endif // defined(BOOST_ASIO_MSVC) && defined(BOOST_ASIO_WINDOWS_RUNTIME)
#endif // !defined(BOOST_ASIO_DISABLE_THREAD_KEYWORD_EXTENSION)
#if !defined(BOOST_ASIO_THREAD_KEYWORD)
# define BOOST_ASIO_THREAD_KEYWORD __thread
#endif // !defined(BOOST_ASIO_THREAD_KEYWORD)

// Support for POSIX ssize_t typedef.
#if !defined(BOOST_ASIO_DISABLE_SSIZE_T)
# if defined(__linux__) \
   || (defined(__MACH__) && defined(__APPLE__))
#  define BOOST_ASIO_HAS_SSIZE_T 1
# endif // defined(__linux__)
        //   || (defined(__MACH__) && defined(__APPLE__))
#endif // !defined(BOOST_ASIO_DISABLE_SSIZE_T)

#endif // BOOST_ASIO_DETAIL_CONFIG_HPP
