//  (C) Copyright John Maddock 2008.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_CMATH_HPP_INCLUDED
#  define BOOST_TR1_CMATH_HPP_INCLUDED
#  include <boost/tr1/detail/config.hpp>

#ifdef BOOST_HAS_TR1_CMATH

#  if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
#     include_next BOOST_TR1_HEADER(cmath)
#  else
#     include <boost/tr1/detail/config_all.hpp>
#     include BOOST_TR1_HEADER(cmath)
#  endif

#else

#include <boost/math/tr1.hpp>

namespace std{ namespace tr1{

using boost::math::tr1::assoc_laguerre;
using boost::math::tr1::assoc_laguerref;
using boost::math::tr1::assoc_laguerrel;
// [5.2.1.2] associated Legendre functions:
using boost::math::tr1::assoc_legendre;
using boost::math::tr1::assoc_legendref;
using boost::math::tr1::assoc_legendrel;
// [5.2.1.3] beta function:
using boost::math::tr1::beta;
using boost::math::tr1::betaf;
using boost::math::tr1::betal;
// [5.2.1.4] (complete) elliptic integral of the first kind:
using boost::math::tr1::comp_ellint_1;
using boost::math::tr1::comp_ellint_1f;
using boost::math::tr1::comp_ellint_1l;
// [5.2.1.5] (complete) elliptic integral of the second kind:
using boost::math::tr1::comp_ellint_2;
using boost::math::tr1::comp_ellint_2f;
using boost::math::tr1::comp_ellint_2l;
// [5.2.1.6] (complete) elliptic integral of the third kind:
using boost::math::tr1::comp_ellint_3;
using boost::math::tr1::comp_ellint_3f;
using boost::math::tr1::comp_ellint_3l;
#if 0
// [5.2.1.7] confluent hypergeometric functions:
using boost::math::tr1::conf_hyperg;
using boost::math::tr1::conf_hypergf;
using boost::math::tr1::conf_hypergl;
#endif
// [5.2.1.8] regular modified cylindrical Bessel functions:
using boost::math::tr1::cyl_bessel_i;
using boost::math::tr1::cyl_bessel_if;
using boost::math::tr1::cyl_bessel_il;
// [5.2.1.9] cylindrical Bessel functions (of the first kind):
using boost::math::tr1::cyl_bessel_j;
using boost::math::tr1::cyl_bessel_jf;
using boost::math::tr1::cyl_bessel_jl;
// [5.2.1.10] irregular modified cylindrical Bessel functions:
using boost::math::tr1::cyl_bessel_k;
using boost::math::tr1::cyl_bessel_kf;
using boost::math::tr1::cyl_bessel_kl;
// [5.2.1.11] cylindrical Neumann functions;
// cylindrical Bessel functions (of the second kind):
using boost::math::tr1::cyl_neumann;
using boost::math::tr1::cyl_neumannf;
using boost::math::tr1::cyl_neumannl;
// [5.2.1.12] (incomplete) elliptic integral of the first kind:
using boost::math::tr1::ellint_1;
using boost::math::tr1::ellint_1f;
using boost::math::tr1::ellint_1l;
// [5.2.1.13] (incomplete) elliptic integral of the second kind:
using boost::math::tr1::ellint_2;
using boost::math::tr1::ellint_2f;
using boost::math::tr1::ellint_2l;
// [5.2.1.14] (incomplete) elliptic integral of the third kind:
using boost::math::tr1::ellint_3;
using boost::math::tr1::ellint_3f;
using boost::math::tr1::ellint_3l;
// [5.2.1.15] exponential integral:
using boost::math::tr1::expint;
using boost::math::tr1::expintf;
using boost::math::tr1::expintl;
// [5.2.1.16] Hermite polynomials:
using boost::math::tr1::hermite;
using boost::math::tr1::hermitef;
using boost::math::tr1::hermitel;
#if 0
// [5.2.1.17] hypergeometric functions:
using boost::math::tr1::hyperg;
using boost::math::tr1::hypergf;
using boost::math::tr1::hypergl;
#endif
// [5.2.1.18] Laguerre polynomials:
using boost::math::tr1::laguerre;
using boost::math::tr1::laguerref;
using boost::math::tr1::laguerrel;
// [5.2.1.19] Legendre polynomials:
using boost::math::tr1::legendre;
using boost::math::tr1::legendref;
using boost::math::tr1::legendrel;
// [5.2.1.20] Riemann zeta function:
using boost::math::tr1::riemann_zeta;
using boost::math::tr1::riemann_zetaf;
using boost::math::tr1::riemann_zetal;
// [5.2.1.21] spherical Bessel functions (of the first kind):
using boost::math::tr1::sph_bessel;
using boost::math::tr1::sph_besself;
using boost::math::tr1::sph_bessell;
// [5.2.1.22] spherical associated Legendre functions:
using boost::math::tr1::sph_legendre;
using boost::math::tr1::sph_legendref;
using boost::math::tr1::sph_legendrel;
// [5.2.1.23] spherical Neumann functions;
// spherical Bessel functions (of the second kind):
using boost::math::tr1::sph_neumann;
using boost::math::tr1::sph_neumannf;
using boost::math::tr1::sph_neumannl;

// types
using boost::math::tr1::double_t;
using boost::math::tr1::float_t;
// functions
using boost::math::tr1::acosh;
using boost::math::tr1::acoshf;
using boost::math::tr1::acoshl;
using boost::math::tr1::asinh;
using boost::math::tr1::asinhf;
using boost::math::tr1::asinhl;
using boost::math::tr1::atanh;
using boost::math::tr1::atanhf;
using boost::math::tr1::atanhl;
using boost::math::tr1::cbrt;
using boost::math::tr1::cbrtf;
using boost::math::tr1::cbrtl;
using boost::math::tr1::copysign;
using boost::math::tr1::copysignf;
using boost::math::tr1::copysignl;
using boost::math::tr1::erf;
using boost::math::tr1::erff;
using boost::math::tr1::erfl;
using boost::math::tr1::erfc;
using boost::math::tr1::erfcf;
using boost::math::tr1::erfcl;
#if 0
using boost::math::tr1::exp2;
using boost::math::tr1::exp2f;
using boost::math::tr1::exp2l;
#endif
using boost::math::tr1::expm1;
using boost::math::tr1::expm1f;
using boost::math::tr1::expm1l;
#if 0
using boost::math::tr1::fdim;
using boost::math::tr1::fdimf;
using boost::math::tr1::fdiml;
using boost::math::tr1::fma;
using boost::math::tr1::fmaf;
using boost::math::tr1::fmal;
#endif
using boost::math::tr1::fmax;
using boost::math::tr1::fmaxf;
using boost::math::tr1::fmaxl;
using boost::math::tr1::fmin;
using boost::math::tr1::fminf;
using boost::math::tr1::fminl;
using boost::math::tr1::hypot;
using boost::math::tr1::hypotf;
using boost::math::tr1::hypotl;
#if 0
using boost::math::tr1::ilogb;
using boost::math::tr1::ilogbf;
using boost::math::tr1::ilogbl;
#endif
using boost::math::tr1::lgamma;
using boost::math::tr1::lgammaf;
using boost::math::tr1::lgammal;
#if 0
using boost::math::tr1::llrint;
using boost::math::tr1::llrintf;
using boost::math::tr1::llrintl;
#endif
using boost::math::tr1::llround;
using boost::math::tr1::llroundf;
using boost::math::tr1::llroundl;
using boost::math::tr1::log1p;
using boost::math::tr1::log1pf;
using boost::math::tr1::log1pl;
#if 0
using boost::math::tr1::log2;
using boost::math::tr1::log2f;
using boost::math::tr1::log2l;
using boost::math::tr1::logb;
using boost::math::tr1::logbf;
using boost::math::tr1::logbl;
using boost::math::tr1::lrint;
using boost::math::tr1::lrintf;
using boost::math::tr1::lrintl;
#endif
using boost::math::tr1::lround;
using boost::math::tr1::lroundf;
using boost::math::tr1::lroundl;
#if 0
using boost::math::tr1::nan;
using boost::math::tr1::nanf;
using boost::math::tr1::nanl;
using boost::math::tr1::nearbyint;
using boost::math::tr1::nearbyintf;
using boost::math::tr1::nearbyintl;
#endif
using boost::math::tr1::nextafter;
using boost::math::tr1::nextafterf;
using boost::math::tr1::nextafterl;
using boost::math::tr1::nexttoward;
using boost::math::tr1::nexttowardf;
using boost::math::tr1::nexttowardl;
#if 0
using boost::math::tr1::remainder;
using boost::math::tr1::remainderf;
using boost::math::tr1::remainderl;
using boost::math::tr1::remquo;
using boost::math::tr1::remquof;
using boost::math::tr1::remquol;
using boost::math::tr1::rint;
using boost::math::tr1::rintf;
using boost::math::tr1::rintl;
#endif
using boost::math::tr1::round;
using boost::math::tr1::roundf;
using boost::math::tr1::roundl;
#if 0
using boost::math::tr1::scalbln;
using boost::math::tr1::scalblnf;
using boost::math::tr1::scalblnl;
using boost::math::tr1::scalbn;
using boost::math::tr1::scalbnf;
using boost::math::tr1::scalbnl;
#endif
using boost::math::tr1::tgamma;
using boost::math::tr1::tgammaf;
using boost::math::tr1::tgammal;
using boost::math::tr1::trunc;
using boost::math::tr1::truncf;
using boost::math::tr1::truncl;
// C99 macros defined as C++ templates
using boost::math::tr1::signbit;
using boost::math::tr1::fpclassify;
using boost::math::tr1::isfinite;
using boost::math::tr1::isinf;
using boost::math::tr1::isnan;
using boost::math::tr1::isnormal;
#if 0
using boost::math::tr1::isgreater;
using boost::math::tr1::isgreaterequal;
using boost::math::tr1::isless;
using boost::math::tr1::islessequal;
using boost::math::tr1::islessgreater;
using boost::math::tr1::isunordered;
#endif
} } // namespaces

#endif // BOOST_HAS_TR1_CMATH

#endif // BOOST_TR1_CMATH_HPP_INCLUDED
