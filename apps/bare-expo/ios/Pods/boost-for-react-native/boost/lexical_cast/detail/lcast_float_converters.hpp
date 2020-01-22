// Copyright Kevlin Henney, 2000-2005.
// Copyright Alexander Nasonov, 2006-2010.
// Copyright Antony Polukhin, 2011-2014.
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// what:  lexical_cast custom keyword cast
// who:   contributed by Kevlin Henney,
//        enhanced with contributions from Terje Slettebo,
//        with additional fixes and suggestions from Gennaro Prota,
//        Beman Dawes, Dave Abrahams, Daryle Walker, Peter Dimov,
//        Alexander Nasonov, Antony Polukhin, Justin Viiret, Michael Hofmann,
//        Cheng Yang, Matthew Bradbury, David W. Birdsall, Pavel Korzh and other Boosters
// when:  November 2000, March 2003, June 2005, June 2006, March 2011 - 2014

#ifndef BOOST_LEXICAL_CAST_DETAIL_LCAST_FLOAT_CONVERTERS_HPP
#define BOOST_LEXICAL_CAST_DETAIL_LCAST_FLOAT_CONVERTERS_HPP

#include <boost/config.hpp>
#ifdef BOOST_HAS_PRAGMA_ONCE
#   pragma once
#endif

#include <cstddef>
#include <cmath>
#include <boost/limits.hpp>
#include <boost/detail/workaround.hpp>

#ifndef BOOST_NO_STD_LOCALE
#   include <locale>
#else
#   ifndef BOOST_LEXICAL_CAST_ASSUME_C_LOCALE
        // Getting error at this point means, that your STL library is old/lame/misconfigured.
        // If nothing can be done with STL library, define BOOST_LEXICAL_CAST_ASSUME_C_LOCALE,
        // but beware: lexical_cast will understand only 'C' locale delimeters and thousands
        // separators.
#       error "Unable to use <locale> header. Define BOOST_LEXICAL_CAST_ASSUME_C_LOCALE to force "
#       error "boost::lexical_cast to use only 'C' locale during conversions."
#   endif
#endif

#include <boost/lexical_cast/detail/lcast_char_constants.hpp>

#include <boost/math/special_functions/sign.hpp>
#include <boost/math/special_functions/fpclassify.hpp>

namespace boost {

    namespace detail // lcast_ret_float
    {

// Silence buggy MS warnings like C4244: '+=' : conversion from 'int' to 'unsigned short', possible loss of data 
#if defined(_MSC_VER) && (_MSC_VER == 1400) 
#  pragma warning(push) 
#  pragma warning(disable:4244) 
#endif 
        template <class T>
        struct mantissa_holder_type
        {
            /* Can not be used with this type */
        };

        template <>
        struct mantissa_holder_type<float>
        {
            typedef unsigned int type;
            typedef double       wide_result_t;
        };

        template <>
        struct mantissa_holder_type<double>
        {
#ifndef BOOST_MATH_NO_LONG_DOUBLE_MATH_FUNCTIONS
            typedef long double  wide_result_t;
#if defined(BOOST_HAS_LONG_LONG)
            typedef boost::ulong_long_type type;
#elif defined(BOOST_HAS_MS_INT64)
            typedef unsigned __int64 type;
#endif
#endif
        };

        template<class Traits, class T, class CharT>
        inline bool lcast_ret_float(T& value, const CharT* begin, const CharT* const end)
        {
            value = static_cast<T>(0);
            if (begin == end) return false;
            if (parse_inf_nan(begin, end, value)) return true;

            CharT const czero = lcast_char_constants<CharT>::zero;
            CharT const minus = lcast_char_constants<CharT>::minus;
            CharT const plus = lcast_char_constants<CharT>::plus;
            CharT const capital_e = lcast_char_constants<CharT>::capital_e;
            CharT const lowercase_e = lcast_char_constants<CharT>::lowercase_e;
            
            /* Getting the plus/minus sign */
            bool const has_minus = Traits::eq(*begin, minus);
            if (has_minus || Traits::eq(*begin, plus)) {
                ++ begin;
                if (begin == end) return false;
            }

#ifndef BOOST_LEXICAL_CAST_ASSUME_C_LOCALE
            std::locale loc;
            typedef std::numpunct<CharT> numpunct;
            numpunct const& np = BOOST_USE_FACET(numpunct, loc);
            std::string const grouping(
                    (loc == std::locale::classic())
                    ? std::string()
                    : np.grouping()
            );
            std::string::size_type const grouping_size = grouping.size();
            CharT const thousands_sep = static_cast<CharT>(grouping_size ? np.thousands_sep() : 0);
            CharT const decimal_point = np.decimal_point();
            bool found_grouping = false;
            std::string::size_type last_grouping_pos = grouping_size - 1;
#else
            CharT const decimal_point = lcast_char_constants<CharT>::c_decimal_separator;
#endif

            bool found_decimal = false;
            bool found_number_before_exp = false;
            typedef int pow_of_10_t;
            pow_of_10_t pow_of_10 = 0;

            typedef BOOST_DEDUCED_TYPENAME mantissa_holder_type<T>::type mantissa_type;
            mantissa_type mantissa=0;
            bool is_mantissa_full = false;
            char length_since_last_delim = 0;

            while (begin != end) {
                if (found_decimal) {
                    /* We allow no thousand_separators after decimal point */

                    const mantissa_type tmp_sub_value = static_cast<mantissa_type>(*begin - czero);
                    if (Traits::eq(*begin, lowercase_e) || Traits::eq(*begin, capital_e)) break;
                    if ( *begin < czero || *begin >= czero + 10 ) return false;
                    if (    is_mantissa_full
                            || ((std::numeric_limits<mantissa_type>::max)() - tmp_sub_value) / 10u  < mantissa
                            ) {
                        is_mantissa_full = true;
                        ++ begin;
                        continue;
                    }

                    -- pow_of_10;
                    mantissa = static_cast<mantissa_type>(mantissa * 10 + tmp_sub_value);

                    found_number_before_exp = true;
                } else {

                    if (*begin >= czero && *begin < czero + 10) {

                        /* Checking for mantissa overflow. If overflow will
                         * occur, them we only increase multiplyer
                         */
                        const mantissa_type tmp_sub_value = static_cast<mantissa_type>(*begin - czero);
                        if(     is_mantissa_full
                                || ((std::numeric_limits<mantissa_type>::max)() - tmp_sub_value) / 10u  < mantissa
                            )
                        {
                            is_mantissa_full = true;
                            ++ pow_of_10;
                        } else {
                            mantissa = static_cast<mantissa_type>(mantissa * 10 + tmp_sub_value);
                        }

                        found_number_before_exp = true;
                        ++ length_since_last_delim;
                    } else if (Traits::eq(*begin, decimal_point) || Traits::eq(*begin, lowercase_e) || Traits::eq(*begin, capital_e)) {
#ifndef BOOST_LEXICAL_CAST_ASSUME_C_LOCALE
                        /* If ( we need to check grouping
                         *      and (   grouping missmatches
                         *              or grouping position is incorrect
                         *              or we are using the grouping position 0 twice
                         *           )
                         *    ) then return error
                         */
                        if( grouping_size && found_grouping
                            && (
                                   length_since_last_delim != grouping[0]
                                   || last_grouping_pos>1
                                   || (last_grouping_pos==0 && grouping_size>1)
                                )
                           ) return false;
#endif

                        if (Traits::eq(*begin, decimal_point)) {
                            ++ begin;
                            found_decimal = true;
                            if (!found_number_before_exp && begin==end) return false;
                            continue;
                        } else {
                            if (!found_number_before_exp) return false;
                            break;
                        }
                    }
#ifndef BOOST_LEXICAL_CAST_ASSUME_C_LOCALE
                    else if (grouping_size && Traits::eq(*begin, thousands_sep)){
                        if(found_grouping)
                        {
                            /* It is not he first time, when we find thousands separator,
                             * so we need to chek, is the distance between two groupings
                             * equal to grouping[last_grouping_pos] */

                            if (length_since_last_delim != grouping[last_grouping_pos] )
                            {
                                if (!last_grouping_pos) return false;
                                else
                                {
                                    -- last_grouping_pos;
                                    if (length_since_last_delim != grouping[last_grouping_pos]) return false;
                                }
                            } else
                                /* We are calling the grouping[0] twice, when grouping size is more than 1 */
                                if (grouping_size>1u && last_grouping_pos+1<grouping_size) return false;

                        } else {
                            /* Delimiter at the begining ',000' */
                            if (!length_since_last_delim) return false;

                            found_grouping = true;
                            if (length_since_last_delim > grouping[last_grouping_pos] ) return false;
                        }

                        length_since_last_delim = 0;
                        ++ begin;

                        /* Delimiter at the end '100,' */
                        if (begin == end) return false;
                        continue;
                    }
#endif
                    else return false;
                }

                ++begin;
            }

            // Exponent found
            if (begin != end && (Traits::eq(*begin, lowercase_e) || Traits::eq(*begin, capital_e))) {
                ++ begin;
                if (begin == end) return false;

                bool const exp_has_minus = Traits::eq(*begin, minus);
                if (exp_has_minus || Traits::eq(*begin, plus)) {
                    ++ begin;
                    if (begin == end) return false;
                }

                pow_of_10_t exp_pow_of_10 = 0;
                while (begin != end) {
                    pow_of_10_t const sub_value = *begin - czero;

                    if ( *begin < czero || *begin >= czero + 10
                         || ((std::numeric_limits<pow_of_10_t>::max)() - sub_value) / 10 < exp_pow_of_10)
                        return false;

                    exp_pow_of_10 *= 10;
                    exp_pow_of_10 += sub_value;
                    ++ begin;
                };

                if (exp_has_minus) {
                    if ((std::numeric_limits<pow_of_10_t>::min)() + exp_pow_of_10 > pow_of_10)
                        return false;   // failed overflow check
                    pow_of_10 -= exp_pow_of_10;
                } else {
                    if ((std::numeric_limits<pow_of_10_t>::max)() - exp_pow_of_10 < pow_of_10)
                        return false;   // failed overflow check
                    pow_of_10 += exp_pow_of_10;
                }
            }

            /* We need a more accurate algorithm... We can not use current algorithm
             * with long doubles (and with doubles if sizeof(double)==sizeof(long double)).
             */
            typedef BOOST_DEDUCED_TYPENAME mantissa_holder_type<T>::wide_result_t wide_result_t;
            const wide_result_t result = std::pow(static_cast<wide_result_t>(10.0), pow_of_10) * mantissa;
            value = static_cast<T>( has_minus ? (boost::math::changesign)(result) : result);

            return !((boost::math::isinf)(value) || (boost::math::isnan)(value));
        }
// Unsilence buggy MS warnings like C4244: '+=' : conversion from 'int' to 'unsigned short', possible loss of data 
#if defined(_MSC_VER) && (_MSC_VER == 1400) 
#  pragma warning(pop) 
#endif
    }
} // namespace boost

#endif // BOOST_LEXICAL_CAST_DETAIL_LCAST_FLOAT_CONVERTERS_HPP

