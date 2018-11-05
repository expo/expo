// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_VIEWS_IDENTITY_VIEW_HPP
#define BOOST_GEOMETRY_VIEWS_IDENTITY_VIEW_HPP


#include <boost/range.hpp>


namespace boost { namespace geometry
{

// Silence warning C4512: assignment operator could not be generated
#if defined(_MSC_VER)
#pragma warning(push)
#pragma warning(disable : 4512)
#endif

/*!
\brief View on a range, not modifying anything
\tparam Range original range
\ingroup views
*/
template <typename Range>
struct identity_view
{
    typedef typename boost::range_iterator<Range const>::type const_iterator;
    typedef typename boost::range_iterator<Range>::type iterator;

    explicit inline identity_view(Range& r)
        : m_range(r)
    {}

    inline const_iterator begin() const { return boost::begin(m_range); }
    inline const_iterator end() const { return boost::end(m_range); }

    inline iterator begin() { return boost::begin(m_range); }
    inline iterator end() { return boost::end(m_range); }
private :
    Range& m_range;
};

#if defined(_MSC_VER)
#pragma warning(pop)
#endif

}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_VIEWS_IDENTITY_VIEW_HPP
