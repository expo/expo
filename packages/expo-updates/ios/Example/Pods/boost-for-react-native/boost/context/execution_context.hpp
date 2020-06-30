
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#include <boost/context/detail/config.hpp>

#if ! defined(BOOST_CONTEXT_NO_CXX11)
# if (defined(BOOST_EXECUTION_CONTEXT) && (BOOST_EXECUTION_CONTEXT == 1))
#  if !defined(BOOST_NO_CXX11_THREAD_LOCAL)
#   include <boost/context/execution_context_v1.hpp>
#  else
#   error "keyword thread_local not supported"
#  endif
# else
#  include <boost/context/execution_context_v2.hpp>
# endif
#endif
