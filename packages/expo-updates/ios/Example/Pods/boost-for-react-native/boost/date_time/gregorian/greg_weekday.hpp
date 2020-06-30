#ifndef GREG_WEEKDAY_HPP___
#define GREG_WEEKDAY_HPP___

/* Copyright (c) 2002,2003 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the 
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland, Bart Garst
 * $Date$
 */

#include "boost/date_time/constrained_value.hpp"
#include "boost/date_time/date_defs.hpp"
#include "boost/date_time/compiler_config.hpp"
#include <stdexcept>
#include <string>

namespace boost {
namespace gregorian {

  //bring enum values into the namespace
  using date_time::Sunday;
  using date_time::Monday;
  using date_time::Tuesday;
  using date_time::Wednesday;
  using date_time::Thursday;
  using date_time::Friday;
  using date_time::Saturday;


  //! Exception that flags that a weekday number is incorrect
  struct bad_weekday : public std::out_of_range
  {
    bad_weekday() : std::out_of_range(std::string("Weekday is out of range 0..6")) {}
  };
  typedef CV::simple_exception_policy<unsigned short, 0, 6, bad_weekday> greg_weekday_policies;
  typedef CV::constrained_value<greg_weekday_policies> greg_weekday_rep;


  //! Represent a day within a week (range 0==Sun to 6==Sat)
  class BOOST_DATE_TIME_DECL greg_weekday : public greg_weekday_rep {
  public:
    typedef boost::date_time::weekdays weekday_enum;
    greg_weekday(unsigned short day_of_week_num) :
      greg_weekday_rep(day_of_week_num)
    {}

    unsigned short as_number() const {return value_;}
    const char* as_short_string() const;
    const char* as_long_string()  const;
#ifndef BOOST_NO_STD_WSTRING
    const wchar_t* as_short_wstring() const;
    const wchar_t* as_long_wstring()  const;
#endif // BOOST_NO_STD_WSTRING
    weekday_enum as_enum() const {return static_cast<weekday_enum>(value_);}


  };



} } //namespace gregorian



#endif
