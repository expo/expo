// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_VIEWS_BOX_VIEW_HPP
#define BOOST_GEOMETRY_VIEWS_BOX_VIEW_HPP


#include <boost/range.hpp>

#include <boost/geometry/core/point_type.hpp>
#include <boost/geometry/views/detail/points_view.hpp>
#include <boost/geometry/algorithms/assign.hpp>


namespace boost { namespace geometry
{


/*!
\brief Makes a box behave like a ring or a range
\details Adapts a box to the Boost.Range concept, enabling the user to iterating
    box corners. The box_view is registered as a Ring Concept
\tparam Box \tparam_geometry{Box}
\tparam Clockwise If true, walks in clockwise direction, otherwise
    it walks in counterclockwise direction
\ingroup views

\qbk{before.synopsis,
[heading Model of]
[link geometry.reference.concepts.concept_ring Ring Concept]
}

\qbk{[include reference/views/box_view.qbk]}
*/
template <typename Box, bool Clockwise = true>
struct box_view
    : public detail::points_view
        <
            typename geometry::point_type<Box>::type,
            5
        >
{
    typedef typename geometry::point_type<Box>::type point_type;

    /// Constructor accepting the box to adapt
    explicit box_view(Box const& box)
        : detail::points_view<point_type, 5>(copy_policy(box))
    {}

private :

    class copy_policy
    {
    public :
        inline copy_policy(Box const& box)
            : m_box(box)
        {}

        inline void apply(point_type* points) const
        {
            // assign_box_corners_oriented requires a range
            // an alternative for this workaround would be to pass a range here,
            // e.g. use boost::array in points_view instead of c-array
            std::pair<point_type*, point_type*> rng = std::make_pair(points, points + 5);
            detail::assign_box_corners_oriented<!Clockwise>(m_box, rng);
            points[4] = points[0];
        }
    private :
        Box const& m_box;
    };

};


#ifndef DOXYGEN_NO_TRAITS_SPECIALIZATIONS

// All views on boxes are handled as rings
namespace traits
{

template<typename Box, bool Clockwise>
struct tag<box_view<Box, Clockwise> >
{
    typedef ring_tag type;
};

template<typename Box>
struct point_order<box_view<Box, false> >
{
    static order_selector const value = counterclockwise;
};


template<typename Box>
struct point_order<box_view<Box, true> >
{
    static order_selector const value = clockwise;
};

}

#endif // DOXYGEN_NO_TRAITS_SPECIALIZATIONS


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_VIEWS_BOX_VIEW_HPP
