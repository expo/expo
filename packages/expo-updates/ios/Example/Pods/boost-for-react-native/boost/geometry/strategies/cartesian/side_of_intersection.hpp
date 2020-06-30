// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2015.
// Modifications copyright (c) 2015, Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_CARTESIAN_SIDE_OF_INTERSECTION_HPP
#define BOOST_GEOMETRY_STRATEGIES_CARTESIAN_SIDE_OF_INTERSECTION_HPP


#include <limits>

#include <boost/core/ignore_unused.hpp>
#include <boost/type_traits/is_integral.hpp>
#include <boost/type_traits/make_unsigned.hpp>

#include <boost/geometry/arithmetic/determinant.hpp>
#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/algorithms/detail/assign_indexed_point.hpp>
#include <boost/geometry/strategies/cartesian/side_by_triangle.hpp>
#include <boost/geometry/util/math.hpp>

#ifdef BOOST_GEOMETRY_SIDE_OF_INTERSECTION_DEBUG
#include <boost/math/common_factor_ct.hpp>
#include <boost/math/common_factor_rt.hpp>
#include <boost/multiprecision/cpp_int.hpp>
#endif

namespace boost { namespace geometry
{

namespace strategy { namespace side
{

namespace detail
{

// A tool for multiplication of integers avoiding overflow
// It's a temporary workaround until we can use Multiprecision
// The algorithm is based on Karatsuba algorithm
// see: http://en.wikipedia.org/wiki/Karatsuba_algorithm
template <typename T>
struct multiplicable_integral
{
    // Currently this tool can't be used with non-integral coordinate types.
    // Also side_of_intersection strategy sign_of_product() and sign_of_compare()
    // functions would have to be modified to properly support floating-point
    // types (comparisons and multiplication).
    BOOST_STATIC_ASSERT(boost::is_integral<T>::value);

    static const std::size_t bits = CHAR_BIT * sizeof(T);
    static const std::size_t half_bits = bits / 2;
    typedef typename boost::make_unsigned<T>::type unsigned_type;
    static const unsigned_type base = unsigned_type(1) << half_bits; // 2^half_bits

    int m_sign;
    unsigned_type m_ms;
    unsigned_type m_ls;

    multiplicable_integral(int sign, unsigned_type ms, unsigned_type ls)
        : m_sign(sign), m_ms(ms), m_ls(ls)
    {}

    explicit multiplicable_integral(T const& val)
    {
        unsigned_type val_u = val > 0 ?
                                unsigned_type(val)
                              : val == (std::numeric_limits<T>::min)() ?
                                  unsigned_type((std::numeric_limits<T>::max)()) + 1
                                : unsigned_type(-val);
        // MMLL -> S 00MM 00LL
        m_sign = math::sign(val);
        m_ms = val_u >> half_bits; // val_u / base
        m_ls = val_u - m_ms * base;
    }
    
    friend multiplicable_integral operator*(multiplicable_integral const& a,
                                            multiplicable_integral const& b)
    {
        // (S 00MM 00LL) * (S 00MM 00LL) -> (S Z2MM 00LL)
        unsigned_type z2 = a.m_ms * b.m_ms;
        unsigned_type z0 = a.m_ls * b.m_ls;
        unsigned_type z1 = (a.m_ms + a.m_ls) * (b.m_ms + b.m_ls) - z2 - z0;
        // z0 may be >= base so it must be normalized to allow comparison
        unsigned_type z0_ms = z0 >> half_bits; // z0 / base
        return multiplicable_integral(a.m_sign * b.m_sign,
                                      z2 * base + z1 + z0_ms,
                                      z0 - base * z0_ms);
    }

    friend bool operator<(multiplicable_integral const& a,
                          multiplicable_integral const& b)
    {
        if ( a.m_sign == b.m_sign )
        {
            bool u_less = a.m_ms < b.m_ms
                      || (a.m_ms == b.m_ms && a.m_ls < b.m_ls);
            return a.m_sign > 0 ? u_less : (! u_less);
        }
        else
        {
            return a.m_sign < b.m_sign;
        }
    }

    friend bool operator>(multiplicable_integral const& a,
                          multiplicable_integral const& b)
    {
        return b < a;
    }

    template <typename CmpVal>
    void check_value(CmpVal const& cmp_val) const
    {
        unsigned_type b = base; // a workaround for MinGW - undefined reference base
        CmpVal val = CmpVal(m_sign) * (CmpVal(m_ms) * CmpVal(b) + CmpVal(m_ls));
        BOOST_GEOMETRY_ASSERT(cmp_val == val);
    }
};

} // namespace detail

// Calculates the side of the intersection-point (if any) of
// of segment a//b w.r.t. segment c
// This is calculated without (re)calculating the IP itself again and fully
// based on integer mathematics; there are no divisions
// It can be used for either integer (rescaled) points, and also for FP
class side_of_intersection
{
private :
    template <typename T, typename U>
    static inline
    int sign_of_product(T const& a, U const& b)
    {
        return a == 0 || b == 0 ? 0
            : a > 0 && b > 0 ? 1
            : a < 0 && b < 0 ? 1
            : -1;
    }

    template <typename T>
    static inline
    int sign_of_compare(T const& a, T const& b, T const& c, T const& d)
    {
        // Both a*b and c*d are positive
        // We have to judge if a*b > c*d

        using side::detail::multiplicable_integral;
        multiplicable_integral<T> ab = multiplicable_integral<T>(a)
                                     * multiplicable_integral<T>(b);
        multiplicable_integral<T> cd = multiplicable_integral<T>(c)
                                     * multiplicable_integral<T>(d);
        
        int result = ab > cd ? 1
                   : ab < cd ? -1
                   : 0
                   ;

#ifdef BOOST_GEOMETRY_SIDE_OF_INTERSECTION_DEBUG
        using namespace boost::multiprecision;
        cpp_int const lab = cpp_int(a) * cpp_int(b);
        cpp_int const lcd = cpp_int(c) * cpp_int(d);

        ab.check_value(lab);
        cd.check_value(lcd);

        int result2 = lab > lcd ? 1
                    : lab < lcd ? -1
                    : 0
                    ;
        BOOST_GEOMETRY_ASSERT(result == result2);
#endif

        return result;
    }

    template <typename T>
    static inline
    int sign_of_addition_of_two_products(T const& a, T const& b, T const& c, T const& d)
    {
        // sign of a*b+c*d, 1 if positive, -1 if negative, else 0
        int const ab = sign_of_product(a, b);
        int const cd = sign_of_product(c, d);
        if (ab == 0)
        {
            return cd;
        }
        if (cd == 0)
        {
            return ab;
        }

        if (ab == cd)
        {
            // Both positive or both negative
            return ab;
        }

        // One is positive, one is negative, both are non zero
        // If ab is positive, we have to judge if a*b > -c*d (then 1 because sum is positive)
        // If ab is negative, we have to judge if c*d > -a*b (idem)
        return ab == 1
            ? sign_of_compare(a, b, -c, d)
            : sign_of_compare(c, d, -a, b);
    }


public :

    // Calculates the side of the intersection-point (if any) of
    // of segment a//b w.r.t. segment c
    // This is calculated without (re)calculating the IP itself again and fully
    // based on integer mathematics
    template <typename T, typename Segment, typename Point>
    static inline T side_value(Segment const& a, Segment const& b,
                Segment const& c, Point const& fallback_point)
    {
        // The first point of the three segments is reused several times
        T const ax = get<0, 0>(a);
        T const ay = get<0, 1>(a);
        T const bx = get<0, 0>(b);
        T const by = get<0, 1>(b);
        T const cx = get<0, 0>(c);
        T const cy = get<0, 1>(c);

        T const dx_a = get<1, 0>(a) - ax;
        T const dy_a = get<1, 1>(a) - ay;

        T const dx_b = get<1, 0>(b) - bx;
        T const dy_b = get<1, 1>(b) - by;

        T const dx_c = get<1, 0>(c) - cx;
        T const dy_c = get<1, 1>(c) - cy;

        // Cramer's rule: d (see cart_intersect.hpp)
        T const d = geometry::detail::determinant<T>
                    (
                        dx_a, dy_a,
                        dx_b, dy_b
                    );

        T const zero = T();
        if (d == zero)
        {
            // There is no IP of a//b, they are collinear or parallel
            // Assuming they intersect (this method should be called for
            // segments known to intersect), they are collinear and overlap.
            // They have one or two intersection points - we don't know and
            // have to rely on the fallback intersection point

            Point c1, c2;
            geometry::detail::assign_point_from_index<0>(c, c1);
            geometry::detail::assign_point_from_index<1>(c, c2);
            return side_by_triangle<>::apply(c1, c2, fallback_point);
        }

        // Cramer's rule: da (see cart_intersect.hpp)
        T const da = geometry::detail::determinant<T>
                    (
                        dx_b,    dy_b,
                        ax - bx, ay - by
                    );

        // IP is at (ax + (da/d) * dx_a, ay + (da/d) * dy_a)
        // Side of IP is w.r.t. c is: determinant(dx_c, dy_c, ipx-cx, ipy-cy)
        // We replace ipx by expression above and multiply each term by d

#ifdef BOOST_GEOMETRY_SIDE_OF_INTERSECTION_DEBUG
        T const result1 = geometry::detail::determinant<T>
                    (
                        dx_c * d,                   dy_c * d,
                        d * (ax - cx) + dx_a * da,  d * (ay - cy) + dy_a * da
                    );

        // Note: result / (d * d)
        // is identical to the side_value of side_by_triangle
        // Therefore, the sign is always the same as that result, and the
        // resulting side (left,right,collinear) is the same

        // The first row we divide again by d because of determinant multiply rule
        T const result2 = d * geometry::detail::determinant<T>
                    (
                        dx_c,                   dy_c,
                        d * (ax - cx) + dx_a * da,  d * (ay - cy) + dy_a * da
                    );
        // Write out:
        T const result3 = d * (dx_c * (d * (ay - cy) + dy_a * da)
                             - dy_c * (d * (ax - cx) + dx_a * da));
        // Write out in braces:
        T const result4 = d * (dx_c * d * (ay - cy) + dx_c * dy_a * da
                             - dy_c * d * (ax - cx) - dy_c * dx_a * da);
        // Write in terms of d * XX + da * YY
        T const result5 = d * (d * (dx_c * (ay - cy) - dy_c * (ax - cx))
                             + da * (dx_c * dy_a - dy_c * dx_a));

        boost::ignore_unused(result1, result2, result3, result4, result5);
        //return result;
#endif

        // We consider the results separately
        // (in the end we only have to return the side-value 1,0 or -1)

        // To avoid multiplications we judge the product (easy, avoids *d)
        // and the sign of p*q+r*s (more elaborate)
        T const result = sign_of_product
            (
                d,
                sign_of_addition_of_two_products
                    (
                        d, dx_c * (ay - cy) - dy_c * (ax - cx),
                        da, dx_c * dy_a - dy_c * dx_a
                    )
                );
        return result;


    }

    template <typename Segment, typename Point>
    static inline int apply(Segment const& a, Segment const& b,
            Segment const& c,
            Point const& fallback_point)
    {
        typedef typename geometry::coordinate_type<Segment>::type coordinate_type;
        coordinate_type const s = side_value<coordinate_type>(a, b, c, fallback_point);
        coordinate_type const zero = coordinate_type();
        return math::equals(s, zero) ? 0
            : s > zero ? 1
            : -1;
    }

};


}} // namespace strategy::side

}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGIES_CARTESIAN_SIDE_OF_INTERSECTION_HPP
