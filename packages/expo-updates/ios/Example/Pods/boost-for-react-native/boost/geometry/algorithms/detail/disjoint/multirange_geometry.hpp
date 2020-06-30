// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_MULTIRANGE_GEOMETRY_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_MULTIRANGE_GEOMETRY_HPP

#include <boost/range.hpp>

#include <boost/geometry/algorithms/detail/check_iterator_range.hpp>
#include <boost/geometry/algorithms/dispatch/disjoint.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace disjoint
{


template <typename Geometry, typename BinaryPredicate>
class unary_disjoint_geometry_to_query_geometry
{
public:
    unary_disjoint_geometry_to_query_geometry(Geometry const& geometry)
        : m_geometry(geometry)
    {}

    template <typename QueryGeometry>
    inline bool apply(QueryGeometry const& query_geometry) const
    {
        return BinaryPredicate::apply(query_geometry, m_geometry);
    }

private:
    Geometry const& m_geometry;
};


template<typename MultiRange, typename ConstantSizeGeometry>
struct multirange_constant_size_geometry
{
    static inline bool apply(MultiRange const& multirange,
                             ConstantSizeGeometry const& constant_size_geometry)
    {
        typedef unary_disjoint_geometry_to_query_geometry
            <
                ConstantSizeGeometry,
                dispatch::disjoint
                    <
                        typename boost::range_value<MultiRange>::type,
                        ConstantSizeGeometry
                    >
            > unary_predicate_type;

        return detail::check_iterator_range
            <
                unary_predicate_type
            >::apply(boost::begin(multirange), boost::end(multirange),
                     unary_predicate_type(constant_size_geometry));
    }

    static inline bool apply(ConstantSizeGeometry const& constant_size_geometry,
                             MultiRange const& multirange)
    {
        return apply(multirange, constant_size_geometry);
    }
};


}} // namespace detail::disjoint
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_DISJOINT_MULTIRANGE_GEOMETRY_HPP
