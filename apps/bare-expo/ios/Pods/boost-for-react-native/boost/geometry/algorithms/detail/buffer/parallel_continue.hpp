// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012-2014 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_PARALLEL_CONTINUE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_PARALLEL_CONTINUE_HPP


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace buffer
{

template <typename T>
inline bool parallel_continue(T dx1, T dy1, T dx2, T dy2)
{
    T const dot = dx1 * dx2 + dy1 * dy2;
    return dot > 0;
}

}} // namespace detail::buffer
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_PARALLEL_CONTINUE_HPP
