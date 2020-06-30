/*!
@file
Defines generally useful preprocessor macros.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_DETAIL_PREPROCESSOR_HPP
#define BOOST_HANA_DETAIL_PREPROCESSOR_HPP

//! @ingroup group-details
//! Macro expanding to the number of arguments it is passed.
//!
//! Specifically, `BOOST_HANA_PP_NARG(x1, ..., xn)` expands to `n`.
//! It is undefined behavior if `n > 64` or if `n == 0`.
#define BOOST_HANA_PP_NARG(...) \
    BOOST_HANA_PP_NARG_IMPL(__VA_ARGS__, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,)

#define BOOST_HANA_PP_NARG_IMPL(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18, e19, e20, e21, e22, e23, e24, e25, e26, e27, e28, e29, e30, e31, e32, e33, e34, e35, e36, e37, e38, e39, e40, e41, e42, e43, e44, e45, e46, e47, e48, e49, e50, e51, e52, e53, e54, e55, e56, e57, e58, e59, e60, e61, e62, e63, N, ...) N

//! @ingroup group-details
//! Expands to the concatenation of its two arguments.
#define BOOST_HANA_PP_CONCAT(x, y) BOOST_HANA_PP_CONCAT_PRIMITIVE(x, y)
#define BOOST_HANA_PP_CONCAT_PRIMITIVE(x, y) x ## y

//! @ingroup group-details
//! Expands to the stringized version of its argument.
#define BOOST_HANA_PP_STRINGIZE(...) BOOST_HANA_PP_STRINGIZE_PRIMITIVE(__VA_ARGS__)
#define BOOST_HANA_PP_STRINGIZE_PRIMITIVE(...) #__VA_ARGS__

//! @ingroup group-details
//! Expands to its last argument.
//!
//! This macro can be passed up to 20 arguments.
#define BOOST_HANA_PP_BACK(...) \
    BOOST_HANA_PP_BACK_IMPL(BOOST_HANA_PP_NARG(__VA_ARGS__), __VA_ARGS__)

#define BOOST_HANA_PP_BACK_IMPL(N, ...) \
    BOOST_HANA_PP_CONCAT(BOOST_HANA_PP_BACK_IMPL_, N)(__VA_ARGS__)

#define BOOST_HANA_PP_BACK_IMPL_1(e0) e0
#define BOOST_HANA_PP_BACK_IMPL_2(e0, e1) e1
#define BOOST_HANA_PP_BACK_IMPL_3(e0, e1, e2) e2
#define BOOST_HANA_PP_BACK_IMPL_4(e0, e1, e2, e3) e3
#define BOOST_HANA_PP_BACK_IMPL_5(e0, e1, e2, e3, e4) e4
#define BOOST_HANA_PP_BACK_IMPL_6(e0, e1, e2, e3, e4, e5) e5
#define BOOST_HANA_PP_BACK_IMPL_7(e0, e1, e2, e3, e4, e5, e6) e6
#define BOOST_HANA_PP_BACK_IMPL_8(e0, e1, e2, e3, e4, e5, e6, e7) e7
#define BOOST_HANA_PP_BACK_IMPL_9(e0, e1, e2, e3, e4, e5, e6, e7, e8) e8
#define BOOST_HANA_PP_BACK_IMPL_10(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9) e9
#define BOOST_HANA_PP_BACK_IMPL_11(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10) e10
#define BOOST_HANA_PP_BACK_IMPL_12(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11) e11
#define BOOST_HANA_PP_BACK_IMPL_13(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12) e12
#define BOOST_HANA_PP_BACK_IMPL_14(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13) e13
#define BOOST_HANA_PP_BACK_IMPL_15(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14) e14
#define BOOST_HANA_PP_BACK_IMPL_16(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15) e15
#define BOOST_HANA_PP_BACK_IMPL_17(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16) e16
#define BOOST_HANA_PP_BACK_IMPL_18(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17) e17
#define BOOST_HANA_PP_BACK_IMPL_19(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18) e18
#define BOOST_HANA_PP_BACK_IMPL_20(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18, e19) e19

//! @ingroup group-details
//! Expands to all of its arguments, except for the last one.
//!
//! This macro can be given up to 20 arguments.
#define BOOST_HANA_PP_DROP_BACK(...) \
    BOOST_HANA_PP_DROP_BACK_IMPL(BOOST_HANA_PP_NARG(__VA_ARGS__), __VA_ARGS__)

#define BOOST_HANA_PP_DROP_BACK_IMPL(N, ...) \
    BOOST_HANA_PP_CONCAT(BOOST_HANA_PP_DROP_BACK_IMPL_, N)(__VA_ARGS__)

#define BOOST_HANA_PP_DROP_BACK_IMPL_1(e0)
#define BOOST_HANA_PP_DROP_BACK_IMPL_2(e0, e1) e0
#define BOOST_HANA_PP_DROP_BACK_IMPL_3(e0, e1, e2) e0, e1
#define BOOST_HANA_PP_DROP_BACK_IMPL_4(e0, e1, e2, e3) e0, e1, e2
#define BOOST_HANA_PP_DROP_BACK_IMPL_5(e0, e1, e2, e3, e4) e0, e1, e2, e3
#define BOOST_HANA_PP_DROP_BACK_IMPL_6(e0, e1, e2, e3, e4, e5) e0, e1, e2, e3, e4
#define BOOST_HANA_PP_DROP_BACK_IMPL_7(e0, e1, e2, e3, e4, e5, e6) e0, e1, e2, e3, e4, e5
#define BOOST_HANA_PP_DROP_BACK_IMPL_8(e0, e1, e2, e3, e4, e5, e6, e7) e0, e1, e2, e3, e4, e5, e6
#define BOOST_HANA_PP_DROP_BACK_IMPL_9(e0, e1, e2, e3, e4, e5, e6, e7, e8) e0, e1, e2, e3, e4, e5, e6, e7
#define BOOST_HANA_PP_DROP_BACK_IMPL_10(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9) e0, e1, e2, e3, e4, e5, e6, e7, e8
#define BOOST_HANA_PP_DROP_BACK_IMPL_11(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9
#define BOOST_HANA_PP_DROP_BACK_IMPL_12(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10
#define BOOST_HANA_PP_DROP_BACK_IMPL_13(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11
#define BOOST_HANA_PP_DROP_BACK_IMPL_14(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12
#define BOOST_HANA_PP_DROP_BACK_IMPL_15(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13
#define BOOST_HANA_PP_DROP_BACK_IMPL_16(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14
#define BOOST_HANA_PP_DROP_BACK_IMPL_17(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15
#define BOOST_HANA_PP_DROP_BACK_IMPL_18(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16
#define BOOST_HANA_PP_DROP_BACK_IMPL_19(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17
#define BOOST_HANA_PP_DROP_BACK_IMPL_20(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18, e19) e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18

//! @ingroup group-details
//! Expands to its first argument.
#define BOOST_HANA_PP_FRONT(...) BOOST_HANA_PP_FRONT_IMPL(__VA_ARGS__, )
#define BOOST_HANA_PP_FRONT_IMPL(e0, ...) e0

//! @ingroup group-details
//! Expands to all of its arguments, except for the first one.
//!
//! This macro may not be called with less than 2 arguments.
#define BOOST_HANA_PP_DROP_FRONT(e0, ...) __VA_ARGS__

#endif // !BOOST_HANA_DETAIL_PREPROCESSOR_HPP
