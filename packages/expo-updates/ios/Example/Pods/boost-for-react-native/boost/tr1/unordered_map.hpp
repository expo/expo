//  (C) Copyright John Maddock 2008.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_UNORDERED_MAP_HPP_INCLUDED
#  define BOOST_TR1_UNORDERED_MAP_HPP_INCLUDED
#  include <boost/tr1/detail/config.hpp>

#ifdef BOOST_HAS_TR1_UNORDERED_MAP

#  if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
#     include_next BOOST_TR1_HEADER(unordered_map)
#  else
#     include <boost/tr1/detail/config_all.hpp>
#     include BOOST_TR1_STD_HEADER(BOOST_TR1_PATH(unordered_map))
#  endif

#else

#include <boost/unordered_map.hpp>

namespace std{ namespace tr1{

   using ::boost::unordered_map;
   using ::boost::unordered_multimap;
   using ::boost::swap;

} } // namespaces

#endif

#endif
