
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_COROUTINES2_DETAIL_FORCED_UNWIND_HPP
#define BOOST_COROUTINES2_DETAIL_FORCED_UNWIND_HPP

#include <exception>

#include <boost/assert.hpp>
#include <boost/config.hpp>

#include <boost/context/execution_context.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace coroutines2 {
namespace detail {

struct forced_unwind {};

inline
void * unwind_coroutine( void * data) {
    throw forced_unwind{};
    return data;
}

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_COROUTINES2_DETAIL_FORCED_UNWIND_HPP
