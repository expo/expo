/*
 *          Copyright Andrey Semashev 2007 - 2014.
 * Distributed under the Boost Software License, Version 1.0.
 *    (See accompanying file LICENSE_1_0.txt or copy at
 *          http://www.boost.org/LICENSE_1_0.txt)
 */
/*!
 * \file   spin_mutex.hpp
 * \author Andrey Semashev
 * \date   01.08.2010
 *
 * \brief  This header is the Boost.Log library implementation, see the library documentation
 *         at http://www.boost.org/doc/libs/release/libs/log/doc/html/index.html.
 */

#ifndef BOOST_LOG_DETAIL_SPIN_MUTEX_HPP_INCLUDED_
#define BOOST_LOG_DETAIL_SPIN_MUTEX_HPP_INCLUDED_

#include <boost/log/detail/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#ifndef BOOST_LOG_NO_THREADS

#include <boost/throw_exception.hpp>
#include <boost/thread/exceptions.hpp>

#if defined(BOOST_THREAD_POSIX) // This one can be defined by users, so it should go first
#define BOOST_LOG_SPIN_MUTEX_USE_PTHREAD
#elif defined(BOOST_WINDOWS)
#define BOOST_LOG_SPIN_MUTEX_USE_WINAPI
#elif defined(BOOST_HAS_PTHREADS)
#define BOOST_LOG_SPIN_MUTEX_USE_PTHREAD
#endif

#if defined(BOOST_LOG_SPIN_MUTEX_USE_WINAPI)

#include <boost/detail/interlocked.hpp>

#if defined(BOOST_USE_WINDOWS_H)

#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0500
#endif

#include <windows.h>

#else // defined(BOOST_USE_WINDOWS_H)

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

namespace aux {

extern "C" {

__declspec(dllimport) int __stdcall SwitchToThread();

} // extern "C"

} // namespace aux

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#endif // BOOST_USE_WINDOWS_H

#if defined(__INTEL_COMPILER) || defined(_MSC_VER)
#    if defined(_M_IX86)
#        define BOOST_LOG_PAUSE_OP __asm { pause }
#    elif defined(_M_AMD64)
extern "C" void _mm_pause(void);
#pragma intrinsic(_mm_pause)
#        define BOOST_LOG_PAUSE_OP _mm_pause()
#    endif
#    if defined(__INTEL_COMPILER)
#        define BOOST_LOG_COMPILER_BARRIER __memory_barrier()
#    else
extern "C" void _ReadWriteBarrier(void);
#pragma intrinsic(_ReadWriteBarrier)
#        define BOOST_LOG_COMPILER_BARRIER _ReadWriteBarrier()
#    endif
#elif defined(__GNUC__) && (defined(__i386__) || defined(__x86_64__))
#    define BOOST_LOG_PAUSE_OP __asm__ __volatile__("pause;")
#    define BOOST_LOG_COMPILER_BARRIER __asm__ __volatile__("" : : : "memory")
#endif

#include <boost/log/detail/header.hpp>

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

namespace aux {

//! A simple spinning mutex
class spin_mutex
{
private:
    enum state
    {
        initial_pause = 2,
        max_pause = 16
    };

    long m_State;

public:
    spin_mutex() : m_State(0) {}

    bool try_lock()
    {
        return (BOOST_INTERLOCKED_COMPARE_EXCHANGE(&m_State, 1L, 0L) == 0L);
    }

    void lock()
    {
#if defined(BOOST_LOG_PAUSE_OP)
        unsigned int pause_count = initial_pause;
#endif
        while (!try_lock())
        {
#if defined(BOOST_LOG_PAUSE_OP)
            if (pause_count < max_pause)
            {
                for (unsigned int i = 0; i < pause_count; ++i)
                {
                    BOOST_LOG_PAUSE_OP;
                }
                pause_count += pause_count;
            }
            else
            {
                // Restart spinning after waking up this thread
                pause_count = initial_pause;
                SwitchToThread();
            }
#else
            SwitchToThread();
#endif
        }
    }

    void unlock()
    {
#if (defined(_M_IX86) || defined(_M_AMD64)) && defined(BOOST_LOG_COMPILER_BARRIER)
        BOOST_LOG_COMPILER_BARRIER;
        m_State = 0L;
        BOOST_LOG_COMPILER_BARRIER;
#else
        BOOST_INTERLOCKED_EXCHANGE(&m_State, 0L);
#endif
    }

    //  Non-copyable
    BOOST_DELETED_FUNCTION(spin_mutex(spin_mutex const&))
    BOOST_DELETED_FUNCTION(spin_mutex& operator= (spin_mutex const&))
};

#undef BOOST_LOG_PAUSE_OP
#undef BOOST_LOG_COMPILER_BARRIER

} // namespace aux

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#include <boost/log/detail/footer.hpp>

#elif defined(BOOST_LOG_SPIN_MUTEX_USE_PTHREAD)

#include <pthread.h>
#include <boost/assert.hpp>
#include <boost/log/detail/header.hpp>

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

namespace aux {

#if defined(_POSIX_SPIN_LOCKS) && _POSIX_SPIN_LOCKS > 0

//! A simple spinning mutex
class spin_mutex
{
private:
    pthread_spinlock_t m_State;

public:
    spin_mutex()
    {
        const int err = pthread_spin_init(&m_State, PTHREAD_PROCESS_PRIVATE);
        if (err != 0)
            throw_exception< thread_resource_error >(err, "failed to initialize a spin mutex", "spin_mutex::spin_mutex()", __FILE__, __LINE__);
    }

    ~spin_mutex()
    {
        BOOST_VERIFY(pthread_spin_destroy(&m_State) == 0);
    }

    bool try_lock()
    {
        const int err = pthread_spin_trylock(&m_State);
        if (err == 0)
            return true;
        if (err != EBUSY)
            throw_exception< lock_error >(err, "failed to lock a spin mutex", "spin_mutex::try_lock()", __FILE__, __LINE__);
        return false;
    }

    void lock()
    {
        const int err = pthread_spin_lock(&m_State);
        if (err != 0)
            throw_exception< lock_error >(err, "failed to lock a spin mutex", "spin_mutex::lock()", __FILE__, __LINE__);
    }

    void unlock()
    {
        BOOST_VERIFY(pthread_spin_unlock(&m_State) == 0);
    }

    //  Non-copyable
    BOOST_DELETED_FUNCTION(spin_mutex(spin_mutex const&))
    BOOST_DELETED_FUNCTION(spin_mutex& operator= (spin_mutex const&))

private:
    template< typename ExceptionT >
    static BOOST_NOINLINE BOOST_LOG_NORETURN void throw_exception(int err, const char* descr, const char* func, const char* file, int line)
    {
#if !defined(BOOST_EXCEPTION_DISABLE)
        boost::exception_detail::throw_exception_(ExceptionT(err, descr), func, file, line);
#else
        boost::throw_exception(ExceptionT(err, descr));
#endif
    }
};

#else // defined(_POSIX_SPIN_LOCKS)

//! Backup implementation in case if pthreads don't support spin locks
class spin_mutex
{
private:
    pthread_mutex_t m_State;

public:
    spin_mutex()
    {
        const int err = pthread_mutex_init(&m_State, NULL);
        if (err != 0)
            throw_exception< thread_resource_error >(err, "failed to initialize a spin mutex", "spin_mutex::spin_mutex()", __FILE__, __LINE__);
    }

    ~spin_mutex()
    {
        BOOST_VERIFY(pthread_mutex_destroy(&m_State) == 0);
    }

    bool try_lock()
    {
        const int err = pthread_mutex_trylock(&m_State);
        if (err == 0)
            return true;
        if (err != EBUSY)
            throw_exception< lock_error >(err, "failed to lock a spin mutex", "spin_mutex::try_lock()", __FILE__, __LINE__);
        return false;
    }

    void lock()
    {
        const int err = pthread_mutex_lock(&m_State);
        if (err != 0)
            throw_exception< lock_error >(err, "failed to lock a spin mutex", "spin_mutex::lock()", __FILE__, __LINE__);
    }

    void unlock()
    {
        BOOST_VERIFY(pthread_mutex_unlock(&m_State) == 0);
    }

    //  Non-copyable
    BOOST_DELETED_FUNCTION(spin_mutex(spin_mutex const&))
    BOOST_DELETED_FUNCTION(spin_mutex& operator= (spin_mutex const&))

private:
    template< typename ExceptionT >
    static BOOST_NOINLINE BOOST_LOG_NORETURN void throw_exception(int err, const char* descr, const char* func, const char* file, int line)
    {
#if !defined(BOOST_EXCEPTION_DISABLE)
        boost::exception_detail::throw_exception_(ExceptionT(err, descr), func, file, line);
#else
        boost::throw_exception(ExceptionT(err, descr));
#endif
    }
};

#endif // defined(_POSIX_SPIN_LOCKS)

} // namespace aux

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#include <boost/log/detail/footer.hpp>

#endif

#endif // BOOST_LOG_NO_THREADS

#endif // BOOST_LOG_DETAIL_SPIN_MUTEX_HPP_INCLUDED_
