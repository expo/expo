//-----------------------------------------------------------------------------
// boost variant/detail/forced_return.hpp header file
// See http://www.boost.org for updates, documentation, and revision history.
//-----------------------------------------------------------------------------
//
// Copyright (c) 2003 Eric Friedman
// Copyright (c) 2015-2016 Antony Polukhin
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_VARIANT_DETAIL_FORCED_RETURN_HPP
#define BOOST_VARIANT_DETAIL_FORCED_RETURN_HPP

#include <boost/config.hpp>
#include <boost/variant/detail/generic_result_type.hpp>
#include <boost/assert.hpp>
#include <cstdlib> // std::abort


#ifdef BOOST_MSVC
# pragma warning( push )
# pragma warning( disable : 4702 ) // unreachable code
#endif

namespace boost { namespace detail { namespace variant {

BOOST_NORETURN inline void forced_return_no_return() { // fixes `must return a value` warnings
    using namespace std;
    abort(); // some implementations have no std::abort
}


///////////////////////////////////////////////////////////////////////////////
// (detail) function template forced_return
//
// Logical error to permit invocation at runtime, but (artificially) satisfies
// compile-time requirement of returning a result value.
//
template <typename T>
BOOST_NORETURN inline
    BOOST_VARIANT_AUX_GENERIC_RESULT_TYPE(T)
forced_return()
{
    // logical error: should never be here! (see above)
    BOOST_ASSERT(false);

    forced_return_no_return();

#ifdef BOOST_NO_NORETURN
    BOOST_VARIANT_AUX_GENERIC_RESULT_TYPE(T) (*dummy)() = 0;
    return dummy();
#endif
}

}}} // namespace boost::detail::variant


#ifdef BOOST_MSVC
# pragma warning( pop )
#endif

#endif // BOOST_VARIANT_DETAIL_FORCED_RETURN_HPP
