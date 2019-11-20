//  boost/integer/cover_operators.hpp ----------------------------------------//

//  Copyright Darin Adler 2000
//  Copyright Beman Dawes 2008

//  Distributed under the Boost Software License, Version 1.0. (See accompanying
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//----------------------------------------------------------------------------//

//  If the class being covered has a non-explicit conversion to an integer type
//  then a smaller number of cover operations are needed. Define the macro
//  BOOST_MINIMAL_INTEGER_COVER_OPERATORS to indicate this.

//  Define BOOST_NO_IO_COVER_OPERATORS if I/O cover operations are not desired.

//----------------------------------------------------------------------------//

#ifndef BOOST_SPIRIT_INTEGER_COVER_OPERATORS_HPP
#define BOOST_SPIRIT_INTEGER_COVER_OPERATORS_HPP

#if defined(_MSC_VER)
#pragma once
#endif

# ifndef BOOST_MINIMAL_INTEGER_COVER_OPERATORS
#   include <boost/operators.hpp>
# endif

#include <iosfwd>

namespace boost { namespace spirit
{
  namespace endian
  {

  // A class that adds integer operators to an integer cover class

    template <typename T, typename IntegerType>
    class cover_operators
#    ifndef BOOST_MINIMAL_INTEGER_COVER_OPERATORS
      : boost::operators<T>
#    endif
    {
      // The other operations take advantage of the type conversion that's
      // built into unary +.

      // Unary operations.
      friend IntegerType operator+(const T& x) { return x; }
#   ifndef BOOST_MINIMAL_INTEGER_COVER_OPERATORS
      friend IntegerType operator-(const T& x) { return -+x; }
      friend IntegerType operator~(const T& x) { return ~+x; }
      friend IntegerType operator!(const T& x) { return !+x; }

      // The basic ordering operations.
      friend bool operator==(const T& x, IntegerType y) { return +x == y; }
      friend bool operator<(const T& x, IntegerType y) { return +x < y; }
#   endif
      
      // The basic arithmetic operations.
      friend T& operator+=(T& x, IntegerType y) { return x = +x + y; }
      friend T& operator-=(T& x, IntegerType y) { return x = +x - y; }
      friend T& operator*=(T& x, IntegerType y) { return x = +x * y; }
      friend T& operator/=(T& x, IntegerType y) { return x = +x / y; }
      friend T& operator%=(T& x, IntegerType y) { return x = +x % y; }
      friend T& operator&=(T& x, IntegerType y) { return x = +x & y; }
      friend T& operator|=(T& x, IntegerType y) { return x = +x | y; }
      friend T& operator^=(T& x, IntegerType y) { return x = +x ^ y; }
      friend T& operator<<=(T& x, IntegerType y) { return x = +x << y; }
      friend T& operator>>=(T& x, IntegerType y) { return x = +x >> y; }
      
      // A few binary arithmetic operations not covered by operators base class.
      friend IntegerType operator<<(const T& x, IntegerType y) { return +x << y; }
      friend IntegerType operator>>(const T& x, IntegerType y) { return +x >> y; }
      
      // Auto-increment and auto-decrement can be defined in terms of the
      // arithmetic operations.
      friend T& operator++(T& x) { return x += 1; }
      friend T& operator--(T& x) { return x -= 1; }

#   ifdef BOOST_MINIMAL_INTEGER_COVER_OPERATORS
      friend T operator++(T& x, int)
      { 
        T tmp(x);
        x += 1;
        return tmp;
      }
      friend T operator--(T& x, int)
      { 
        T tmp(x);
        x -= 1;
        return tmp;
      }
#   endif

#   ifndef BOOST_NO_IO_COVER_OPERATORS
  // TODO: stream I/O needs to be templatized on the stream type, so will
  // work with wide streams, etc.

      // Stream input and output.
      friend std::ostream& operator<<(std::ostream& s, const T& x)
        { return s << +x; }
      friend std::istream& operator>>(std::istream& s, T& x)
        {
          IntegerType i;
          if (s >> i)
            x = i;
          return s;
        }
#   endif
    };
  } // namespace endian
}} // namespace boost::spirit

#endif // BOOST_SPIRIT_INTEGER_COVER_OPERATORS_HPP
