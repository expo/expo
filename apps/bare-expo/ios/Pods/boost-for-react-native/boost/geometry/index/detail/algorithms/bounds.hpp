// Boost.Geometry Index
//
// n-dimensional bounds
//
// Copyright (c) 2011-2014 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_ALGORITHMS_BOUNDS_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_ALGORITHMS_BOUNDS_HPP

#include <boost/geometry/index/detail/bounded_view.hpp>

namespace boost { namespace geometry { namespace index { namespace detail {

namespace dispatch {

template <typename Geometry,
          typename Bounds,
          typename TagGeometry = typename geometry::tag<Geometry>::type,
          typename TagBounds = typename geometry::tag<Bounds>::type>
struct bounds
{
    static inline void apply(Geometry const& g, Bounds & b)
    {
        geometry::convert(g, b);
    }
};

template <typename Geometry, typename Bounds>
struct bounds<Geometry, Bounds, segment_tag, box_tag>
{
    static inline void apply(Geometry const& g, Bounds & b)
    {
        index::detail::bounded_view<Geometry, Bounds> v(g);
        geometry::convert(v, b);
    }
};

} // namespace dispatch

template <typename Geometry, typename Bounds>
inline void bounds(Geometry const& g, Bounds & b)
{
    concepts::check_concepts_and_equal_dimensions<Geometry const, Bounds>();
    dispatch::bounds<Geometry, Bounds>::apply(g, b);
}

namespace dispatch {

template <typename Geometry,
          typename TagGeometry = typename geometry::tag<Geometry>::type>
struct return_ref_or_bounds
{
    typedef Geometry const& result_type;

    static inline result_type apply(Geometry const& g)
    {
        return g;
    }
};

template <typename Geometry>
struct return_ref_or_bounds<Geometry, segment_tag>
{
    typedef typename point_type<Geometry>::type point_type;
    typedef geometry::model::box<point_type> bounds_type;
    typedef index::detail::bounded_view<Geometry, bounds_type> result_type;

    static inline result_type apply(Geometry const& g)
    {
        return result_type(g);
    }
};

} // namespace dispatch

template <typename Geometry>
inline
typename dispatch::return_ref_or_bounds<Geometry>::result_type
return_ref_or_bounds(Geometry const& g)
{
    return dispatch::return_ref_or_bounds<Geometry>::apply(g);
}

}}}} // namespace boost::geometry::index::detail

#endif // BOOST_GEOMETRY_INDEX_DETAIL_ALGORITHMS_BOUNDS_HPP
