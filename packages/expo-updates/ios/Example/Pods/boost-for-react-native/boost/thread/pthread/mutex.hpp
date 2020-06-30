#ifndef BOOST_THREAD_PTHREAD_MUTEX_HPP
#define BOOST_THREAD_PTHREAD_MUTEX_HPP
// (C) Copyright 2007-8 Anthony Williams
// (C) Copyright 2011,2012,2015 Vicente J. Botet Escriba
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#include <boost/thread/detail/config.hpp>
#include <boost/assert.hpp>
#include <pthread.h>
#include <boost/throw_exception.hpp>
#include <boost/core/ignore_unused.hpp>
#include <boost/thread/exceptions.hpp>
#if defined BOOST_THREAD_PROVIDES_NESTED_LOCKS
#include <boost/thread/lock_types.hpp>
#endif
#include <boost/thread/thread_time.hpp>
#include <boost/thread/xtime.hpp>
#include <boost/assert.hpp>
#include <errno.h>
#include <boost/thread/pthread/timespec.hpp>
#include <boost/thread/pthread/pthread_mutex_scoped_lock.hpp>
#ifdef BOOST_THREAD_USES_CHRONO
#include <boost/chrono/system_clocks.hpp>
#include <boost/chrono/ceil.hpp>
#endif
#include <boost/thread/detail/delete.hpp>

#if (defined(_POSIX_TIMEOUTS) && (_POSIX_TIMEOUTS-0)>=200112L) \
 || (defined(__ANDROID__) && defined(__ANDROID_API__) && __ANDROID_API__ >= 21)
#ifndef BOOST_PTHREAD_HAS_TIMEDLOCK
#define BOOST_PTHREAD_HAS_TIMEDLOCK
#endif
#endif


#include <boost/config/abi_prefix.hpp>

#ifndef BOOST_THREAD_HAS_NO_EINTR_BUG
#define BOOST_THREAD_HAS_EINTR_BUG
#endif

namespace boost
{
  namespace posix {
#ifdef BOOST_THREAD_HAS_EINTR_BUG
    BOOST_FORCEINLINE int pthread_mutex_destroy(pthread_mutex_t* m)
    {
      int ret;
      do
      {
          ret = ::pthread_mutex_destroy(m);
      } while (ret == EINTR);
      return ret;
    }
    BOOST_FORCEINLINE int pthread_mutex_lock(pthread_mutex_t* m)
    {
      int ret;
      do
      {
          ret = ::pthread_mutex_lock(m);
      } while (ret == EINTR);
      return ret;
    }
    BOOST_FORCEINLINE int pthread_mutex_unlock(pthread_mutex_t* m)
    {
      int ret;
      do
      {
          ret = ::pthread_mutex_unlock(m);
      } while (ret == EINTR);
      return ret;
    }
#else
    BOOST_FORCEINLINE int pthread_mutex_destroy(pthread_mutex_t* m)
    {
      return ::pthread_mutex_destroy(m);
    }
    BOOST_FORCEINLINE int pthread_mutex_lock(pthread_mutex_t* m)
    {
      return ::pthread_mutex_lock(m);
    }
    BOOST_FORCEINLINE int pthread_mutex_unlock(pthread_mutex_t* m)
    {
      return ::pthread_mutex_unlock(m);
    }

#endif

  }
    class mutex
    {
    private:
        pthread_mutex_t m;
    public:
        BOOST_THREAD_NO_COPYABLE(mutex)

        mutex()
        {
            int const res=pthread_mutex_init(&m,NULL);
            if(res)
            {
                boost::throw_exception(thread_resource_error(res, "boost:: mutex constructor failed in pthread_mutex_init"));
            }
        }
        ~mutex()
        {
          int const res = posix::pthread_mutex_destroy(&m);
          boost::ignore_unused(res);
          BOOST_ASSERT(!res);
        }

        void lock()
        {
            int res = posix::pthread_mutex_lock(&m);
            if (res)
            {
                boost::throw_exception(lock_error(res,"boost: mutex lock failed in pthread_mutex_lock"));
            }
        }

        void unlock()
        {
            int res = posix::pthread_mutex_unlock(&m);
            (void)res;
            BOOST_ASSERT(res == 0);
//            if (res)
//            {
//                boost::throw_exception(lock_error(res,"boost: mutex unlock failed in pthread_mutex_unlock"));
//            }
        }

        bool try_lock()
        {
            int res;
            do
            {
                res = pthread_mutex_trylock(&m);
            } while (res == EINTR);
            if (res==EBUSY)
            {
                return false;
            }

            return !res;
        }

#define BOOST_THREAD_DEFINES_MUTEX_NATIVE_HANDLE
        typedef pthread_mutex_t* native_handle_type;
        native_handle_type native_handle()
        {
            return &m;
        }

#if defined BOOST_THREAD_PROVIDES_NESTED_LOCKS
        typedef unique_lock<mutex> scoped_lock;
        typedef detail::try_lock_wrapper<mutex> scoped_try_lock;
#endif
    };

    typedef mutex try_mutex;

    class timed_mutex
    {
    private:
        pthread_mutex_t m;
#ifndef BOOST_PTHREAD_HAS_TIMEDLOCK
        pthread_cond_t cond;
        bool is_locked;
#endif
    public:
        BOOST_THREAD_NO_COPYABLE(timed_mutex)
        timed_mutex()
        {
            int const res=pthread_mutex_init(&m,NULL);
            if(res)
            {
                boost::throw_exception(thread_resource_error(res, "boost:: timed_mutex constructor failed in pthread_mutex_init"));
            }
#ifndef BOOST_PTHREAD_HAS_TIMEDLOCK
            int const res2=pthread_cond_init(&cond,NULL);
            if(res2)
            {
                BOOST_VERIFY(!posix::pthread_mutex_destroy(&m));
                //BOOST_VERIFY(!pthread_mutex_destroy(&m));
                boost::throw_exception(thread_resource_error(res2, "boost:: timed_mutex constructor failed in pthread_cond_init"));
            }
            is_locked=false;
#endif
        }
        ~timed_mutex()
        {
            BOOST_VERIFY(!posix::pthread_mutex_destroy(&m));
#ifndef BOOST_PTHREAD_HAS_TIMEDLOCK
            BOOST_VERIFY(!pthread_cond_destroy(&cond));
#endif
        }

#if defined BOOST_THREAD_USES_DATETIME
        template<typename TimeDuration>
        bool timed_lock(TimeDuration const & relative_time)
        {
            return timed_lock(get_system_time()+relative_time);
        }
        bool timed_lock(boost::xtime const & absolute_time)
        {
            return timed_lock(system_time(absolute_time));
        }
#endif
#ifdef BOOST_PTHREAD_HAS_TIMEDLOCK
        void lock()
        {
            int res = posix::pthread_mutex_lock(&m);
            if (res)
            {
                boost::throw_exception(lock_error(res,"boost: mutex lock failed in pthread_mutex_lock"));
            }
        }

        void unlock()
        {
            int res = posix::pthread_mutex_unlock(&m);
            (void)res;
            BOOST_ASSERT(res == 0);
//            if (res)
//            {
//                boost::throw_exception(lock_error(res,"boost: mutex unlock failed in pthread_mutex_unlock"));
//            }
        }

        bool try_lock()
        {
          int res;
          do
          {
              res = pthread_mutex_trylock(&m);
          } while (res == EINTR);
          if (res==EBUSY)
          {
              return false;
          }

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
            while(is_locked)
            {
                BOOST_VERIFY(!pthread_cond_wait(&cond,&m));
            }
            is_locked=true;
        }

        void unlock()
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            is_locked=false;
            BOOST_VERIFY(!pthread_cond_signal(&cond));
        }

        bool try_lock()
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
            if(is_locked)
            {
                return false;
            }
            is_locked=true;
            return true;
        }

    private:
        bool do_try_lock_until(struct timespec const &timeout)
        {
            boost::pthread::pthread_mutex_scoped_lock const local_lock(&m);
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
            return true;
        }
    public:
#endif

#if defined BOOST_THREAD_USES_DATETIME
        bool timed_lock(system_time const & abs_time)
        {
            struct timespec const ts=boost::detail::to_timespec(abs_time);
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

#define BOOST_THREAD_DEFINES_TIMED_MUTEX_NATIVE_HANDLE
        typedef pthread_mutex_t* native_handle_type;
        native_handle_type native_handle()
        {
            return &m;
        }

#if defined BOOST_THREAD_PROVIDES_NESTED_LOCKS
        typedef unique_lock<timed_mutex> scoped_timed_lock;
        typedef detail::try_lock_wrapper<timed_mutex> scoped_try_lock;
        typedef scoped_timed_lock scoped_lock;
#endif
    };

}

#include <boost/config/abi_suffix.hpp>


#endif
