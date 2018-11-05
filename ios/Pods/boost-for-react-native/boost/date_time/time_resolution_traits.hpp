#ifndef DATE_TIME_TIME_RESOLUTION_TRAITS_HPP
#define DATE_TIME_TIME_RESOLUTION_TRAITS_HPP

/* Copyright (c) 2002,2003 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland, Bart Garst
 * $Date$
 */


#include <boost/cstdint.hpp>
#include <boost/date_time/time_defs.hpp>
#include <boost/date_time/int_adapter.hpp>
#include <boost/date_time/compiler_config.hpp>

namespace boost {
namespace date_time {

  //! Simple function to calculate absolute value of a numeric type
  template <typename T>
  // JDG [7/6/02 made a template],
  // moved here from time_duration.hpp 2003-Sept-4.
  inline T absolute_value(T x)
  {
    return x < 0 ? -x : x;
  }

  //! traits struct for time_resolution_traits implementation type
  struct time_resolution_traits_bi32_impl {
    typedef boost::int32_t int_type;
    typedef boost::int32_t impl_type;
    static int_type as_number(impl_type i){ return i;}
    //! Used to determine if implemented type is int_adapter or int
    static bool is_adapted() { return false;}
  };
  //! traits struct for time_resolution_traits implementation type
  struct time_resolution_traits_adapted32_impl {
    typedef boost::int32_t int_type;
    typedef boost::date_time::int_adapter<boost::int32_t> impl_type;
    static int_type as_number(impl_type i){ return i.as_number();}
    //! Used to determine if implemented type is int_adapter or int
    static bool is_adapted() { return true;}
  };
  //! traits struct for time_resolution_traits implementation type
  struct time_resolution_traits_bi64_impl {
    typedef boost::int64_t int_type;
    typedef boost::int64_t impl_type;
    static int_type as_number(impl_type i){ return i;}
    //! Used to determine if implemented type is int_adapter or int
    static bool is_adapted() { return false;}
  };
  //! traits struct for time_resolution_traits implementation type
  struct time_resolution_traits_adapted64_impl {
    typedef boost::int64_t int_type;
    typedef boost::date_time::int_adapter<boost::int64_t> impl_type;
    static int_type as_number(impl_type i){ return i.as_number();}
    //! Used to determine if implemented type is int_adapter or int
    static bool is_adapted() { return true;}
  };

  template<typename frac_sec_type,
           time_resolutions res,
#if (defined(BOOST_MSVC) && (_MSC_VER < 1300))
           boost::int64_t resolution_adjust,
#else
           typename frac_sec_type::int_type resolution_adjust,
#endif
           unsigned short frac_digits,
           typename var_type = boost::int32_t >
  class time_resolution_traits {
  public:
    typedef typename frac_sec_type::int_type fractional_seconds_type;
    typedef typename frac_sec_type::int_type tick_type;
    typedef typename frac_sec_type::impl_type impl_type;
    typedef var_type  day_type;
    typedef var_type  hour_type;
    typedef var_type  min_type;
    typedef var_type  sec_type;

    // bring in function from frac_sec_type traits structs
    static fractional_seconds_type as_number(impl_type i)
    {
      return frac_sec_type::as_number(i);
    }
    static bool is_adapted()
    {
      return frac_sec_type::is_adapted();
    }

    //Would like this to be frac_sec_type, but some compilers complain
#if (defined(BOOST_MSVC) && (_MSC_VER < 1300))
    BOOST_STATIC_CONSTANT(boost::int64_t, ticks_per_second = resolution_adjust);
#else
    BOOST_STATIC_CONSTANT(fractional_seconds_type, ticks_per_second = resolution_adjust);
#endif

    static time_resolutions resolution()
    {
      return res;
    }
    static unsigned short num_fractional_digits()
    {
      return frac_digits;
    }
    static fractional_seconds_type res_adjust()
    {
      return resolution_adjust;
    }
    //! Any negative argument results in a negative tick_count
    static tick_type to_tick_count(hour_type hours,
                                   min_type  minutes,
                                   sec_type  seconds,
                                   fractional_seconds_type  fs)
    {
      if(hours < 0 || minutes < 0 || seconds < 0 || fs < 0)
      {
        hours = absolute_value(hours);
        minutes = absolute_value(minutes);
        seconds = absolute_value(seconds);
        fs = absolute_value(fs);
        return (((((fractional_seconds_type(hours)*3600)
                   + (fractional_seconds_type(minutes)*60)
                   + seconds)*res_adjust()) + fs) * -1);
      }

      return (((fractional_seconds_type(hours)*3600)
               + (fractional_seconds_type(minutes)*60)
               + seconds)*res_adjust()) + fs;
    }

  };

  typedef time_resolution_traits<time_resolution_traits_adapted32_impl, milli, 1000, 3 > milli_res;
  typedef time_resolution_traits<time_resolution_traits_adapted64_impl, micro, 1000000, 6 > micro_res;
  typedef time_resolution_traits<time_resolution_traits_adapted64_impl, nano,  1000000000, 9 > nano_res;


} } //namespace date_time



#endif
