// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012-2014 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OCCUPATION_INFO_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OCCUPATION_INFO_HPP

#include <algorithm>
#include <boost/range.hpp>

#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/point_type.hpp>

#include <boost/geometry/policies/compare.hpp>
#include <boost/geometry/iterators/closing_iterator.hpp>

#include <boost/geometry/algorithms/detail/get_left_turns.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail
{

template <typename Point, typename T>
struct angle_info
{
    typedef T angle_type;
    typedef Point point_type;

    segment_identifier seg_id;
    std::size_t turn_index;
    int operation_index;
    std::size_t cluster_index;
    Point intersection_point;
    Point point; // either incoming or outgoing point
    bool incoming;
    bool blocked;
    bool included;

    inline angle_info()
        : blocked(false)
        , included(false)
    {}
};

template <typename AngleInfo>
class occupation_info
{
public :
    typedef std::vector<AngleInfo> collection_type;

    std::size_t count;

    inline occupation_info()
        : count(0)
    {}

    template <typename RobustPoint>
    inline void add(RobustPoint const& incoming_point,
                    RobustPoint const& outgoing_point,
                    RobustPoint const& intersection_point,
                    std::size_t turn_index, int operation_index,
                    segment_identifier const& seg_id)
    {
        geometry::equal_to<RobustPoint> comparator;
        if (comparator(incoming_point, intersection_point))
        {
            return;
        }
        if (comparator(outgoing_point, intersection_point))
        {
            return;
        }

        AngleInfo info;
        info.seg_id = seg_id;
        info.turn_index = turn_index;
        info.operation_index = operation_index;
        info.intersection_point = intersection_point;

        {
            info.point = incoming_point;
            info.incoming = true;
            m_angles.push_back(info);
        }
        {
            info.point = outgoing_point;
            info.incoming = false;
            m_angles.push_back(info);
        }
    }

    template <typename RobustPoint, typename Turns>
    inline void get_left_turns(RobustPoint const& origin, Turns& turns)
    {
        // Sort on angle
        std::sort(m_angles.begin(), m_angles.end(),
                detail::left_turns::angle_less<typename AngleInfo::point_type>(origin));

        // Group same-angled elements
        std::size_t cluster_size = detail::left_turns::assign_cluster_indices(m_angles, origin);
        // Block all turns on the right side of any turn
        detail::left_turns::block_turns(m_angles, cluster_size);
        detail::left_turns::get_left_turns(m_angles, turns);
    }

#if defined(BOOST_GEOMETRY_BUFFER_ENLARGED_CLUSTERS)
    template <typename RobustPoint>
    inline bool has_rounding_issues(RobustPoint const& origin) const
    {
        return detail::left_turns::has_rounding_issues(angles, origin);
    }
#endif

private :
    collection_type m_angles; // each turn splitted in incoming/outgoing vectors
};

template<typename Pieces>
inline void move_index(Pieces const& pieces, signed_size_type& index, signed_size_type& piece_index, int direction)
{
    BOOST_GEOMETRY_ASSERT(direction == 1 || direction == -1);
    BOOST_GEOMETRY_ASSERT(
        piece_index >= 0
        && piece_index < static_cast<signed_size_type>(boost::size(pieces)) );
    BOOST_GEOMETRY_ASSERT(
        index >= 0
        && index < static_cast<signed_size_type>(boost::size(pieces[piece_index].robust_ring)));

    // NOTE: both index and piece_index must be in valid range
    // this means that then they could be of type std::size_t
    // if the code below was refactored

    index += direction;
    if (direction == -1 && index < 0)
    {
        piece_index--;
        if (piece_index < 0)
        {
            piece_index = boost::size(pieces) - 1;
        }
        index = boost::size(pieces[piece_index].robust_ring) - 1;
    }
    if (direction == 1
        && index >= static_cast<signed_size_type>(boost::size(pieces[piece_index].robust_ring)))
    {
        piece_index++;
        if (piece_index >= static_cast<signed_size_type>(boost::size(pieces)))
        {
            piece_index = 0;
        }
        index = 0;
    }
}


template
<
    typename RobustPoint,
    typename Turn,
    typename Pieces,
    typename Info
>
inline void add_incoming_and_outgoing_angles(
                RobustPoint const& intersection_point, // rescaled
                Turn const& turn,
                Pieces const& pieces, // using rescaled offsets of it
                int operation_index,
                segment_identifier seg_id,
                Info& info)
{
    segment_identifier real_seg_id = seg_id;
    geometry::equal_to<RobustPoint> comparator;

    // Move backward and forward
    RobustPoint direction_points[2];
    for (int i = 0; i < 2; i++)
    {
        signed_size_type index = turn.operations[operation_index].index_in_robust_ring;
        signed_size_type piece_index = turn.operations[operation_index].piece_index;
        while(comparator(pieces[piece_index].robust_ring[index], intersection_point))
        {
            move_index(pieces, index, piece_index, i == 0 ? -1 : 1);
        }
        direction_points[i] = pieces[piece_index].robust_ring[index];
    }

    info.add(direction_points[0], direction_points[1], intersection_point,
        turn.turn_index, operation_index, real_seg_id);
}


} // namespace detail
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OCCUPATION_INFO_HPP
