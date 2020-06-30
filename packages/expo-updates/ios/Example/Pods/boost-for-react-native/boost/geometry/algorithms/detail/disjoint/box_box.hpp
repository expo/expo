// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.
// Copyright (c) 2013-2015 Adam Wulkiewicz, Lodz, Poland.

// This file was modified by Oracle on 2013-2016.
// Modifications copyright (c) 2013-2016, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle
// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_BOX_BOX_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_BOX_BOX_HPP

#include <cstddef>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/algorithms/dispatch/disjoint.hpp>

#include <boost/geometry/util/normalize_spheroidal_coordinates.hpp>
#include <boost/geometry/util/select_most_precise.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace disjoint
{

template
<
    typename Box1, typename Box2,
    std::size_t Dimension = 0,
    std::size_t DimensionCount = dimension<Box1>::value,
    typename CSTag = typename tag_cast
                        <
                            typename cs_tag<Box1>::type,
                            spherical_tag
                        >::type
>
struct box_box
{
    static inline bool apply(Box1 const& box1, Box2 const& box2)
    {
        if (get<max_corner, Dimension>(box1) < get<min_corner, Dimension>(box2))
        {
            return true;
        }
        if (get<min_corner, Dimension>(box1) > get<max_corner, Dimension>(box2))
        {
            return true;
        }
        return box_box
            <
                Box1, Box2,
                Dimension + 1, DimensionCount
            >::apply(box1, box2);
    }
};


template <typename Box1, typename Box2, std::size_t DimensionCount, typename CSTag>
struct box_box<Box1, Box2, DimensionCount, DimensionCount, CSTag>
{
    static inline bool apply(Box1 const& , Box2 const& )
    {
        return false;
    }
};


template <typename Box1, typename Box2, std::size_t DimensionCount>
struct box_box<Box1, Box2, 0, DimensionCount, spherical_tag>
{
    static inline bool apply(Box1 const& box1, Box2 const& box2)
    {
        typedef typename geometry::select_most_precise
            <
                typename coordinate_type<Box1>::type,
                typename coordinate_type<Box2>::type
            >::type calc_t;
        typedef typename coordinate_system<Box1>::type::units units_t;
        typedef math::detail::constants_on_spheroid<calc_t, units_t> constants;

        calc_t const b1_min = get<min_corner, 0>(box1);
        calc_t const b1_max = get<max_corner, 0>(box1);
        calc_t const b2_min = get<min_corner, 0>(box2);
        calc_t const b2_max = get<max_corner, 0>(box2);

        // min <= max <=> diff >= 0
        calc_t const diff1 = b1_max - b1_min;
        calc_t const diff2 = b2_max - b2_min;

        // check the intersection if neither box cover the whole globe
        if (diff1 < constants::period() && diff2 < constants::period())
        {
            // calculate positive longitude translation with b1_min as origin
            calc_t const diff_min = math::longitude_distance_unsigned<units_t>(b1_min, b2_min);
            calc_t const b2_min_transl = b1_min + diff_min; // always right of b1_min

            if (b2_min_transl > b1_max                                // b2_min right of b1_max
             && b2_min_transl - constants::period() + diff2 < b1_min) // b2_max left of b1_min
            {
                return true;
            }
        }

        return box_box
            <
                Box1, Box2,
                1, DimensionCount
            >::apply(box1, box2);
    }
};


/*!
    \brief Internal utility function to detect if boxes are disjoint
    \note Is used from other algorithms, declared separately
        to avoid circular references
 */
template <typename Box1, typename Box2>
inline bool disjoint_box_box(Box1 const& box1, Box2 const& box2)
{
    return box_box<Box1, Box2>::apply(box1, box2);
}


}} // namespace detail::disjoint
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Box1, typename Box2, std::size_t DimensionCount>
struct disjoint<Box1, Box2, DimensionCount, box_tag, box_tag, false>
    : detail::disjoint::box_box<Box1, Box2, 0, DimensionCount>
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_BOX_BOX_HPP
