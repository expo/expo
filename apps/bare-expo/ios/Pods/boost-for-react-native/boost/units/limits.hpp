// Boost.Units - A C++ library for zero-overhead dimensional analysis and 
// unit/quantity manipulation and conversion
//
// Copyright (C) 2003-2008 Matthias Christian Schabel
// Copyright (C) 2007-2008 Steven Watanabe
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_UNITS_LIMITS_HPP
#define BOOST_UNITS_LIMITS_HPP

///
/// \file
/// \brief specialize std::numeric_limits for units.
///

#include <limits>

#include <boost/config.hpp>
#include <boost/units/units_fwd.hpp>

namespace std {

template<class Unit, class T>
class numeric_limits< ::boost::units::quantity<Unit, T> >
{
    public:
        typedef ::boost::units::quantity<Unit, T> quantity_type;
        static const bool is_specialized = std::numeric_limits<T>::is_specialized;
        static quantity_type (min)() { return(quantity_type::from_value((std::numeric_limits<T>::min)())); }
        static quantity_type (max)() { return(quantity_type::from_value((std::numeric_limits<T>::max)())); }
#ifndef BOOST_NO_CXX11_NUMERIC_LIMITS
        static quantity_type (lowest)() { return(quantity_type::from_value((std::numeric_limits<T>::lowest)())); }
#endif
        static const int digits = std::numeric_limits<T>::digits;
        static const int digits10 = std::numeric_limits<T>::digits10;
#ifndef BOOST_NO_CXX11_NUMERIC_LIMITS
        static const int max_digits10 = std::numeric_limits<T>::max_digits10;
#endif
        static const bool is_signed = std::numeric_limits<T>::is_signed;
        static const bool is_integer = std::numeric_limits<T>::is_integer;
        static const bool is_exact = std::numeric_limits<T>::is_exact;
        static const int radix = std::numeric_limits<T>::radix;
        static quantity_type epsilon()  { return(quantity_type::from_value(std::numeric_limits<T>::epsilon())); }
        static quantity_type round_error()  { return(quantity_type::from_value(std::numeric_limits<T>::round_error())); }
        static const int min_exponent = std::numeric_limits<T>::min_exponent;
        static const int min_exponent10 = std::numeric_limits<T>::min_exponent10;
        static const int max_exponent = std::numeric_limits<T>::max_exponent;
        static const int max_exponent10 = std::numeric_limits<T>::max_exponent10;
        static const bool has_infinity = std::numeric_limits<T>::has_infinity;
        static const bool has_quiet_NaN = std::numeric_limits<T>::has_quiet_NaN;
        static const bool has_signaling_NaN = std::numeric_limits<T>::has_signaling_NaN;
        static const bool has_denorm_loss = std::numeric_limits<T>::has_denorm_loss;
        static quantity_type infinity()  { return(quantity_type::from_value(std::numeric_limits<T>::infinity())); }
        static quantity_type quiet_NaN()  { return(quantity_type::from_value(std::numeric_limits<T>::quiet_NaN())); }
        static quantity_type signaling_NaN()  { return(quantity_type::from_value(std::numeric_limits<T>::signaling_NaN())); }
        static quantity_type denorm_min()  { return(quantity_type::from_value(std::numeric_limits<T>::denorm_min())); }
        static const bool is_iec559 = std::numeric_limits<T>::is_iec559;
        static const bool is_bounded = std::numeric_limits<T>::is_bounded;
        static const bool is_modulo = std::numeric_limits<T>::is_modulo;
        static const bool traps = std::numeric_limits<T>::traps;
        static const bool tinyness_before = std::numeric_limits<T>::tinyness_before;
#if defined(_STLP_STATIC_CONST_INIT_BUG)
        static const int has_denorm = std::numeric_limits<T>::has_denorm;
        static const int round_style = std::numeric_limits<T>::round_style;
#else
        static const float_denorm_style has_denorm = std::numeric_limits<T>::has_denorm;
        static const float_round_style round_style = std::numeric_limits<T>::round_style;
#endif
};

}

#endif // BOOST_UNITS_LIMITS_HPP
