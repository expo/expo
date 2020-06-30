///////////////////////////////////////////////////////////////////////////////
// Copyright Christopher Kormanyos 2014.
// Copyright John Maddock 2014.
// Copyright Paul Bristow 2014.
// Distributed under the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt
// or copy at http://www.boost.org/LICENSE_1_0.txt)
//

// Implement quadruple-precision std::numeric_limits<> support.

#ifndef _BOOST_CSTDFLOAT_LIMITS_2014_01_09_HPP_
  #define _BOOST_CSTDFLOAT_LIMITS_2014_01_09_HPP_

  #include <boost/math/cstdfloat/cstdfloat_types.hpp>

  #if defined(BOOST_CSTDFLOAT_HAS_INTERNAL_FLOAT128_T) && defined(BOOST_MATH_USE_FLOAT128) && !defined(BOOST_CSTDFLOAT_NO_LIBQUADMATH_SUPPORT)

    #include <limits>

    // Define the name of the global quadruple-precision function to be used for
    // calculating quiet_NaN() in the specialization of std::numeric_limits<>.
    #if defined(BOOST_INTEL)
      #define BOOST_CSTDFLOAT_FLOAT128_SQRT   __sqrtq
    #elif defined(__GNUC__)
      #define BOOST_CSTDFLOAT_FLOAT128_SQRT   sqrtq
    #endif

    // Forward declaration of the quadruple-precision square root function.
    extern "C" boost::math::cstdfloat::detail::float_internal128_t BOOST_CSTDFLOAT_FLOAT128_SQRT(boost::math::cstdfloat::detail::float_internal128_t) throw();

    namespace std
    {
      template<>
      class numeric_limits<boost::math::cstdfloat::detail::float_internal128_t>
      {
      public:
        BOOST_STATIC_CONSTEXPR bool                                                 is_specialized           = true;
        static                 boost::math::cstdfloat::detail::float_internal128_t  (min) () BOOST_NOEXCEPT  { return BOOST_CSTDFLOAT_FLOAT128_MIN; }
        static                 boost::math::cstdfloat::detail::float_internal128_t  (max) () BOOST_NOEXCEPT  { return BOOST_CSTDFLOAT_FLOAT128_MAX; }
        static                 boost::math::cstdfloat::detail::float_internal128_t  lowest() BOOST_NOEXCEPT  { return -(max)(); }
        BOOST_STATIC_CONSTEXPR int                                                  digits                   = 113;
        BOOST_STATIC_CONSTEXPR int                                                  digits10                 = 33;
        BOOST_STATIC_CONSTEXPR int                                                  max_digits10             = 36;
        BOOST_STATIC_CONSTEXPR bool                                                 is_signed                = true;
        BOOST_STATIC_CONSTEXPR bool                                                 is_integer               = false;
        BOOST_STATIC_CONSTEXPR bool                                                 is_exact                 = false;
        BOOST_STATIC_CONSTEXPR int                                                  radix                    = 2;
        static                 boost::math::cstdfloat::detail::float_internal128_t  epsilon    ()            { return BOOST_CSTDFLOAT_FLOAT128_EPS; }
        static                 boost::math::cstdfloat::detail::float_internal128_t  round_error()            { return BOOST_FLOAT128_C(0.5); }
        BOOST_STATIC_CONSTEXPR int                                                  min_exponent             = -16381;
        BOOST_STATIC_CONSTEXPR int                                                  min_exponent10           = static_cast<int>((min_exponent * 301L) / 1000L);
        BOOST_STATIC_CONSTEXPR int                                                  max_exponent             = +16384;
        BOOST_STATIC_CONSTEXPR int                                                  max_exponent10           = static_cast<int>((max_exponent * 301L) / 1000L);
        BOOST_STATIC_CONSTEXPR bool                                                 has_infinity             = true;
        BOOST_STATIC_CONSTEXPR bool                                                 has_quiet_NaN            = true;
        BOOST_STATIC_CONSTEXPR bool                                                 has_signaling_NaN        = false;
        BOOST_STATIC_CONSTEXPR float_denorm_style                                   has_denorm               = denorm_absent;
        BOOST_STATIC_CONSTEXPR bool                                                 has_denorm_loss          = false;
        static                 boost::math::cstdfloat::detail::float_internal128_t  infinity     ()          { return BOOST_FLOAT128_C(1.0) / BOOST_FLOAT128_C(0.0); }
        static                 boost::math::cstdfloat::detail::float_internal128_t  quiet_NaN    ()          { return ::BOOST_CSTDFLOAT_FLOAT128_SQRT(BOOST_FLOAT128_C(-1.0)); }
        static                 boost::math::cstdfloat::detail::float_internal128_t  signaling_NaN()          { return BOOST_FLOAT128_C(0.0); }
        static                 boost::math::cstdfloat::detail::float_internal128_t  denorm_min   ()          { return BOOST_FLOAT128_C(0.0); }
        BOOST_STATIC_CONSTEXPR bool                                                 is_iec559                = true;
        BOOST_STATIC_CONSTEXPR bool                                                 is_bounded               = false;
        BOOST_STATIC_CONSTEXPR bool                                                 is_modulo                = false;
        BOOST_STATIC_CONSTEXPR bool                                                 traps                    = false;
        BOOST_STATIC_CONSTEXPR bool                                                 tinyness_before          = false;
        BOOST_STATIC_CONSTEXPR float_round_style                                    round_style              = round_to_nearest;
      };
    } // namespace std

  #endif // Not BOOST_CSTDFLOAT_NO_LIBQUADMATH_SUPPORT (i.e., the user would like to have libquadmath support)

#endif // _BOOST_CSTDFLOAT_LIMITS_2014_01_09_HPP_
