//  branch hints
//  Copyright (C) 2007, 2008 Tim Blechmann
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_LOCKFREE_BRANCH_HINTS_HPP_INCLUDED
#define BOOST_LOCKFREE_BRANCH_HINTS_HPP_INCLUDED

namespace boost    {
namespace lockfree {
namespace detail   {
/** \brief hint for the branch prediction */
inline bool likely(bool expr)
{
#ifdef __GNUC__
    return __builtin_expect(expr, true);
#else
    return expr;
#endif
    }

/** \brief hint for the branch prediction */
inline bool unlikely(bool expr)
{
#ifdef __GNUC__
    return __builtin_expect(expr, false);
#else
    return expr;
#endif
}

} /* namespace detail */
} /* namespace lockfree */
} /* namespace boost */

#endif /* BOOST_LOCKFREE_BRANCH_HINTS_HPP_INCLUDED */
