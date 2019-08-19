#ifndef BOOST_THREAD_PTHREAD_RECURSIVE_MUTEX_HPP
#define BOOST_THREAD_PTHREAD_RECURSIVE_MUTEX_HPP
// (C) Copyright 2007-8 Anthony Williams
// (C) Copyright 2011-2012 Vicente J. Botet Escriba
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#include <pthread.h>
#include <boost/throw_exception.hpp>
#include <boost/thread/exceptions.hpp>
#if defined BOOST_THREAD_PROVIDES_NESTED_LOCKS
#include <boost/thread/lock_types.hpp>
#endif
#include <boost/thread/thread_time.hpp>
#include <boost/assert.hpp>
#ifndef _WIN32
#include <unistd.h>
#endif
#include <boost/date_time/posix_time/conversion.hpp>
#include <errno.h>
#include <boost/thread/pthread/timespec.hpp>
#include <boost/thread/pthread/pthread_mutex_scoped_lock.hpp>
#ifdef BOOST_THREAD_USES_CHRONO
#include <boost/chrono/system_clocks.hpp>
#include <boost/chrono/ceil.hpp>
#endif
#include <boost/thread/detail/delete.hpp>

#if (defined _POSIX_TIMEOUTS && (_POSIX_TIMEOUTS-0)>=200112L) \
 || (defined __ANDROID__ && defined __ANDROID_API__ && __ANDROID_API__ >= 21)
#ifndef BOOST_PTHREAD_HAS_TIMEDLOCK
#define BOOST_PTHREAD_HAS_TIMEDLOCK
#endif
#endif

#if  defined BOOST_HAS_PTHREAD_MUTEXATTR_SETTYPE \
 ||  defined __ANDROID__
#define BOOST_THREAD_HAS_PTHREAD_MUTEXATTR_SETTYPE
#endif

#if defined BOOST_THREAD_HAS_PTHREAD_MUTEXATTR_SETTYPE && defined BOOST_PTHREAD_HAS_TIMEDLOCK
#define BOOST_USE_PTHREAD_RECURSIVE_TIMEDLOCK
#endif

#include <boost/config/abi_prefix.hpp>

namespace boost
{
    class recursive_mutex
    {
    private:
        pthread_mutex_t m;
#ifndef BOOST_THREAD_HAS_PTHREAD_MUTEXATTR_SETTYPE
        pthread_cond_t cond;
        bool is_locked;
        pthread_t owner;
        unsigned count;
#endif
    public:
        BOOST_THREAD_NO_COPYABLE(recursive_mutex)
        recursive_mutex()
        {
#ifdef BOOST_THREAD_HAS_PTHREAD_MUTEXATTR_SETTYPE
            pthread_mutexattr_t attr;

            int const init_attr_res=pthread_mutexattr_init(&attr);
            if(init_attr_res)
            {
                boost::throw_exception(thread_resource_error(init_attr_res, "boost:: recursive_mutex constructor failed in pthread_mutexattr_init"));
            }
            int const set_attr_res=pthread_mutexattr_settype(&attr,PTHREAD_MUTEX_RECURSIVE);
            if(set_attr_res)
            {
                BOOST_VERIFY(!pthread_mutexattr_destroy(&attr));
                boost::throw_exception(thread_resource_error(set_attr_res, "boost:: recursive_mutex constructor failed in pthread_mutexattr_settype"));
            }

            int const res=pthread_mutex_init(&m,&attr);
            if(res)
            {
                BOOST_VERIFY(!pthread_mutexattr_destroy(&attr));
                boost::throw_exception(thread_resource_error(res, "boost:: recursive_mutex constructor failed in pthread_mutex_init"));
            }
            BOOST_VERIFY(!pthread_mutexattr_destroy(&attr));
#else
            int const res=pthread_mutex_init(&m,NULL);
            if(res)
            {
                boost::throw_exception(thread_resource_error(res, "boost:: recursive_mutex constructor failed in pthread_mutex_init"));
            }
            int const res2=pthread_cond_init(&cond,NULL);
            if(res2)
            {
                BOOST_VERIFY(!pthread_mutex_destroy(&m));
                boost::throw_exception(thread_resource_error(res2, "boost:: recursive_mutex constructor failed in pthread_cond_init"));
            }
            is_locked=false;
            count=0;
#endif
        }
        ~recursive_mutex()
        {
            BOOST_VERIFY(!pthread_mutex_destroy(&m));
#ifndef BOOST_THREAD_HAS_PTHREAD_MUTEXATTR_SETTYPE
            BOOST_VERIFY(!pthread_cond_destroy(&cond));
#endif
        }

#ifdef BOOST_THREAD_HAS_PTHREAD_MUTEXATTR_SETTYPE
        void lock()
        {
            BOOST_VERIFY(!pthread_mutex_lock(&m));
        }

        void unlock()
        {
            BOOST_VERIFY(!pthread_mutex_unlock(&m));
        }

        bool try_lock() BOOST_NOEXCEPT
        {
            int const res=pthread_mutex_trylock(&m);
            BOOST_ASSERT(!res || res==EBUSY);
            return !res;
        }
#define BOOST_THREAD_DEFINES_RECURSIVE_MUTEX_NATIVE_HANDLE
        typedef pthread_mutex_t* native_handle_type;
        native_handle_type native_handle()
        {
            return &m;
        }

#else
        void lock()
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(is_locked && pthread_equal(owner,pthread_self()))
            {
                ++count;
                return;
            }

            while(is_locked)
            {
                BOOST_VERIFY(!pthread_cond_wait(&cond,&m));
            }
            is_locked=true;
            ++count;
            owner=pthread_self();
        }

        void unlock()
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(!--count)
            {
                is_locked=false;
            }
            BOOST_VERIFY(!pthread_cond_signal(&cond));
        }

        bool try_lock()
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(is_locked && !pthread_equal(owner,pthread_self()))
            {
                return false;
            }
            is_locked=true;
            ++count;
            owner=pthread_self();
            return true;
        }

#endif

#if defined BOOST_THREAD_PROVIDES_NESTED_LOCKS
        typedef unique_lock<recursive_mutex> scoped_lock;
        typedef detail::try_lock_wrapper<recursive_mutex> scoped_try_lock;
#endif
    };

    typedef recursive_mutex recursive_try_mutex;

    class recursive_timed_mutex
    {
    private:
        pthread_mutex_t m;
#ifndef BOOST_USE_PTHREAD_RECURSIVE_TIMEDLOCK
        pthread_cond_t cond;
        bool is_locked;
        pthread_t owner;
        unsigned count;
#endif
    public:
        BOOST_THREAD_NO_COPYABLE(recursive_timed_mutex)
        recursive_timed_mutex()
        {
#ifdef BOOST_USE_PTHREAD_RECURSIVE_TIMEDLOCK
            pthread_mutexattr_t attr;

            int const init_attr_res=pthread_mutexattr_init(&attr);
            if(init_attr_res)
            {
                boost::throw_exception(thread_resource_error(init_attr_res, "boost:: recursive_timed_mutex constructor failed in pthread_mutexattr_init"));
            }
            int const set_attr_res=pthread_mutexattr_settype(&attr,PTHREAD_MUTEX_RECURSIVE);
            if(set_attr_res)
            {
                boost::throw_exception(thread_resource_error(set_attr_res, "boost:: recursive_timed_mutex constructor failed in pthread_mutexattr_settype"));
            }

            int const res=pthread_mutex_init(&m,&attr);
            if(res)
            {
                BOOST_VERIFY(!pthread_mutexattr_destroy(&attr));
                boost::throw_exception(thread_resource_error(res, "boost:: recursive_timed_mutex constructor failed in pthread_mutex_init"));
            }
            BOOST_VERIFY(!pthread_mutexattr_destroy(&attr));
#else
            int const res=pthread_mutex_init(&m,NULL);
            if(res)
            {
                boost::throw_exception(thread_resource_error(res, "boost:: recursive_timed_mutex constructor failed in pthread_mutex_init"));
            }
            int const res2=pthread_cond_init(&cond,NULL);
            if(res2)
            {
                BOOST_VERIFY(!pthread_mutex_destroy(&m));
                boost::throw_exception(thread_resource_error(res2, "boost:: recursive_timed_mutex constructor failed in pthread_cond_init"));
            }
            is_locked=false;
            count=0;
#endif
        }
        ~recursive_timed_mutex()
        {
            BOOST_VERIFY(!pthread_mutex_destroy(&m));
#ifndef BOOST_USE_PTHREAD_RECURSIVE_TIMEDLOCK
            BOOST_VERIFY(!pthread_cond_destroy(&cond));
#endif
        }

#if defined BOOST_THREAD_USES_DATETIME
        template<typename TimeDuration>
        bool timed_lock(TimeDuration const & relative_time)
        {
            return timed_lock(get_system_time()+relative_time);
        }
#endif

#ifdef BOOST_USE_PTHREAD_RECURSIVE_TIMEDLOCK
        void lock()
        {
            BOOST_VERIFY(!pthread_mutex_lock(&m));
        }

        void unlock()
        {
            BOOST_VERIFY(!pthread_mutex_unlock(&m));
        }

        bool try_lock()
        {
            int const res=pthread_mutex_trylock(&m);
            BOOST_ASSERT(!res || res==EBUSY);
            return !res;
        }
    private:
        bool do_try_lock_until(struct timespec const &timeout)
        {
            int const res=pthread_mutex_timedlock(&m,&timeout);
            BOOST_ASSERT(!res || res==ETIMEDOUT);
            return !res;
        }

    public:

#else
        void lock()
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(is_locked && pthread_equal(owner,pthread_self()))
            {
                ++count;
                return;
            }

            while(is_locked)
            {
                BOOST_VERIFY(!pthread_cond_wait(&cond,&m));
            }
            is_locked=true;
            ++count;
            owner=pthread_self();
        }

        void unlock()
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(!--count)
            {
                is_locked=false;
            }
            BOOST_VERIFY(!pthread_cond_signal(&cond));
        }

        bool try_lock() BOOST_NOEXCEPT
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(is_locked && !pthread_equal(owner,pthread_self()))
            {
                return false;
            }
            is_locked=true;
            ++count;
            owner=pthread_self();
            return true;
        }

    private:
        bool do_try_lock_until(struct timespec const &timeout)
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(is_locked && pthread_equal(owner,pthread_self()))
            {
                ++count;
                return true;
            }
            while(is_locked)
            {
                int const cond_res=pthread_cond_timedwait(&cond,&m,&timeout);
                if(cond_res==ETIMEDOUT)
                {
                    return false;
                }
                BOOST_ASSERT(!cond_res);
            }
            is_locked=true;
            ++count;
            owner=pthread_self();
            return true;
        }
    public:

#endif

#if defined BOOST_THREAD_USES_DATETIME
        bool timed_lock(system_time const & abs_time)
        {
            struct timespec const ts=detail::to_timespec(abs_time);
            return do_try_lock_until(ts);
        }
#endif
#ifdef BOOST_THREAD_USES_CHRONO
        template <class Rep, class Period>
        bool try_lock_for(const chrono::duration<Rep, Period>& rel_time)
        {
          return try_lock_until(chrono::steady_clock::now() + rel_time);
        }
        template <class Clock, class Duration>
        bool try_lock_until(const chrono::time_point<Clock, Duration>& t)
        {
          using namespace chrono;
          system_clock::time_point     s_now = system_clock::now();
          typename Clock::time_point  c_now = Clock::now();
          return try_lock_until(s_now + ceil<nanoseconds>(t - c_now));
        }
        template <class Duration>
        bool try_lock_until(const chrono::time_point<chrono::system_clock, Duration>& t)
        {
          using namespace chrono;
          typedef time_point<system_clock, nanoseconds> nano_sys_tmpt;
          return try_lock_until(nano_sys_tmpt(ceil<nanoseconds>(t.time_since_epoch())));
        }
        bool try_lock_until(const chrono::time_point<chrono::system_clock, chrono::nanoseconds>& tp)
        {
          //using namespace chrono;
          chrono::nanoseconds d = tp.time_since_epoch();
          timespec ts = boost::detail::to_timespec(d);
          return do_try_lock_until(ts);
        }
#endif

#define BOOST_THREAD_DEFINES_RECURSIVE_TIMED_MUTEX_NATIVE_HANDLE
        typedef pthread_mutex_t* native_handle_type;
        native_handle_type native_handle()
        {
            return &m;
        }

#if defined BOOST_THREAD_PROVIDES_NESTED_LOCKS
        typedef unique_lock<recursive_timed_mutex> scoped_timed_lock;
        typedef detail::try_lock_wrapper<recursive_timed_mutex> scoped_try_lock;
        typedef scoped_timed_lock scoped_lock;
#endif
    };

}

#include <boost/config/abi_suffix.hpp>

#endif
