// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_BOX_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_BOX_HPP

#include <cstddef>

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/coordinate_system.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/views/detail/indexed_point_view.hpp>

#include <boost/geometry/algorithms/detail/convert_point_to_point.hpp>
#include <boost/geometry/algorithms/detail/normalize.hpp>
#include <boost/geometry/algorithms/detail/envelope/transform_units.hpp>

#include <boost/geometry/algorithms/dispatch/envelope.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace envelope
{


template
<
    std::size_t Index,
    std::size_t Dimension,
    std::size_t DimensionCount
>
struct envelope_indexed_box
{
    template <typename BoxIn, typename BoxOut>
    static inline void apply(BoxIn const& box_in, BoxOut& mbr)
    {
        detail::indexed_point_view<BoxIn const, Index> box_in_corner(box_in);
        detail::indexed_point_view<BoxOut, Index> mbr_corner(mbr);

        detail::conversion::point_to_point
            <
                detail::indexed_point_view<BoxIn const, Index>,
                detail::indexed_point_view<BoxOut, Index>,
                Dimension,
                DimensionCount
            >::apply(box_in_corner, mbr_corner);
    }
};

template
<
    std::size_t Index,
    std::size_t DimensionCount
>
struct envelope_indexed_box_on_spheroid
{
    template <typename BoxIn, typename BoxOut>
    static inline void apply(BoxIn const& box_in, BoxOut& mbr)
    {
        // transform() does not work with boxes of dimension higher
        // than 2; to account for such boxes we transform the min/max
        // points of the boxes using the indexed_point_view
        detail::indexed_point_view<BoxIn const, Index> box_in_corner(box_in);
        detail::indexed_point_view<BoxOut, Index> mbr_corner(mbr);

        // first transform the units
        transform_units(box_in_corner, mbr_corner);

        // now transform the remaining coordinates
        detail::conversion::point_to_point
            <
                detail::indexed_point_view<BoxIn const, Index>,
                detail::indexed_point_view<BoxOut, Index>,
                2,
                DimensionCount
            >::apply(box_in_corner, mbr_corner);
    }
};


struct envelope_box
{
    template<typename BoxIn, typename BoxOut>
    static inline void apply(BoxIn const& box_in, BoxOut& mbr)
    {
        envelope_indexed_box
            <
                min_corner, 0, dimension<BoxIn>::value
            >::apply(box_in, mbr);

        envelope_indexed_box
            <
                max_corner, 0, dimension<BoxIn>::value
            >::apply(box_in, mbr);
    }
};


struct envelope_box_on_spheroid
{
    template <typename BoxIn, typename BoxOut>
    static inline void apply(BoxIn const& box_in, BoxOut& mbr)
    {
        BoxIn box_in_normalized = detail::return_normalized<BoxIn>(box_in);

        envelope_indexed_box_on_spheroid
            <
                min_corner, dimension<BoxIn>::value
            >::apply(box_in_normalized, mbr);

        envelope_indexed_box_on_spheroid
            <
                max_corner, dimension<BoxIn>::value
            >::apply(box_in_normalized, mbr);
    }
};


}} // namespace detail::envelope
#endif // DOXYGEN_NO_DETAIL

#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Box, typename CS_Tag>
struct envelope<Box, box_tag, CS_Tag>
    : detail::envelope::envelope_box
{};


template <typename Box>
struct envelope<Box, box_tag, spherical_equatorial_tag>
    : detail::envelope::envelope_box_on_spheroid
{};


template <typename Box>
struct envelope<Box, box_tag, geographic_tag>
    : detail::envelope::envelope_box_on_spheroid
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_BOX_HPP
