// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_VIEWS_REVERSIBLE_VIEW_HPP
#define BOOST_GEOMETRY_VIEWS_REVERSIBLE_VIEW_HPP


#include <boost/version.hpp>
#include <boost/range.hpp>
#include <boost/range/adaptor/reversed.hpp>

#include <boost/geometry/core/ring_type.hpp>
#include <boost/geometry/core/tag.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/views/identity_view.hpp>

namespace boost { namespace geometry
{

/*!
\brief Flag for iterating a reversible_view in forward or reverse direction
\ingroup views
*/
enum iterate_direction { iterate_forward, iterate_reverse };

/*!
\brief View on a range, reversing direction if necessary
\tparam Range original range
\tparam Direction direction of iteration
\ingroup views
*/
template <typename Range, iterate_direction Direction>
struct reversible_view {};



#ifndef DOXYGEN_NO_SPECIALIZATIONS

template <typename Range>
struct reversible_view<Range, iterate_forward>
{
    typedef identity_view<Range> type;
};


template <typename Range>
struct reversible_view<Range, iterate_reverse>
{
#if BOOST_VERSION > 104500
    typedef boost::reversed_range<Range> type;
#else
    // For older versions of Boost
    typedef boost::range_detail::reverse_range<Range> type;
#endif
};

#endif // DOXYGEN_NO_SPECIALIZATIONS


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_VIEWS_REVERSIBLE_VIEW_HPP
