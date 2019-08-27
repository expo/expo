// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_SELF_TURN_POINTS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_SELF_TURN_POINTS_HPP


#include <cstddef>

#include <boost/mpl/vector_c.hpp>
#include <boost/range.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/geometries/concepts/check.hpp>

#include <boost/geometry/algorithms/detail/disjoint/box_box.hpp>
#include <boost/geometry/algorithms/detail/partition.hpp>
#include <boost/geometry/algorithms/detail/overlay/get_turns.hpp>
#include <boost/geometry/algorithms/detail/sections/section_box_policies.hpp>

#include <boost/geometry/geometries/box.hpp>

#include <boost/geometry/util/condition.hpp>


namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace self_get_turn_points
{

struct no_interrupt_policy
{
    static bool const enabled = false;
    static bool const has_intersections = false;


    template <typename Range>
    static inline bool apply(Range const&)
    {
        return false;
    }
};




class self_ip_exception : public geometry::exception {};

template
<
    typename Geometry,
    typename Turns,
    typename TurnPolicy,
    typename RobustPolicy,
    typename InterruptPolicy
>
struct self_section_visitor
{
    Geometry const& m_geometry;
    RobustPolicy const& m_rescale_policy;
    Turns& m_turns;
    InterruptPolicy& m_interrupt_policy;

    inline self_section_visitor(Geometry const& g,
            RobustPolicy const& rp,
            Turns& turns, InterruptPolicy& ip)
        : m_geometry(g)
        , m_rescale_policy(rp)
        , m_turns(turns)
        , m_interrupt_policy(ip)
    {}

    template <typename Section>
    inline bool apply(Section const& sec1, Section const& sec2)
    {
        if (! detail::disjoint::disjoint_box_box(sec1.bounding_box, sec2.bounding_box)
                && ! sec1.duplicate
                && ! sec2.duplicate)
        {
            detail::get_turns::get_turns_in_sections
                    <
                        Geometry, Geometry,
                        false, false,
                        Section, Section,
                        TurnPolicy
                    >::apply(
                            0, m_geometry, sec1,
                            0, m_geometry, sec2,
                            false,
                            m_rescale_policy,
                            m_turns, m_interrupt_policy);
        }
        if (BOOST_GEOMETRY_CONDITION(m_interrupt_policy.has_intersections))
        {
            // TODO: we should give partition an interrupt policy.
            // Now we throw, and catch below, to stop the partition loop.
            throw self_ip_exception();
        }
        return true;
    }

};



template<typename TurnPolicy>
struct get_turns
{
    template <typename Geometry, typename RobustPolicy, typename Turns, typename InterruptPolicy>
    static inline bool apply(
            Geometry const& geometry,
            RobustPolicy const& robust_policy,
            Turns& turns,
            InterruptPolicy& interrupt_policy)
    {
        typedef model::box
            <
                typename geometry::robust_point_type
                <
                    typename geometry::point_type<Geometry>::type,
                    RobustPolicy
                >::type
            > box_type;

        typedef geometry::sections<box_type, 1> sections_type;

        typedef boost::mpl::vector_c<std::size_t, 0> dimensions;

        sections_type sec;
        geometry::sectionalize<false, dimensions>(geometry, robust_policy, sec);

        self_section_visitor
            <
                Geometry,
                Turns, TurnPolicy, RobustPolicy, InterruptPolicy
            > visitor(geometry, robust_policy, turns, interrupt_policy);

        try
        {
            geometry::partition
                <
                    box_type,
                    detail::section::get_section_box,
                    detail::section::overlaps_section_box
                >::apply(sec, visitor);
        }
        catch(self_ip_exception const& )
        {
            return false;
        }

        return true;
    }
};


}} // namespace detail::self_get_turn_points
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template
<
    typename GeometryTag,
    typename Geometry,
    typename TurnPolicy
>
struct self_get_turn_points
{
};


template
<
    typename Ring,
    typename TurnPolicy
>
struct self_get_turn_points
    <
        ring_tag, Ring,
        TurnPolicy
    >
    : detail::self_get_turn_points::get_turns<TurnPolicy>
{};


template
<
    typename Box,
    typename TurnPolicy
>
struct self_get_turn_points
    <
        box_tag, Box,
        TurnPolicy
    >
{
    template <typename RobustPolicy, typename Turns, typename InterruptPolicy>
    static inline bool apply(
            Box const& ,
            RobustPolicy const& ,
            Turns& ,
            InterruptPolicy& )
    {
        return true;
    }
};


template
<
    typename Polygon,
    typename TurnPolicy
>
struct self_get_turn_points
    <
        polygon_tag, Polygon,
        TurnPolicy
    >
    : detail::self_get_turn_points::get_turns<TurnPolicy>
{};


template
<
    typename MultiPolygon,
    typename TurnPolicy
>
struct self_get_turn_points
    <
        multi_polygon_tag, MultiPolygon,
        TurnPolicy
    >
    : detail::self_get_turn_points::get_turns<TurnPolicy>
{};


} // namespace dispatch
#endif // DOXYGEN_NO_DISPATCH


/*!
    \brief Calculate self intersections of a geometry
    \ingroup overlay
    \tparam Geometry geometry type
    \tparam Turns type of intersection container
                (e.g. vector of "intersection/turn point"'s)
    \param geometry geometry
    \param robust_policy policy to handle robustness issues
    \param turns container which will contain intersection points
    \param interrupt_policy policy determining if process is stopped
        when intersection is found
 */
template
<
    typename AssignPolicy,
    typename Geometry,
    typename RobustPolicy,
    typename Turns,
    typename InterruptPolicy
>
inline void self_turns(Geometry const& geometry,
            RobustPolicy const& robust_policy,
            Turns& turns, InterruptPolicy& interrupt_policy)
{
    concepts::check<Geometry const>();

    typedef detail::overlay::get_turn_info<detail::overlay::assign_null_policy> turn_policy;

    dispatch::self_get_turn_points
            <
                typename tag<Geometry>::type,
                Geometry,
                turn_policy
            >::apply(geometry, robust_policy, turns, interrupt_policy);
}



}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_SELF_TURN_POINTS_HPP
