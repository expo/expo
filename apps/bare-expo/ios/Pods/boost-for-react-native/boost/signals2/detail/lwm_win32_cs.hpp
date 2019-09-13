//
//  boost/signals2/detail/lwm_win32_cs.hpp
//
//  Copyright (c) 2002, 2003 Peter Dimov
//  Copyright (c) 2008 Frank Mori Hess
//  Copyright (c) Microsoft Corporation 2014
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_SIGNALS2_LWM_WIN32_CS_HPP
#define BOOST_SIGNALS2_LWM_WIN32_CS_HPP

// MS compatible compilers support #pragma once

#if defined(_MSC_VER)
# pragma once
#endif

#include <boost/assert.hpp>

#ifdef BOOST_USE_WINDOWS_H
#  include <windows.h>
#endif

#include <boost/predef/platform.h>

namespace boost
{

namespace signals2
{

#ifndef BOOST_USE_WINDOWS_H

struct critical_section
{
    struct critical_section_debug * DebugInfo;
    long LockCount;
    long RecursionCount;
    void * OwningThread;
    void * LockSemaphore;
#if defined(_WIN64)
    unsigned __int64 SpinCount;
#else
    unsigned long SpinCount;
#endif
};

#if BOOST_PLAT_WINDOWS_RUNTIME
extern "C" __declspec(dllimport) void __stdcall InitializeCriticalSectionEx(critical_section *, unsigned long, unsigned long);
#else
extern "C" __declspec(dllimport) void __stdcall InitializeCriticalSection(critical_section *);
#endif
extern "C" __declspec(dllimport) void __stdcall EnterCriticalSection(critical_section *);
extern "C" __declspec(dllimport) int __stdcall TryEnterCriticalSection(critical_section *);
extern "C" __declspec(dllimport) void __stdcall LeaveCriticalSection(critical_section *);
extern "C" __declspec(dllimport) void __stdcall DeleteCriticalSection(critical_section *);

#else

typedef ::CRITICAL_SECTION critical_section;

#endif // #ifndef BOOST_USE_WINDOWS_H

class mutex
{
private:

    critical_section cs_;

    mutex(mutex const &);
    mutex & operator=(mutex const &);

public:

    mutex()
    {
#if BOOST_PLAT_WINDOWS_RUNTIME
        InitializeCriticalSectionEx(&cs_, 4000, 0);
#else
        InitializeCriticalSection(&cs_);
#endif
    }

    ~mutex()
    {
        DeleteCriticalSection(&cs_);
    }

    void lock()
    {
        EnterCriticalSection(&cs_);
    }
// TryEnterCriticalSection only exists on Windows NT 4.0 and later
#if (defined(_WIN32_WINNT) && (_WIN32_WINNT >= 0x0400))
    bool try_lock()
    {
        return TryEnterCriticalSection(&cs_) != 0;
    }
#else
    bool try_lock()
    {
        BOOST_ASSERT(false);
        return false;
    }
#endif
    void unlock()
    {
        LeaveCriticalSection(&cs_);
    }
};

} // namespace signals2

} // namespace boost

#endif // #ifndef BOOST_SIGNALS2_LWM_WIN32_CS_HPP
