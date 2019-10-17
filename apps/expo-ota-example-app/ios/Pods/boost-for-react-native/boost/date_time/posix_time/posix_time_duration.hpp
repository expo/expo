#ifndef POSIX_TIME_DURATION_HPP___
#define POSIX_TIME_DURATION_HPP___

/* Copyright (c) 2002,2003 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the 
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland
 * $Date$
 */

#include "boost/date_time/posix_time/posix_time_config.hpp"

namespace boost {
namespace posix_time {

  //! Allows expression of durations as an hour count
  /*! \ingroup time_basics
   */
  class hours : public time_duration
  {
  public:
    explicit hours(long h) :
      time_duration(static_cast<hour_type>(h),0,0)
    {}
  };

  //! Allows expression of durations as a minute count
  /*! \ingroup time_basics
   */
  class minutes : public time_duration
  {
  public:
    explicit minutes(long m) :
      time_duration(0,static_cast<min_type>(m),0)
    {}
  };

  //! Allows expression of durations as a seconds count
  /*! \ingroup time_basics
   */
  class seconds : public time_duration
  {
  public:
    explicit seconds(long s) :
      time_duration(0,0,static_cast<sec_type>(s))
    {}
  };


  //! Allows expression of durations as milli seconds
  /*! \ingroup time_basics
   */
  typedef date_time::subsecond_duration<time_duration,1000> millisec;
  typedef date_time::subsecond_duration<time_duration,1000> milliseconds;

  //! Allows expression of durations as micro seconds
  /*! \ingroup time_basics
   */
  typedef date_time::subsecond_duration<time_duration,1000000> microsec;
  typedef date_time::subsecond_duration<time_duration,1000000> microseconds;

  //This is probably not needed anymore...
#if defined(BOOST_DATE_TIME_HAS_NANOSECONDS)

  //! Allows expression of durations as nano seconds
  /*! \ingroup time_basics
   */
  typedef date_time::subsecond_duration<time_duration,1000000000> nanosec;
  typedef date_time::subsecond_duration<time_duration,1000000000> nanoseconds;


#endif




} }//namespace posix_time


#endif

