// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012-2014 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_GET_LEFT_TURNS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_GET_LEFT_TURNS_HPP

#include <boost/geometry/core/assert.hpp>

#include <boost/geometry/arithmetic/arithmetic.hpp>
#include <boost/geometry/algorithms/detail/overlay/segment_identifier.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/iterators/closing_iterator.hpp>
#include <boost/geometry/iterators/ever_circling_iterator.hpp>
#include <boost/geometry/strategies/side.hpp>

namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail
{

// TODO: move this to /util/
template <typename T>
inline std::pair<T, T> ordered_pair(T const& first, T const& second)
{
    return first < second ? std::make_pair(first, second) : std::make_pair(second, first);
}

namespace left_turns
{



template <typename Vector>
inline int get_quadrant(Vector const& vector)
{
    // Return quadrant as layouted in the code below:
    // 3 | 0
    // -----
    // 2 | 1
    return geometry::get<1>(vector) >= 0
        ? (geometry::get<0>(vector)  < 0 ? 3 : 0)
        : (geometry::get<0>(vector)  < 0 ? 2 : 1)
        ;
}

template <typename Vector>
inline int squared_length(Vector const& vector)
{
    return geometry::get<0>(vector) * geometry::get<0>(vector)
         + geometry::get<1>(vector) * geometry::get<1>(vector)
         ;
}


template <typename Point>
struct angle_less
{
    typedef Point vector_type;
    typedef typename strategy::side::services::default_strategy
    <
        typename cs_tag<Point>::type
    >::type side_strategy_type;

    angle_less(Point const& origin)
        : m_origin(origin)
    {}

    template <typename Angle>
    inline bool operator()(Angle const& p, Angle const& q) const
    {
        // Vector origin -> p and origin -> q
        vector_type pv = p.point;
        vector_type qv = q.point;
        geometry::subtract_point(pv, m_origin);
        geometry::subtract_point(qv, m_origin);

        int const quadrant_p = get_quadrant(pv);
        int const quadrant_q = get_quadrant(qv);
        if (quadrant_p != quadrant_q)
        {
            return quadrant_p < quadrant_q;
        }
        // Same quadrant, check if p is located left of q
        int const side = side_strategy_type::apply(m_origin, q.point,
                    p.point);
        if (side != 0)
        {
            return side == 1;
        }
        // Collinear, check if one is incoming, incoming angles come first
        if (p.incoming != q.incoming)
        {
            return int(p.incoming) < int(q.incoming);
        }
        // Same quadrant/side/direction, return longest first
        // TODO: maybe not necessary, decide this
        int const length_p = squared_length(pv);
        int const length_q = squared_length(qv);
        if (length_p != length_q)
        {
            return squared_length(pv) > squared_length(qv);
        }
        // They are still the same. Just compare on seg_id
        return p.seg_id < q.seg_id;
    }

private:
    Point m_origin;
};

template <typename Point>
struct angle_equal_to
{
    typedef Point vector_type;
    typedef typename strategy::side::services::default_strategy
    <
        typename cs_tag<Point>::type
    >::type side_strategy_type;

    inline angle_equal_to(Point const& origin)
        : m_origin(origin)
    {}

    template <typename Angle>
    inline bool operator()(Angle const& p, Angle const& q) const
    {
        // Vector origin -> p and origin -> q
        vector_type pv = p.point;
        vector_type qv = q.point;
        geometry::subtract_point(pv, m_origin);
        geometry::subtract_point(qv, m_origin);

        if (get_quadrant(pv) != get_quadrant(qv))
        {
            return false;
        }
        // Same quadrant, check if p/q are collinear
        int const side = side_strategy_type::apply(m_origin, q.point,
                    p.point);
        return side == 0;
    }

private:
    Point m_origin;
};

template <typename AngleCollection, typename Turns>
inline void get_left_turns(AngleCollection const& sorted_angles,
        Turns& turns)
{
    std::set<std::size_t> good_incoming;
    std::set<std::size_t> good_outgoing;

    for (typename boost::range_iterator<AngleCollection const>::type it =
        sorted_angles.begin(); it != sorted_angles.end(); ++it)
    {
        if (!it->blocked)
        {
            if (it->incoming)
            {
                good_incoming.insert(it->turn_index);
            }
            else
            {
                good_outgoing.insert(it->turn_index);
            }
        }
    }

    if (good_incoming.empty() || good_outgoing.empty())
    {
        return;
    }

    for (typename boost::range_iterator<AngleCollection const>::type it =
        sorted_angles.begin(); it != sorted_angles.end(); ++it)
    {
        if (good_incoming.count(it->turn_index) == 0
            || good_outgoing.count(it->turn_index) == 0)
        {
            turns[it->turn_index].remove_on_multi = true;
        }
    }
}


//! Returns the number of clusters
template <typename Point, typename AngleCollection>
inline std::size_t assign_cluster_indices(AngleCollection& sorted, Point const& origin)
{
    // Assign same cluster_index for all turns in same direction
    BOOST_GEOMETRY_ASSERT(boost::size(sorted) >= 4u);

    angle_equal_to<Point> comparator(origin);
    typename boost::range_iterator<AngleCollection>::type it = sorted.begin();

    std::size_t cluster_index = 0;
    it->cluster_index = cluster_index;
    typename boost::range_iterator<AngleCollection>::type previous = it++;
    for (; it != sorted.end(); ++it)
    {
        if (!comparator(*previous, *it))
        {
            cluster_index++;
            previous = it;
        }
        it->cluster_index = cluster_index;
    }
    return cluster_index + 1;
}

template <typename AngleCollection>
inline void block_turns(AngleCollection& sorted, std::size_t cluster_size)
{
    BOOST_GEOMETRY_ASSERT(boost::size(sorted) >= 4u && cluster_size > 0);

    std::vector<std::pair<bool, bool> > directions;
    for (std::size_t i = 0; i < cluster_size; i++)
    {
        directions.push_back(std::make_pair(false, false));
    }

    for (typename boost::range_iterator<AngleCollection const>::type it = sorted.begin();
        it != sorted.end(); ++it)
    {
        if (it->incoming)
        {
            directions[it->cluster_index].first = true;
        }
        else
        {
            directions[it->cluster_index].second = true;
        }
    }

    for (typename boost::range_iterator<AngleCollection>::type it = sorted.begin();
        it != sorted.end(); ++it)
    {
        signed_size_type cluster_index = static_cast<signed_size_type>(it->cluster_index);
        signed_size_type previous_index = cluster_index - 1;
        if (previous_index < 0)
        {
            previous_index = cluster_size - 1;
        }
        signed_size_type next_index = cluster_index + 1;
        if (next_index >= static_cast<signed_size_type>(cluster_size))
        {
            next_index = 0;
        }

        if (directions[cluster_index].first
            && directions[cluster_index].second)
        {
            it->blocked = true;
        }
        else if (!directions[cluster_index].first
            && directions[cluster_index].second
            && directions[previous_index].second)
        {
            // Only outgoing, previous was also outgoing: block this one
            it->blocked = true;
        }
        else if (directions[cluster_index].first
            && !directions[cluster_index].second
            && !directions[previous_index].first
            && directions[previous_index].second)
        {
            // Only incoming, previous was only outgoing: block this one
            it->blocked = true;
        }
        else if (directions[cluster_index].first
            && !directions[cluster_index].second
            && directions[next_index].first
            && !directions[next_index].second)
        {
            // Only incoming, next also incoming, block this one
            it->blocked = true;
        }
    }
}

#if defined(BOOST_GEOMETRY_BUFFER_ENLARGED_CLUSTERS)
template <typename AngleCollection, typename Point>
inline bool has_rounding_issues(AngleCollection const& angles, Point const& origin)
{
    for (typename boost::range_iterator<AngleCollection const>::type it =
        angles.begin(); it != angles.end(); ++it)
    {
        // Vector origin -> p and origin -> q
        typedef Point vector_type;
        vector_type v = it->point;
        geometry::subtract_point(v, origin);
        return geometry::math::abs(geometry::get<0>(v)) <= 1
            || geometry::math::abs(geometry::get<1>(v)) <= 1
            ;
    }
    return false;
}
#endif


}  // namespace left_turns

} // namespace detail
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_GET_LEFT_TURNS_HPP
