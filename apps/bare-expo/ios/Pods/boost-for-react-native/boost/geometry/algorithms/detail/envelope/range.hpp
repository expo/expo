// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_RANGE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_RANGE_HPP

#include <iterator>
#include <vector>

#include <boost/range.hpp>

#include <boost/geometry/core/coordinate_dimension.hpp>

#include <boost/geometry/util/range.hpp>

#include <boost/geometry/algorithms/is_empty.hpp>

#include <boost/geometry/algorithms/detail/envelope/initialize.hpp>
#include <boost/geometry/algorithms/detail/envelope/range_of_boxes.hpp>

#include <boost/geometry/algorithms/detail/expand/box.hpp>
#include <boost/geometry/algorithms/detail/expand/point.hpp>
#include <boost/geometry/algorithms/detail/expand/segment.hpp>

#include <boost/geometry/algorithms/dispatch/envelope.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace envelope
{


// implementation for simple ranges
struct envelope_range
{
    template <typename Iterator, typename Box>
    static inline void apply(Iterator first, Iterator last, Box& mbr)
    {
        typedef typename std::iterator_traits<Iterator>::value_type value_type;

        // initialize MBR
        initialize<Box, 0, dimension<Box>::value>::apply(mbr);

        Iterator it = first;
        if (it != last)
        {
            // initialize box with first element in range
            dispatch::envelope<value_type>::apply(*it, mbr);

            // consider now the remaining elements in the range (if any)
            for (++it; it != last; ++it)
            {
                dispatch::expand<Box, value_type>::apply(mbr, *it);
            }
        }
    }

    template <typename Range, typename Box>
    static inline void apply(Range const& range, Box& mbr)
    {
        return apply(boost::begin(range), boost::end(range), mbr);
    }
};


// implementation for multi-ranges
template <typename EnvelopePolicy>
struct envelope_multi_range
{
    template <typename MultiRange, typename Box>
    static inline void apply(MultiRange const& multirange, Box& mbr)
    {
        typedef typename boost::range_iterator
            <
                MultiRange const
            >::type iterator_type;

        bool initialized = false;
        for (iterator_type it = boost::begin(multirange);
             it != boost::end(multirange);
             ++it)
        {
            if (! geometry::is_empty(*it))
            {
                if (initialized)
                {
                    Box helper_mbr;
                    EnvelopePolicy::apply(*it, helper_mbr);

                    dispatch::expand<Box, Box>::apply(mbr, helper_mbr);
                }
                else
                {
                    // compute the initial envelope
                    EnvelopePolicy::apply(*it, mbr);
                    initialized = true;
                }
            }
        }

        if (! initialized)
        {
            // if not already initialized, initialize MBR
            initialize<Box, 0, dimension<Box>::value>::apply(mbr);
        }
    }
};


// implementation for multi-range on a spheroid (longitude is periodic)
template <typename EnvelopePolicy>
struct envelope_multi_range_on_spheroid
{
    template <typename MultiRange, typename Box>
    static inline void apply(MultiRange const& multirange, Box& mbr)
    {
        typedef typename boost::range_iterator
            <
                MultiRange const
            >::type iterator_type;

        // due to the periodicity of longitudes we need to compute the boxes
        // of all the single geometries and keep them in a container
        std::vector<Box> boxes;
        for (iterator_type it = boost::begin(multirange);
             it != boost::end(multirange);
             ++it)
        {
            if (! geometry::is_empty(*it))
            {
                Box helper_box;
                EnvelopePolicy::apply(*it, helper_box);
                boxes.push_back(helper_box);
            }
        }

        // now we need to compute the envelope of the range of boxes
        // (cannot be done in an incremental fashion as in the
        // Cartesian coordinate system)
        // if all single geometries are empty no boxes have been found
        // and the MBR is simply initialized
        if (! boxes.empty())
        {
            envelope_range_of_boxes::apply(boxes, mbr);
        }
        else
        {
            initialize<Box, 0, dimension<Box>::value>::apply(mbr);
        }

    }
};


}} // namespace detail::envelope
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_ENVELOPE_RANGE_HPP
