//  boost/endian/detail/cover_operators.hpp ----------------------------------//

//  Copyright Darin Adler 2000
//  Copyright Beman Dawes 2008

//  Distributed under the Boost Software License, Version 1.0. (See accompanying
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_ENDIAN_COVER_OPERATORS_HPP
#define BOOST_ENDIAN_COVER_OPERATORS_HPP

#if defined(_MSC_VER)  
# pragma warning(push)  
# pragma warning(disable:4365)  // conversion ... signed/unsigned mismatch
#endif

# ifndef BOOST_ENDIAN_MINIMAL_COVER_OPERATORS
#   include <boost/operators.hpp>
# endif

#include <boost/config.hpp>
#include <iosfwd>

namespace boost
{
  namespace endian
  {

//--------------------------------------------------------------------------------------//

//  A class that adds arithmetic operators to an arithmetic cover class
//
//  Uses the curiously recurring template pattern (CRTP).
//
//  If the class being covered has a non-explicit conversion to an integer type
//  then a smaller number of cover operations are needed. Define the macro
//  BOOST_ENDIAN_MINIMAL_COVER_OPERATORS to indicate this.
//
//  Define BOOST_NO_IO_COVER_OPERATORS if I/O cover operations are not desired.

//--------------------------------------------------------------------------------------//

    template <class D,   // D is the CRTP derived type, i.e. the cover class
              class ArithmeticT>
    class cover_operators
#    ifndef BOOST_ENDIAN_MINIMAL_COVER_OPERATORS
      : boost::operators<D>
#    endif
    {
      // The other operations take advantage of the type conversion that's
      // built into unary +.

      // Unary operations.
      friend ArithmeticT operator+(const D& x) BOOST_NOEXCEPT { return x; }
#   ifndef BOOST_ENDIAN_MINIMAL_COVER_OPERATORS
      friend ArithmeticT operator-(const D& x) BOOST_NOEXCEPT { return -+x; }
      friend ArithmeticT operator~(const D& x) BOOST_NOEXCEPT { return ~+x; }
      friend ArithmeticT operator!(const D& x) BOOST_NOEXCEPT { return !+x; }

      // The basic ordering operations.
      friend bool operator==(const D& x, ArithmeticT y) BOOST_NOEXCEPT { return +x == y; }
      friend bool operator<(const D& x, ArithmeticT y) BOOST_NOEXCEPT { return +x < y; }
#   endif
      
      // The basic arithmetic operations.
      friend D& operator+=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x + y); }
      friend D& operator-=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x - y); }
      friend D& operator*=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x * y); }
      friend D& operator/=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x / y); }
      friend D& operator%=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x % y); }
      friend D& operator&=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x & y); }
      friend D& operator|=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x | y); }
      friend D& operator^=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x ^ y); }
      friend D& operator<<=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x << y); }
      friend D& operator>>=(D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return x = static_cast<ArithmeticT>(+x >> y); }
      
      // A few binary arithmetic operations not covered by operators base class.
      friend ArithmeticT operator<<(const D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return static_cast<ArithmeticT>(+x << y); }
      friend ArithmeticT operator>>(const D& x, ArithmeticT y) BOOST_NOEXCEPT
        { return static_cast<ArithmeticT>(+x >> y); }
      
      // Auto-increment and auto-decrement can be defined in terms of the
      // arithmetic operations.
      friend D& operator++(D& x) BOOST_NOEXCEPT { return x += 1; }
      friend D& operator--(D& x) BOOST_NOEXCEPT { return x -= 1; }

#   ifdef BOOST_ENDIAN_MINIMAL_COVER_OPERATORS
      friend D operator++(D& x, int) BOOST_NOEXCEPT
      { 
        D tmp(x);
        x += 1;
        return tmp;
      }
      friend D operator--(D& x, int) BOOST_NOEXCEPT
      { 
        D tmp(x);
        x -= 1;
        return tmp;
      }
#   endif

#   ifndef BOOST_NO_IO_COVER_OPERATORS

      // Stream inserter
      template <class charT, class traits>
      friend std::basic_ostream<charT, traits>&
        operator<<(std::basic_ostream<charT, traits>& os, const D& x)
      {
        return os << +x; 
      }

      // Stream extractor 
      template <class charT, class traits>
      friend std::basic_istream<charT, traits>&
        operator>>(std::basic_istream<charT, traits>& is, D& x)
      {
        ArithmeticT i;
        if (is >> i)
          x = i;
        return is;
      }
#   endif
    };
  } // namespace endian
} // namespace boost

#if defined(_MSC_VER)  
# pragma warning(pop)  
#endif 

#endif // BOOST_ENDIAN_COVER_OPERATORS_HPP
