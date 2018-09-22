// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2013 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2013 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2013 Mateusz Loskot, London, UK.
// Copyright (c) 2013-2014 Adam Wulkiewicz, Lodz, Poland.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_REMOVE_SPIKES_HPP
#define BOOST_GEOMETRY_ALGORITHMS_REMOVE_SPIKES_HPP

#include <deque>

#include <boost/range.hpp>
#include <boost/type_traits/remove_reference.hpp>

#include <boost/variant/apply_visitor.hpp>
#include <boost/variant/static_visitor.hpp>
#include <boost/variant/variant_fwd.hpp>

#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/interior_rings.hpp>
#include <boost/geometry/core/point_order.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/geometries/concepts/check.hpp>

#include <boost/geometry/algorithms/detail/point_is_spike_or_equal.hpp>
#include <boost/geometry/algorithms/detail/interior_iterator.hpp>
#include <boost/geometry/algorithms/clear.hpp>

#include <boost/geometry/util/condition.hpp>


/*
Remove spikes from a ring/polygon.
Ring (having 8 vertices, including closing vertex)
+------+
|      |
|      +--+
|      |  ^this "spike" is removed, can be located outside/inside the ring
+------+
(the actualy determination if it is removed is done by a strategy)

*/


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace remove_spikes
{


template <typename Range>
struct range_remove_spikes
{
    typedef typename strategy::side::services::default_strategy
    <
        typename cs_tag<Range>::type
    >::type side_strategy;

    typedef typename coordinate_type<Range>::type coordinate_type;
    typedef typename point_type<Range>::type point_type;


    static inline void apply(Range& range)
    {
        std::size_t n = boost::size(range);
        std::size_t const min_num_points = core_detail::closure::minimum_ring_size
            <
                geometry::closure<Range>::value
            >::value - 1; // subtract one: a polygon with only one spike should result into one point
        if (n < min_num_points)
        {
            return;
        }

        std::deque<point_type> cleaned;
        for (typename boost::range_iterator<Range const>::type it = boost::begin(range);
            it != boost::end(range); ++it)
        {
            // Add point
            cleaned.push_back(*it);

            while(cleaned.size() >= 3
                    && detail::point_is_spike_or_equal(cleaned.back(), *(cleaned.end() - 3), *(cleaned.end() - 2)))
            {
                // Remove pen-ultimate point causing the spike (or which was equal)
                cleaned.erase(cleaned.end() - 2);
            }
        }

        // For a closed-polygon, remove closing point, this makes checking first point(s) easier and consistent
        if ( BOOST_GEOMETRY_CONDITION(geometry::closure<Range>::value == geometry::closed) )
        {
            cleaned.pop_back();
        }

        bool found = false;
        do
        {
            found = false;
            // Check for spike in first point
            int const penultimate = 2;
            while(cleaned.size() >= 3 && detail::point_is_spike_or_equal(cleaned.front(), *(cleaned.end() - penultimate), cleaned.back()))
            {
                cleaned.pop_back();
                found = true;
            }
            // Check for spike in second point
            while(cleaned.size() >= 3 && detail::point_is_spike_or_equal(*(cleaned.begin() + 1), cleaned.back(), cleaned.front()))
            {
                cleaned.pop_front();
                found = true;
            }
        }
        while (found);

        if (cleaned.size() == 2)
        {
            // Ticket #9871: open polygon with only two points.
            // the second point forms, by definition, a spike
            cleaned.pop_back();
        }

        // Close if necessary
        if ( BOOST_GEOMETRY_CONDITION(geometry::closure<Range>::value == geometry::closed) )
        {
            cleaned.push_back(cleaned.front());
        }

        // Copy output
        geometry::clear(range);
        std::copy(cleaned.begin(), cleaned.end(), range::back_inserter(range));
    }
};


template <typename Polygon>
struct polygon_remove_spikes
{
    static inline void apply(Polygon& polygon)
    {
        typedef typename geometry::ring_type<Polygon>::type ring_type;

        typedef range_remove_spikes<ring_type> per_range;
        per_range::apply(exterior_ring(polygon));

        typename interior_return_type<Polygon>::type
            rings = interior_rings(polygon);

        for (typename detail::interior_iterator<Polygon>::type
                it = boost::begin(rings); it != boost::end(rings); ++it)
        {
            per_range::apply(*it);
        }
    }
};


template <typename MultiGeometry, typename SingleVersion>
struct multi_remove_spikes
{
    static inline void apply(MultiGeometry& multi)
    {
        for (typename boost::range_iterator<MultiGeometry>::type
                it = boost::begin(multi);
            it != boost::end(multi);
            ++it)
        {
            SingleVersion::apply(*it);
        }
    }
};


}} // namespace detail::remove_spikes
#endif // DOXYGEN_NO_DETAIL



#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{


template
<
    typename Geometry,
    typename Tag = typename tag<Geometry>::type
>
struct remove_spikes
{
    static inline void apply(Geometry&)
    {}
};


template <typename Ring>
struct remove_spikes<Ring, ring_tag>
    : detail::remove_spikes::range_remove_spikes<Ring>
{};



template <typename Polygon>
struct remove_spikes<Polygon, polygon_tag>
    : detail::remove_spikes::polygon_remove_spikes<Polygon>
{};


template <typename MultiPolygon>
struct remove_spikes<MultiPolygon, multi_polygon_tag>
    : detail::remove_spikes::multi_remove_spikes
        <
            MultiPolygon,
            detail::remove_spikes::polygon_remove_spikes
            <
                typename boost::range_value<MultiPolygon>::type
            >
        >
{};


} // namespace dispatch
#endif


namespace resolve_variant {

template <typename Geometry>
struct remove_spikes
{
    static void apply(Geometry& geometry)
    {
        concepts::check<Geometry>();
        dispatch::remove_spikes<Geometry>::apply(geometry);
    }
};

template <BOOST_VARIANT_ENUM_PARAMS(typename T)>
struct remove_spikes<boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)> >
{
    struct visitor: boost::static_visitor<void>
    {
        template <typename Geometry>
        void operator()(Geometry& geometry) const
        {
            remove_spikes<Geometry>::apply(geometry);
        }
    };

    static inline void apply(boost::variant<BOOST_VARIANT_ENUM_PARAMS(T)>& geometry)
    {
        boost::apply_visitor(visitor(), geometry);
    }
};

} // namespace resolve_variant


/*!
    \ingroup remove_spikes
    \tparam Geometry geometry type
    \param geometry the geometry to make remove_spikes
*/
template <typename Geometry>
inline void remove_spikes(Geometry& geometry)
{
    resolve_variant::remove_spikes<Geometry>::apply(geometry);
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_REMOVE_SPIKES_HPP
