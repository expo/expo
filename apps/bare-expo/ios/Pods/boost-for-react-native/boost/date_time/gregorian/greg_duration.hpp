#ifndef GREG_DURATION_HPP___
#define GREG_DURATION_HPP___

/* Copyright (c) 2002,2003 CrystalClear Software, Inc.
 * Use, modification and distribution is subject to the 
 * Boost Software License, Version 1.0. (See accompanying
 * file LICENSE_1_0.txt or http://www.boost.org/LICENSE_1_0.txt)
 * Author: Jeff Garland, Bart Garst 
 * $Date$
 */

#include <boost/date_time/date_duration.hpp>
#include <boost/date_time/int_adapter.hpp>
#include <boost/date_time/special_defs.hpp>

namespace boost {
namespace gregorian {

  //!An internal date representation that includes infinities, not a date
  typedef boost::date_time::duration_traits_adapted date_duration_rep;

  //! Durations in days for gregorian system
  /*! \ingroup date_basics
   */
  class date_duration :
    public boost::date_time::date_duration< date_duration_rep >
  {
    typedef boost::date_time::date_duration< date_duration_rep > base_type;

  public:
    typedef base_type::duration_rep duration_rep;

    //! Construct from a day count
    explicit date_duration(duration_rep day_count = 0) : base_type(day_count) {}

    //! construct from special_values
    date_duration(date_time::special_values sv) : base_type(sv) {}

    //! Copy constructor
    date_duration(const date_duration& other) : base_type(static_cast< base_type const& >(other))
    {}

    //! Construct from another date_duration
    date_duration(const base_type& other) : base_type(other)
    {}

    //  Relational operators
    //  NOTE: Because of date_time::date_duration< T > design choice we don't use Boost.Operators here,
    //  because we need the class to be a direct base. Either lose EBO, or define operators by hand.
    //  The latter is more effecient.
    bool operator== (const date_duration& rhs) const
    {
      return base_type::operator== (rhs);
    }
    bool operator!= (const date_duration& rhs) const
    {
      return !operator== (rhs);
    }
    bool operator< (const date_duration& rhs) const
    {
      return base_type::operator< (rhs);
    }
    bool operator> (const date_duration& rhs) const
    {
      return !(base_type::operator< (rhs) || base_type::operator== (rhs));
    }
    bool operator<= (const date_duration& rhs) const
    {
      return (base_type::operator< (rhs) || base_type::operator== (rhs));
    }
    bool operator>= (const date_duration& rhs) const
    {
      return !base_type::operator< (rhs);
    }

    //! Subtract another duration -- result is signed
    date_duration& operator-= (const date_duration& rhs)
    {
      base_type::operator-= (rhs);
      return *this;
    }
    friend date_duration operator- (date_duration rhs, date_duration const& lhs)
    {
      rhs -= lhs;
      return rhs;
    }

    //! Add a duration -- result is signed
    date_duration& operator+= (const date_duration& rhs)
    {
      base_type::operator+= (rhs);
      return *this;
    }
    friend date_duration operator+ (date_duration rhs, date_duration const& lhs)
    {
      rhs += lhs;
      return rhs;
    }

    //! unary- Allows for dd = -date_duration(2); -> dd == -2
    date_duration operator- ()const
    {
      return date_duration(get_rep() * (-1));
    }

    //! Division operations on a duration with an integer.
    date_duration& operator/= (int divisor)
    {
      base_type::operator/= (divisor);
      return *this;
    }
    friend date_duration operator/ (date_duration rhs, int lhs)
    {
      rhs /= lhs;
      return rhs;
    }

    //! Returns the smallest duration -- used by to calculate 'end'
    static date_duration unit()
    {
      return date_duration(base_type::unit().get_rep());
    }
  };      

  //! Shorthand for date_duration
  typedef date_duration days;

} } //namespace gregorian

#if defined(BOOST_DATE_TIME_OPTIONAL_GREGORIAN_TYPES)
#include <boost/date_time/date_duration_types.hpp>
#endif

#endif
