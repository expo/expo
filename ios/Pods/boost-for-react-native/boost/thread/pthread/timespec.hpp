#ifndef BOOST_THREAD_PTHREAD_TIMESPEC_HPP
#define BOOST_THREAD_PTHREAD_TIMESPEC_HPP
//  (C) Copyright 2007-8 Anthony Williams
//  (C) Copyright 2012 Vicente J. Botet Escriba
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

#include <boost/thread/detail/config.hpp>
#include <boost/thread/thread_time.hpp>
#if defined BOOST_THREAD_USES_DATETIME
#include <boost/date_time/posix_time/conversion.hpp>
#endif
#include <pthread.h>
#ifndef _WIN32
#include <unistd.h>
#endif
#ifdef BOOST_THREAD_USES_CHRONO
#include <boost/chrono/duration.hpp>
#endif

#if defined(macintosh) || defined(__APPLE__) || defined(__APPLE_CC__)
#     define BOOST_THREAD_TIMESPEC_MAC_API
#include <sys/time.h> //for gettimeofday and timeval
#else
#include <time.h>  // for clock_gettime
#endif

#include <boost/config/abi_prefix.hpp>

namespace boost
{
  namespace detail
  {
#if defined BOOST_THREAD_USES_DATETIME
    inline struct timespec to_timespec(boost::system_time const& abs_time)
    {
      struct timespec timeout = { 0,0};
      boost::posix_time::time_duration const time_since_epoch=abs_time-boost::posix_time::from_time_t(0);

      timeout.tv_sec=time_since_epoch.total_seconds();
      timeout.tv_nsec=(long)(time_since_epoch.fractional_seconds()*(1000000000l/time_since_epoch.ticks_per_second()));
      return timeout;
    }
#endif
#if defined BOOST_THREAD_USES_CHRONO
    inline timespec to_timespec(chrono::nanoseconds const& ns)
    {
      struct timespec ts;
      ts.tv_sec = static_cast<long>(chrono::duration_cast<chrono::seconds>(ns).count());
      ts.tv_nsec = static_cast<long>((ns - chrono::duration_cast<chrono::seconds>(ns)).count());
      return ts;
    }

#endif

    inline timespec to_timespec(boost::intmax_t const& ns)
    {
      boost::intmax_t s = ns / 1000000000l;
      struct timespec ts;
      ts.tv_sec = static_cast<long> (s);
      ts.tv_nsec = static_cast<long> (ns - s * 1000000000l);
      return ts;
    }
    inline boost::intmax_t to_nanoseconds_int_max(timespec const& ts)
    {
      return static_cast<boost::intmax_t>(ts.tv_sec) * 1000000000l + ts.tv_nsec;
    }
    inline bool timespec_ge_zero(timespec const& ts)
    {
      return (ts.tv_sec >= 0) || (ts.tv_nsec >= 0);
    }
    inline timespec timespec_now()
    {
      timespec ts;

#if defined(BOOST_THREAD_TIMESPEC_MAC_API)
      timeval tv;
      ::gettimeofday(&tv, 0);
      ts.tv_sec = tv.tv_sec;
      ts.tv_nsec = tv.tv_usec * 1000;
#else
      if ( ::clock_gettime( CLOCK_REALTIME, &ts ) )
      {
        BOOST_ASSERT(0 && "Boost::Thread - Internal Error");
      }
#endif
      return ts;
    }
    inline timespec timespec_zero()
    {
      timespec ts;
      ts.tv_sec = 0;
      ts.tv_nsec = 0;
      return ts;
    }
    inline timespec timespec_plus(timespec const& lhs, timespec const& rhs)
    {
      return to_timespec(to_nanoseconds_int_max(lhs) + to_nanoseconds_int_max(rhs));
    }
    inline timespec timespec_minus(timespec const& lhs, timespec const& rhs)
    {
      return to_timespec(to_nanoseconds_int_max(lhs) - to_nanoseconds_int_max(rhs));
    }
    inline bool timespec_gt(timespec const& lhs, timespec const& rhs)
    {
      return to_nanoseconds_int_max(lhs) > to_nanoseconds_int_max(rhs);
    }
    inline bool timespec_ge(timespec const& lhs, timespec const& rhs)
    {
      return to_nanoseconds_int_max(lhs) >= to_nanoseconds_int_max(rhs);
    }

  }
}

#include <boost/config/abi_suffix.hpp>

#endif
