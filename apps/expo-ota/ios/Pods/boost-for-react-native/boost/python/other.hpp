#ifndef OTHER_DWA20020601_HPP
# define OTHER_DWA20020601_HPP

# include <boost/python/detail/prefix.hpp>
// Copyright David Abrahams 2002.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

# pragma once

# include <boost/config.hpp>

namespace boost { namespace python {

template<class T> struct other
{ 
    typedef T type;
};

namespace detail
{
  template<typename T>
  class is_other
  {
   public:
      BOOST_STATIC_CONSTANT(bool, value = false); 
  };

  template<typename T>
  class is_other<other<T> >
  {
   public:
      BOOST_STATIC_CONSTANT(bool, value = true);
  };

  template<typename T>
  class unwrap_other
  {
   public:
      typedef T type;
  };

  template<typename T>
  class unwrap_other<other<T> >
  {
   public:
      typedef T type;
  };
}

}} // namespace boost::python

#endif // #ifndef OTHER_DWA20020601_HPP
