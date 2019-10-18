// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2014 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014, Oracle and/or its affiliates.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_LESS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_LESS_HPP

#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/util/math.hpp>

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DISPATCH
namespace detail_dispatch { namespace relate {

// TODO: Integrate it with geometry::less?

template <typename Point1,
          typename Point2,
          std::size_t I = 0,
          std::size_t D = geometry::dimension<Point1>::value>
struct less
{
    static inline bool apply(Point1 const& left, Point2 const& right)
    {
        typename geometry::coordinate_type<Point1>::type
            cleft = geometry::get<I>(left);
        typename geometry::coordinate_type<Point2>::type
            cright = geometry::get<I>(right);

        if ( geometry::math::equals(cleft, cright) )
        {
            return less<Point1, Point2, I + 1, D>::apply(left, right);
        }
        else
        {
            return cleft < cright;
        }
    }
};

template <typename Point1, typename Point2, std::size_t D>
struct less<Point1, Point2, D, D>
{
    static inline bool apply(Point1 const&, Point2 const&)
    {
        return false;
    }
};

}} // namespace detail_dispatch::relate

#endif

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace relate {

struct less
{
    template <typename Point1, typename Point2>
    inline bool operator()(Point1 const& point1, Point2 const& point2) const
    {
        return detail_dispatch::relate::less<Point1, Point2>::apply(point1, point2);
    }
};

}} // namespace detail::relate
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_RELATE_LESS_HPP
