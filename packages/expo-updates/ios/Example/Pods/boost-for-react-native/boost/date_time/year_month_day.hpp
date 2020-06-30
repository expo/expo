#ifndef YearMonthDayBase_HPP__
#define YearMonthDayBase_HPP__

/* Copyright (c) 2002,2003 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the 
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland 
 * $Date$
 */

namespace boost {
namespace date_time {

  //! Allow rapid creation of ymd triples of different types
  template<typename YearType, typename MonthType, typename DayType>
  struct year_month_day_base {
    year_month_day_base(YearType  year, 
                        MonthType month,
                        DayType   day);
    YearType year;
    MonthType month;
    DayType day;
    typedef YearType  year_type;
    typedef MonthType month_type;
    typedef DayType   day_type;
  };
  
  
  //! A basic constructor
  template<typename YearType, typename MonthType, typename DayType>
  inline
  year_month_day_base<YearType,MonthType,DayType>::year_month_day_base(YearType y, 
                                                                       MonthType m,
                                                                       DayType d) :
    year(y),
    month(m),
    day(d)
  {}
  
} }//namespace date_time


#endif

