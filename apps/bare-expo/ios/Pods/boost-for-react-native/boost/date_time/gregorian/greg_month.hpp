#ifndef GREG_MONTH_HPP___
#define GREG_MONTH_HPP___

/* Copyright (c) 2002,2003 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the 
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland, Bart Garst
 * $Date$
 */

#include "boost/date_time/constrained_value.hpp"
#include "boost/date_time/date_defs.hpp"
#include "boost/shared_ptr.hpp"
#include "boost/date_time/compiler_config.hpp"
#include <stdexcept>
#include <string>
#include <map>
#include <algorithm>
#include <cctype>

namespace boost {
namespace gregorian {

  typedef date_time::months_of_year months_of_year;

  //bring enum values into the namespace
  using date_time::Jan;
  using date_time::Feb;
  using date_time::Mar;
  using date_time::Apr;
  using date_time::May;
  using date_time::Jun;
  using date_time::Jul;
  using date_time::Aug;
  using date_time::Sep;
  using date_time::Oct;
  using date_time::Nov;
  using date_time::Dec;
  using date_time::NotAMonth;
  using date_time::NumMonths;
  
  //! Exception thrown if a greg_month is constructed with a value out of range
  struct bad_month : public std::out_of_range
  {
    bad_month() : std::out_of_range(std::string("Month number is out of range 1..12")) {}
  };
  //! Build a policy class for the greg_month_rep
  typedef CV::simple_exception_policy<unsigned short, 1, 12, bad_month> greg_month_policies;
  //! A constrained range that implements the gregorian_month rules
  typedef CV::constrained_value<greg_month_policies> greg_month_rep;

  
  //! Wrapper class to represent months in gregorian based calendar
  class BOOST_DATE_TIME_DECL greg_month : public greg_month_rep {
  public:
    typedef date_time::months_of_year month_enum;
    typedef std::map<std::string, unsigned short> month_map_type;
    typedef boost::shared_ptr<month_map_type> month_map_ptr_type;
    //! Construct a month from the months_of_year enumeration
    greg_month(month_enum theMonth) : 
      greg_month_rep(static_cast<greg_month_rep::value_type>(theMonth)) {}
    //! Construct from a short value
    greg_month(unsigned short theMonth) : greg_month_rep(theMonth) {}
    //! Convert the value back to a short
    operator unsigned short()  const {return value_;}
    //! Returns month as number from 1 to 12
    unsigned short as_number() const {return value_;}
    month_enum as_enum() const {return static_cast<month_enum>(value_);}
    const char* as_short_string() const;
    const char* as_long_string()  const;
#ifndef BOOST_NO_STD_WSTRING
    const wchar_t* as_short_wstring() const;
    const wchar_t* as_long_wstring()  const;
#endif // BOOST_NO_STD_WSTRING
    //! Shared pointer to a map of Month strings (Names & Abbrev) & numbers
    static month_map_ptr_type get_month_map_ptr();

    /* parameterized as_*_string functions are intended to be called
     * from a template function: "... as_short_string(charT c='\0');" */
    const char* as_short_string(char) const
    {
      return as_short_string();
    }
    const char* as_long_string(char) const
    {
      return as_long_string();
    }
#ifndef BOOST_NO_STD_WSTRING
    const wchar_t* as_short_string(wchar_t) const
    {
      return as_short_wstring();
    }
    const wchar_t* as_long_string(wchar_t) const
    {
      return as_long_wstring();
    }
#endif // BOOST_NO_STD_WSTRING
  };

} } //namespace gregorian



#endif
