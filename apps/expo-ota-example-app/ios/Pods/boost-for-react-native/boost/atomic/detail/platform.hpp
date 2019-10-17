/*
 * Distributed under the Boost Software License, Version 1.0.
 * (See accompanying file LICENSE_1_0.txt or copy at
 * http://www.boost.org/LICENSE_1_0.txt)
 *
 * Copyright (c) 2009 Helge Bahmann
 * Copyright (c) 2014 Andrey Semashev
 */
/*!
 * \file   atomic/detail/platform.hpp
 *
 * This header defines macros for the target platform detection
 */

#ifndef BOOST_ATOMIC_DETAIL_PLATFORM_HPP_INCLUDED_
#define BOOST_ATOMIC_DETAIL_PLATFORM_HPP_INCLUDED_

#include <boost/atomic/detail/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined(BOOST_ATOMIC_FORCE_FALLBACK)

// Compiler-based backends
#if (defined(__ibmxl__) || defined(__IBMCPP__)) && defined(__PPC__)

// IBM XL C++ Compiler has to be checked before GCC/Clang as it pretends to be one but does not support __atomic* intrinsics.
// It does support GCC inline assembler though.
#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_ppc

#elif ((defined(__GNUC__) && ((__GNUC__ * 100 + __GNUC_MINOR__) >= 407)) ||\
    (defined(BOOST_CLANG) && ((__clang_major__ * 100 + __clang_minor__) >= 302))) &&\
    (\
        (__GCC_ATOMIC_BOOL_LOCK_FREE + 0) == 2 ||\
        (__GCC_ATOMIC_CHAR_LOCK_FREE + 0) == 2 ||\
        (__GCC_ATOMIC_SHORT_LOCK_FREE + 0) == 2 ||\
        (__GCC_ATOMIC_INT_LOCK_FREE + 0) == 2 ||\
        (__GCC_ATOMIC_LONG_LOCK_FREE + 0) == 2 ||\
        (__GCC_ATOMIC_LLONG_LOCK_FREE + 0) == 2\
    )

#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_atomic

#elif (defined(__GNUC__) || defined(__SUNPRO_CC)) && (defined(__i386__) || defined(__x86_64__))

#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_x86

#elif defined(__GNUC__) && (defined(__POWERPC__) || defined(__PPC__))

#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_ppc

// This list of ARM architecture versions comes from Apple's arm/arch.h header.
// I don't know how complete it is.
#elif defined(__GNUC__) &&\
    (\
        defined(__ARM_ARCH_6__)  || defined(__ARM_ARCH_6J__) ||\
        defined(__ARM_ARCH_6K__) || defined(__ARM_ARCH_6Z__) ||\
        defined(__ARM_ARCH_6ZK__) ||\
        defined(__ARM_ARCH_7__) || defined(__ARM_ARCH_7A__) ||\
        defined(__ARM_ARCH_7R__) || defined(__ARM_ARCH_7M__) ||\
        defined(__ARM_ARCH_7EM__) || defined(__ARM_ARCH_7S__)\
    )

#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_arm

#elif (defined(__GNUC__) || defined(__SUNPRO_CC)) && (defined(__sparcv8plus) || defined(__sparc_v9__))

#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_sparc

#elif defined(__GNUC__) && defined(__alpha__)

#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_alpha

#elif defined(__GNUC__) && ((__GNUC__ * 100 + __GNUC_MINOR__) >= 401) &&\
    (\
        defined(__GCC_HAVE_SYNC_COMPARE_AND_SWAP_1) ||\
        defined(__GCC_HAVE_SYNC_COMPARE_AND_SWAP_2) ||\
        defined(__GCC_HAVE_SYNC_COMPARE_AND_SWAP_4) ||\
        defined(__GCC_HAVE_SYNC_COMPARE_AND_SWAP_8) ||\
        defined(__GCC_HAVE_SYNC_COMPARE_AND_SWAP_16)\
    )

#define BOOST_ATOMIC_DETAIL_PLATFORM gcc_sync

#elif defined(_MSC_VER) && (defined(_M_IX86) || defined(_M_X64))

#define BOOST_ATOMIC_DETAIL_PLATFORM msvc_x86

#elif defined(_MSC_VER) && _MSC_VER >= 1700 && defined(_M_ARM)

#define BOOST_ATOMIC_DETAIL_PLATFORM msvc_arm

#endif

// OS-based backends
#if !defined(BOOST_ATOMIC_DETAIL_PLATFORM)

#if defined(__linux__) && defined(__arm__)

#define BOOST_ATOMIC_DETAIL_PLATFORM linux_arm

#elif defined(BOOST_WINDOWS) || defined(_WIN32_CE)

#define BOOST_ATOMIC_DETAIL_PLATFORM windows

#endif

#endif // !defined(BOOST_ATOMIC_DETAIL_PLATFORM)

#endif // !defined(BOOST_ATOMIC_FORCE_FALLBACK)

#if !defined(BOOST_ATOMIC_DETAIL_PLATFORM)
#define BOOST_ATOMIC_DETAIL_PLATFORM emulated
#define BOOST_ATOMIC_EMULATED
#endif

#define BOOST_ATOMIC_DETAIL_HEADER(prefix) <BOOST_JOIN(prefix, BOOST_ATOMIC_DETAIL_PLATFORM).hpp>

#endif // BOOST_ATOMIC_DETAIL_PLATFORM_HPP_INCLUDED_
