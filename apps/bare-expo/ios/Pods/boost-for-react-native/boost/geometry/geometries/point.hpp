// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2014 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2014 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2014 Mateusz Loskot, London, UK.
// Copyright (c) 2014 Adam Wulkiewicz, Lodz, Poland.

// This file was modified by Oracle on 2014.
// Modifications copyright (c) 2014, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_GEOMETRIES_POINT_HPP
#define BOOST_GEOMETRY_GEOMETRIES_POINT_HPP

#include <cstddef>

#include <boost/config.hpp>
#include <boost/mpl/assert.hpp>
#include <boost/mpl/int.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/coordinate_system.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>

#if defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
#include <algorithm>
#include <boost/geometry/core/assert.hpp>
#endif

namespace boost { namespace geometry
{

// Silence warning C4127: conditional expression is constant
#if defined(_MSC_VER)
#pragma warning(push)
#pragma warning(disable : 4127)
#endif


namespace model
{

namespace detail
{

template <std::size_t DimensionCount, std::size_t Index>
struct array_assign
{
    template <typename T>
    static inline void apply(T values[], T const& value)
    {
        values[Index] = value;
    }
};

// Specialization avoiding assigning element [2] for only 2 dimensions
template <> struct array_assign<2, 2>
{
    template <typename T> static inline void apply(T [], T const& ) {}
};

// Specialization avoiding assigning elements for (rarely used) points in 1 dim
template <> struct array_assign<1, 1>
{
    template <typename T> static inline void apply(T [], T const& ) {}
};

template <> struct array_assign<1, 2>
{
    template <typename T> static inline void apply(T [], T const& ) {}
};

}
/*!
\brief Basic point class, having coordinates defined in a neutral way
\details Defines a neutral point class, fulfilling the Point Concept.
    Library users can use this point class, or use their own point classes.
    This point class is used in most of the samples and tests of Boost.Geometry
    This point class is used occasionally within the library, where a temporary
    point class is necessary.
\ingroup geometries
\tparam CoordinateType \tparam_numeric
\tparam DimensionCount number of coordinates, usually 2 or 3
\tparam CoordinateSystem coordinate system, for example cs::cartesian

\qbk{[include reference/geometries/point.qbk]}
\qbk{before.synopsis, [heading Model of]}
\qbk{before.synopsis, [link geometry.reference.concepts.concept_point Point Concept]}


*/
template
<
    typename CoordinateType,
    std::size_t DimensionCount,
    typename CoordinateSystem
>
class point
{
    BOOST_MPL_ASSERT_MSG((DimensionCount >= 1),
                         DIMENSION_GREATER_THAN_ZERO_EXPECTED,
                         (boost::mpl::int_<DimensionCount>));

    // The following enum is used to fully instantiate the
    // CoordinateSystem class and check the correctness of the units
    // passed for non-Cartesian coordinate systems.
    enum { cs_check = sizeof(CoordinateSystem) };

public:

#if !defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
#if !defined(BOOST_NO_CXX11_DEFAULTED_FUNCTIONS)
    /// \constructor_default_no_init
    point() = default;
#else
    /// \constructor_default_no_init
    inline point()
    {}
#endif
#else // defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
    point()
    {
        m_created = 1;
        std::fill_n(m_values_initialized, DimensionCount, 0);
    }
    ~point()
    {
        m_created = 0;
        std::fill_n(m_values_initialized, DimensionCount, 0);
    }
#endif

    /// @brief Constructor to set one value
    explicit inline point(CoordinateType const& v0)
    {
        detail::array_assign<DimensionCount, 0>::apply(m_values, v0);
        detail::array_assign<DimensionCount, 1>::apply(m_values, CoordinateType());
        detail::array_assign<DimensionCount, 2>::apply(m_values, CoordinateType());

#if defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
        m_created = 1;
        std::fill_n(m_values_initialized, (std::min)(std::size_t(3), DimensionCount), 1);
#endif
    }

    /// @brief Constructor to set two values
    inline point(CoordinateType const& v0, CoordinateType const& v1)
    {
        detail::array_assign<DimensionCount, 0>::apply(m_values, v0);
        detail::array_assign<DimensionCount, 1>::apply(m_values, v1);
        detail::array_assign<DimensionCount, 2>::apply(m_values, CoordinateType());

#if defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
        m_created = 1;
        std::fill_n(m_values_initialized, (std::min)(std::size_t(3), DimensionCount), 1);
#endif
    }

    /// @brief Constructor to set three values
    inline point(CoordinateType const& v0, CoordinateType const& v1,
            CoordinateType const& v2)
    {
        detail::array_assign<DimensionCount, 0>::apply(m_values, v0);
        detail::array_assign<DimensionCount, 1>::apply(m_values, v1);
        detail::array_assign<DimensionCount, 2>::apply(m_values, v2);

#if defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
        m_created = 1;
        std::fill_n(m_values_initialized, (std::min)(std::size_t(3), DimensionCount), 1);
#endif
    }

    /// @brief Get a coordinate
    /// @tparam K coordinate to get
    /// @return the coordinate
    template <std::size_t K>
    inline CoordinateType const& get() const
    {
#if defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
        BOOST_GEOMETRY_ASSERT(m_created == 1);
        BOOST_GEOMETRY_ASSERT(m_values_initialized[K] == 1);
#endif
        BOOST_STATIC_ASSERT(K < DimensionCount);
        return m_values[K];
    }

    /// @brief Set a coordinate
    /// @tparam K coordinate to set
    /// @param value value to set
    template <std::size_t K>
    inline void set(CoordinateType const& value)
    {
#if defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
        BOOST_GEOMETRY_ASSERT(m_created == 1);
        m_values_initialized[K] = 1;
#endif
        BOOST_STATIC_ASSERT(K < DimensionCount);
        m_values[K] = value;
    }

private:

    CoordinateType m_values[DimensionCount];

#if defined(BOOST_GEOMETRY_ENABLE_ACCESS_DEBUGGING)
    int m_created;
    int m_values_initialized[DimensionCount];
#endif
};


} // namespace model

// Adapt the point to the concept
#ifndef DOXYGEN_NO_TRAITS_SPECIALIZATIONS
namespace traits
{
template
<
    typename CoordinateType,
    std::size_t DimensionCount,
    typename CoordinateSystem
>
struct tag<model::point<CoordinateType, DimensionCount, CoordinateSystem> >
{
    typedef point_tag type;
};

template
<
    typename CoordinateType,
    std::size_t DimensionCount,
    typename CoordinateSystem
>
struct coordinate_type<model::point<CoordinateType, DimensionCount, CoordinateSystem> >
{
    typedef CoordinateType type;
};

template
<
    typename CoordinateType,
    std::size_t DimensionCount,
    typename CoordinateSystem
>
struct coordinate_system<model::point<CoordinateType, DimensionCount, CoordinateSystem> >
{
    typedef CoordinateSystem type;
};

template
<
    typename CoordinateType,
    std::size_t DimensionCount,
    typename CoordinateSystem
>
struct dimension<model::point<CoordinateType, DimensionCount, CoordinateSystem> >
    : boost::mpl::int_<DimensionCount>
{};

template
<
    typename CoordinateType,
    std::size_t DimensionCount,
    typename CoordinateSystem,
    std::size_t Dimension
>
struct access<model::point<CoordinateType, DimensionCount, CoordinateSystem>, Dimension>
{
    static inline CoordinateType get(
        model::point<CoordinateType, DimensionCount, CoordinateSystem> const& p)
    {
        return p.template get<Dimension>();
    }

    static inline void set(
        model::point<CoordinateType, DimensionCount, CoordinateSystem>& p,
        CoordinateType const& value)
    {
        p.template set<Dimension>(value);
    }
};

} // namespace traits
#endif // DOXYGEN_NO_TRAITS_SPECIALIZATIONS

#if defined(_MSC_VER)
#pragma warning(pop)
#endif

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_GEOMETRIES_POINT_HPP
