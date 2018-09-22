// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015 Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_TRANSFORM_MATRIX_TRANSFORMERS_HPP
#define BOOST_GEOMETRY_STRATEGIES_TRANSFORM_MATRIX_TRANSFORMERS_HPP


#include <cstddef>

// Remove the ublas checking, otherwise the inverse might fail
// (while nothing seems to be wrong)
#ifdef BOOST_UBLAS_TYPE_CHECK
#undef BOOST_UBLAS_TYPE_CHECK
#endif
#define BOOST_UBLAS_TYPE_CHECK 0

#include <boost/numeric/conversion/cast.hpp>

#if defined(__clang__)
// Avoid warning about unused UBLAS function: boost_numeric_ublas_abs
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#endif

#include <boost/numeric/ublas/vector.hpp>
#include <boost/numeric/ublas/matrix.hpp>

#if defined(__clang__)
#pragma clang diagnostic pop
#endif

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/coordinate_dimension.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/promote_floating_point.hpp>
#include <boost/geometry/util/select_coordinate_type.hpp>
#include <boost/geometry/util/select_most_precise.hpp>


namespace boost { namespace geometry
{

namespace strategy { namespace transform
{

/*!
\brief Affine transformation strategy in Cartesian system.
\details The strategy serves as a generic definition of affine transformation matrix
         and procedure of application it to given point.
\see http://en.wikipedia.org/wiki/Affine_transformation
     and http://www.devmaster.net/wiki/Transformation_matrices
\ingroup strategies
\tparam Dimension1 number of dimensions to transform from
\tparam Dimension2 number of dimensions to transform to
 */
template
<
    typename CalculationType,
    std::size_t Dimension1,
    std::size_t Dimension2
>
class ublas_transformer
{
};


template <typename CalculationType>
class ublas_transformer<CalculationType, 2, 2>
{
protected :
    typedef CalculationType ct;
    typedef boost::numeric::ublas::matrix<ct> matrix_type;
    matrix_type m_matrix;

public :

    inline ublas_transformer(
                ct const& m_0_0, ct const& m_0_1, ct const& m_0_2,
                ct const& m_1_0, ct const& m_1_1, ct const& m_1_2,
                ct const& m_2_0, ct const& m_2_1, ct const& m_2_2)
        : m_matrix(3, 3)
    {
        m_matrix(0,0) = m_0_0;   m_matrix(0,1) = m_0_1;   m_matrix(0,2) = m_0_2;
        m_matrix(1,0) = m_1_0;   m_matrix(1,1) = m_1_1;   m_matrix(1,2) = m_1_2;
        m_matrix(2,0) = m_2_0;   m_matrix(2,1) = m_2_1;   m_matrix(2,2) = m_2_2;
    }

    inline ublas_transformer(matrix_type const& matrix)
        : m_matrix(matrix)
    {}


    inline ublas_transformer() : m_matrix(3, 3) {}

    template <typename P1, typename P2>
    inline bool apply(P1 const& p1, P2& p2) const
    {
        assert_dimension_greater_equal<P1, 2>();
        assert_dimension_greater_equal<P2, 2>();

        ct const& c1 = get<0>(p1);
        ct const& c2 = get<1>(p1);

        ct p2x = c1 * m_matrix(0,0) + c2 * m_matrix(0,1) + m_matrix(0,2);
        ct p2y = c1 * m_matrix(1,0) + c2 * m_matrix(1,1) + m_matrix(1,2);

        typedef typename geometry::coordinate_type<P2>::type ct2;
        set<0>(p2, boost::numeric_cast<ct2>(p2x));
        set<1>(p2, boost::numeric_cast<ct2>(p2y));

        return true;
    }

    matrix_type const& matrix() const { return m_matrix; }
};


// It IS possible to go from 3 to 2 coordinates
template <typename CalculationType>
class ublas_transformer<CalculationType, 3, 2> : public ublas_transformer<CalculationType, 2, 2>
{
    typedef CalculationType ct;

public :
    inline ublas_transformer(
                ct const& m_0_0, ct const& m_0_1, ct const& m_0_2,
                ct const& m_1_0, ct const& m_1_1, ct const& m_1_2,
                ct const& m_2_0, ct const& m_2_1, ct const& m_2_2)
        : ublas_transformer<CalculationType, 2, 2>(
                    m_0_0, m_0_1, m_0_2,
                    m_1_0, m_1_1, m_1_2,
                    m_2_0, m_2_1, m_2_2)
    {}

    inline ublas_transformer()
        : ublas_transformer<CalculationType, 2, 2>()
    {}
};


template <typename CalculationType>
class ublas_transformer<CalculationType, 3, 3>
{
protected :
    typedef CalculationType ct;
    typedef boost::numeric::ublas::matrix<ct> matrix_type;
    matrix_type m_matrix;

public :
    inline ublas_transformer(
                ct const& m_0_0, ct const& m_0_1, ct const& m_0_2, ct const& m_0_3,
                ct const& m_1_0, ct const& m_1_1, ct const& m_1_2, ct const& m_1_3,
                ct const& m_2_0, ct const& m_2_1, ct const& m_2_2, ct const& m_2_3,
                ct const& m_3_0, ct const& m_3_1, ct const& m_3_2, ct const& m_3_3
                )
        : m_matrix(4, 4)
    {
        m_matrix(0,0) = m_0_0; m_matrix(0,1) = m_0_1; m_matrix(0,2) = m_0_2; m_matrix(0,3) = m_0_3;
        m_matrix(1,0) = m_1_0; m_matrix(1,1) = m_1_1; m_matrix(1,2) = m_1_2; m_matrix(1,3) = m_1_3;
        m_matrix(2,0) = m_2_0; m_matrix(2,1) = m_2_1; m_matrix(2,2) = m_2_2; m_matrix(2,3) = m_2_3;
        m_matrix(3,0) = m_3_0; m_matrix(3,1) = m_3_1; m_matrix(3,2) = m_3_2; m_matrix(3,3) = m_3_3;
    }

    inline ublas_transformer() : m_matrix(4, 4) {}

    template <typename P1, typename P2>
    inline bool apply(P1 const& p1, P2& p2) const
    {
        ct const& c1 = get<0>(p1);
        ct const& c2 = get<1>(p1);
        ct const& c3 = get<2>(p1);

        typedef typename geometry::coordinate_type<P2>::type ct2;

        set<0>(p2, boost::numeric_cast<ct2>(
            c1 * m_matrix(0,0) + c2 * m_matrix(0,1) + c3 * m_matrix(0,2) + m_matrix(0,3)));
        set<1>(p2, boost::numeric_cast<ct2>(
            c1 * m_matrix(1,0) + c2 * m_matrix(1,1) + c3 * m_matrix(1,2) + m_matrix(1,3)));
        set<2>(p2, boost::numeric_cast<ct2>(
            c1 * m_matrix(2,0) + c2 * m_matrix(2,1) + c3 * m_matrix(2,2) + m_matrix(2,3)));

        return true;
    }

    matrix_type const& matrix() const { return m_matrix; }
};


/*!
\brief Strategy of translate transformation in Cartesian system.
\details Translate moves a geometry a fixed distance in 2 or 3 dimensions.
\see http://en.wikipedia.org/wiki/Translation_%28geometry%29
\ingroup strategies
\tparam Dimension1 number of dimensions to transform from
\tparam Dimension2 number of dimensions to transform to
 */
template
<
    typename CalculationType,
    std::size_t Dimension1,
    std::size_t Dimension2
>
class translate_transformer
{
};


template<typename CalculationType>
class translate_transformer<CalculationType, 2, 2> : public ublas_transformer<CalculationType, 2, 2>
{
public :
    // To have translate transformers compatible for 2/3 dimensions, the
    // constructor takes an optional third argument doing nothing.
    inline translate_transformer(CalculationType const& translate_x,
                CalculationType const& translate_y,
                CalculationType const& = 0)
        : ublas_transformer<CalculationType, 2, 2>(
                1, 0, translate_x,
                0, 1, translate_y,
                0, 0, 1)
    {}
};


template <typename CalculationType>
class translate_transformer<CalculationType, 3, 3> : public ublas_transformer<CalculationType, 3, 3>
{
public :
    inline translate_transformer(CalculationType const& translate_x,
                CalculationType const& translate_y,
                CalculationType const& translate_z)
        : ublas_transformer<CalculationType, 3, 3>(
                1, 0, 0, translate_x,
                0, 1, 0, translate_y,
                0, 0, 1, translate_z,
                0, 0, 0, 1)
    {}

};


/*!
\brief Strategy of scale transformation in Cartesian system.
\details Scale scales a geometry up or down in all its dimensions.
\see http://en.wikipedia.org/wiki/Scaling_%28geometry%29
\ingroup strategies
\tparam Dimension1 number of dimensions to transform from
\tparam Dimension2 number of dimensions to transform to
*/
template
<
    typename CalculationType,
    std::size_t Dimension1,
    std::size_t Dimension2
>
class scale_transformer
{
};


template <typename CalculationType>
class scale_transformer<CalculationType, 2, 2> : public ublas_transformer<CalculationType, 2, 2>
{

public :
    inline scale_transformer(CalculationType const& scale_x,
                CalculationType const& scale_y,
                CalculationType const& = 0)
        : ublas_transformer<CalculationType, 2, 2>(
                scale_x, 0,       0,
                0,       scale_y, 0,
                0,       0,       1)
    {}


    inline scale_transformer(CalculationType const& scale)
        : ublas_transformer<CalculationType, 2, 2>(
                scale, 0,     0,
                0,     scale, 0,
                0,     0,     1)
    {}
};


template <typename CalculationType>
class scale_transformer<CalculationType, 3, 3> : public ublas_transformer<CalculationType, 3, 3>
{
public :
    inline scale_transformer(CalculationType const& scale_x,
                CalculationType const& scale_y,
                CalculationType const& scale_z)
        : ublas_transformer<CalculationType, 3, 3>(
                scale_x, 0,       0,       0,
                0,       scale_y, 0,       0,
                0,       0,       scale_z, 0,
                0,       0,       0,       1)
    {}


    inline scale_transformer(CalculationType const& scale)
        : ublas_transformer<CalculationType, 3, 3>(
                scale, 0,     0,     0,
                0,     scale, 0,     0,
                0,     0,     scale, 0,
                0,     0,     0,     1)
    {}
};


#ifndef DOXYGEN_NO_DETAIL
namespace detail
{


template <typename DegreeOrRadian>
struct as_radian
{};


template <>
struct as_radian<radian>
{
    template <typename T>
    static inline T get(T const& value)
    {
        return value;
    }
};

template <>
struct as_radian<degree>
{
    template <typename T>
    static inline T get(T const& value)
    {
        typedef typename promote_floating_point<T>::type promoted_type;
        return value * math::d2r<promoted_type>();
    }

};


template
<
    typename CalculationType,
    std::size_t Dimension1,
    std::size_t Dimension2
>
class rad_rotate_transformer
    : public ublas_transformer<CalculationType, Dimension1, Dimension2>
{
public :
    inline rad_rotate_transformer(CalculationType const& angle)
        : ublas_transformer<CalculationType, Dimension1, Dimension2>(
                 cos(angle), sin(angle), 0,
                -sin(angle), cos(angle), 0,
                 0,          0,          1)
    {}
};


} // namespace detail
#endif // DOXYGEN_NO_DETAIL


/*!
\brief Strategy for rotate transformation in Cartesian coordinate system.
\details Rotate rotates a geometry of specified angle about a fixed point (e.g. origin).
\see http://en.wikipedia.org/wiki/Rotation_%28mathematics%29
\ingroup strategies
\tparam DegreeOrRadian degree/or/radian, type of rotation angle specification
\note A single angle is needed to specify a rotation in 2D.
      Not yet in 3D, the 3D version requires special things to allow
      for rotation around X, Y, Z or arbitrary axis.
\todo The 3D version will not compile.
 */
template
<
    typename DegreeOrRadian,
    typename CalculationType,
    std::size_t Dimension1,
    std::size_t Dimension2
>
class rotate_transformer : public detail::rad_rotate_transformer<CalculationType, Dimension1, Dimension2>
{

public :
    inline rotate_transformer(CalculationType const& angle)
        : detail::rad_rotate_transformer
            <
                CalculationType, Dimension1, Dimension2
            >(detail::as_radian<DegreeOrRadian>::get(angle))
    {}
};


}} // namespace strategy::transform


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_TRANSFORM_MATRIX_TRANSFORMERS_HPP
