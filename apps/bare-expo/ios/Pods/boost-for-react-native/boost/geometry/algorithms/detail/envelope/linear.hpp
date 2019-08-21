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

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_LINEAR_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_LINEAR_HPP

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/iterators/segment_iterator.hpp>

#include <boost/geometry/algorithms/detail/envelope/range.hpp>

#include <boost/geometry/algorithms/dispatch/envelope.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace envelope
{


struct envelope_linestring_on_spheroid
{
    template <typename Linestring, typename Box>
    static inline void apply(Linestring const& linestring, Box& mbr)
    {
        envelope_range::apply(geometry::segments_begin(linestring),
                              geometry::segments_end(linestring),
                              mbr);
    }
};


}} // namespace detail::envelope
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template <typename Linestring, typename CS_Tag>
struct envelope<Linestring, linestring_tag, CS_Tag>
    : detail::envelope::envelope_range
{};

template <typename Linestring>
struct envelope<Linestring, linestring_tag, spherical_equatorial_tag>
    : detail::envelope::envelope_linestring_on_spheroid
{};


template <typename MultiLinestring, typename CS_Tag>
struct envelope
    <
        MultiLinestring, multi_linestring_tag, CS_Tag
    > : detail::envelope::envelope_multi_range
        <
            detail::envelope::envelope_range
        >
{};

template <typename MultiLinestring>
struct envelope
    <
        MultiLinestring, multi_linestring_tag, spherical_equatorial_tag
    > : detail::envelope::envelope_multi_range_on_spheroid
        <
            detail::envelope::envelope_linestring_on_spheroid
        >
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_LINEAR_HPP
