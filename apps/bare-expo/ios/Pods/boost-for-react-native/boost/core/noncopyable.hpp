//  Boost noncopyable.hpp header file  --------------------------------------//

//  (C) Copyright Beman Dawes 1999-2003. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/utility for documentation.

#ifndef BOOST_CORE_NONCOPYABLE_HPP
#define BOOST_CORE_NONCOPYABLE_HPP

#include <boost/config.hpp>

namespace boost {

//  Private copy constructor and copy assignment ensure classes derived from
//  class noncopyable cannot be copied.

//  Contributed by Dave Abrahams

namespace noncopyable_  // protection from unintended ADL
{
  class noncopyable
  {
  protected:
#if !defined(BOOST_NO_CXX11_DEFAULTED_FUNCTIONS) && !defined(BOOST_NO_CXX11_NON_PUBLIC_DEFAULTED_FUNCTIONS)
      BOOST_CONSTEXPR noncopyable() = default;
      ~noncopyable() = default;
#else
      noncopyable() {}
      ~noncopyable() {}
#endif
#if !defined(BOOST_NO_CXX11_DELETED_FUNCTIONS)
      noncopyable( const noncopyable& ) = delete;
      noncopyable& operator=( const noncopyable& ) = delete;
#else
  private:  // emphasize the following members are private
      noncopyable( const noncopyable& );
      noncopyable& operator=( const noncopyable& );
#endif
  };
}

typedef noncopyable_::noncopyable noncopyable;

} // namespace boost

#endif  // BOOST_CORE_NONCOPYABLE_HPP
