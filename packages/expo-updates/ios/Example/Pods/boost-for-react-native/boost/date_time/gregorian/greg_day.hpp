#ifndef GREG_DAY_HPP___
#define GREG_DAY_HPP___

/* Copyright (c) 2002,2003 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the 
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland 
 * $Date$
 */

#include "boost/date_time/constrained_value.hpp"
#include <stdexcept>
#include <string>

namespace boost {
namespace gregorian {

  //! Exception type for gregorian day of month (1..31)
  struct bad_day_of_month : public std::out_of_range
  {
    bad_day_of_month() : 
      std::out_of_range(std::string("Day of month value is out of range 1..31")) 
    {}
    //! Allow other classes to throw with unique string for bad day like Feb 29
    bad_day_of_month(const std::string& s) : 
      std::out_of_range(s) 
    {}
  };
  //! Policy class that declares error handling and day of month ranges
  typedef CV::simple_exception_policy<unsigned short, 1, 31, bad_day_of_month> greg_day_policies;

  //! Generated represetation for gregorian day of month
  typedef CV::constrained_value<greg_day_policies> greg_day_rep;

  //! Represent a day of the month (range 1 - 31) 
  /*! This small class allows for simple conversion an integer value into
      a day of the month for a standard gregorian calendar.  The type 
      is automatically range checked so values outside of the range 1-31
      will cause a bad_day_of_month exception
  */
  class greg_day : public greg_day_rep {
  public:
    greg_day(unsigned short day_of_month) : greg_day_rep(day_of_month) {}
    unsigned short as_number() const {return value_;}
    operator unsigned short()  const {return value_;}
  private:
    
  };



} } //namespace gregorian



#endif
