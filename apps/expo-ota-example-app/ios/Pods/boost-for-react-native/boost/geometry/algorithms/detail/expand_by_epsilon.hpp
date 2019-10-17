// Boost.Geometry

// Copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_EXPAND_EXPAND_BY_EPSILON_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_EXPAND_EXPAND_BY_EPSILON_HPP

#include <cstddef>
#include <algorithm>

#include <boost/type_traits/is_floating_point.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/coordinate_type.hpp>

#include <boost/geometry/util/math.hpp>

#include <boost/geometry/views/detail/indexed_point_view.hpp>

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace expand
{

template
<
    typename Point,
    template <typename> class PlusOrMinus,
    std::size_t I = 0,
    std::size_t D = dimension<Point>::value,
    bool Enable = boost::is_floating_point
                    <
                        typename coordinate_type<Point>::type
                    >::value
>
struct corner_by_epsilon
{
    static inline void apply(Point & point)
    {
        typedef typename coordinate_type<Point>::type coord_type;
        coord_type const coord = get<I>(point);
        coord_type const eps = math::scaled_epsilon(coord);
        
        set<I>(point, PlusOrMinus<coord_type>()(coord, eps));

        corner_by_epsilon<Point, PlusOrMinus, I+1>::apply(point);
    }
};

template
<
    typename Point,
    template <typename> class PlusOrMinus,
    std::size_t I,
    std::size_t D
>
struct corner_by_epsilon<Point, PlusOrMinus, I, D, false>
{
    static inline void apply(Point const&) {}
};

template
<
    typename Point,
    template <typename> class PlusOrMinus,
    std::size_t D,
    bool Enable
>
struct corner_by_epsilon<Point, PlusOrMinus, D, D, Enable>
{
    static inline void apply(Point const&) {}
};

template
<
    typename Point,
    template <typename> class PlusOrMinus,
    std::size_t D
>
struct corner_by_epsilon<Point, PlusOrMinus, D, D, false>
{
    static inline void apply(Point const&) {}
};

} // namespace expand

template <typename Box>
inline void expand_by_epsilon(Box & box)
{
    typedef detail::indexed_point_view<Box, min_corner> min_type;
    min_type min_point(box);
    expand::corner_by_epsilon<min_type, std::minus>::apply(min_point);

    typedef detail::indexed_point_view<Box, max_corner> max_type;
    max_type max_point(box);
    expand::corner_by_epsilon<max_type, std::plus>::apply(max_point);
}

} // namespace detail
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_EXPAND_EXPAND_BY_EPSILON_HPP
