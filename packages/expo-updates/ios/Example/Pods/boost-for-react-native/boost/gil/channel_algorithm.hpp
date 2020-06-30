/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_CHANNEL_ALGORITHM_HPP
#define GIL_CHANNEL_ALGORITHM_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Channel algorithms
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on May 6, 2007
///
/// Definitions of standard GIL 8-bit, 16-bit, 32-bit channels
///
////////////////////////////////////////////////////////////////////////////////////////

#include "gil_config.hpp"
#include "channel.hpp"
#include <boost/mpl/less.hpp>
#include <boost/mpl/integral_c.hpp>
#include <boost/mpl/greater.hpp>
#include <boost/type_traits.hpp>

namespace boost { namespace gil {

//#ifdef _MSC_VER
//#pragma warning(push)
//#pragma warning(disable: 4309)      // disable truncation of constant value warning (using -1 to get the max value of an integral)
//#endif

namespace detail {

// some forward declarations
template <typename SrcChannelV, typename DstChannelV, bool SrcIsIntegral, bool DstIsIntegral> struct channel_converter_unsigned_impl;
template <typename SrcChannelV, typename DstChannelV, bool SrcIsGreater> struct channel_converter_unsigned_integral;
template <typename SrcChannelV, typename DstChannelV, bool SrcLessThanDst, bool SrcDivisible> struct channel_converter_unsigned_integral_impl;
template <typename SrcChannelV, typename DstChannelV, bool SrcLessThanDst, bool CannotFitInInteger> struct channel_converter_unsigned_integral_nondivisible;

//////////////////////////////////////
////  unsigned_integral_max_value - given an unsigned integral channel type, returns its maximum value as an MPL integral constant
//////////////////////////////////////


template <typename UnsignedIntegralChannel>
struct unsigned_integral_max_value : public mpl::integral_c<UnsignedIntegralChannel,-1> {};

template <>
struct unsigned_integral_max_value<uint8_t> : public mpl::integral_c<uint32_t,0xFF> {};
template <>
struct unsigned_integral_max_value<uint16_t> : public mpl::integral_c<uint32_t,0xFFFF> {};
template <>
struct unsigned_integral_max_value<uint32_t> : public mpl::integral_c<uintmax_t,0xFFFFFFFF> {};


template <int K>
struct unsigned_integral_max_value<packed_channel_value<K> >
    : public mpl::integral_c<typename packed_channel_value<K>::integer_t, (1<<K)-1> {};

//////////////////////////////////////
////  unsigned_integral_num_bits - given an unsigned integral channel type, returns the minimum number of bits needed to represent it
//////////////////////////////////////

template <typename UnsignedIntegralChannel>
struct unsigned_integral_num_bits : public mpl::int_<sizeof(UnsignedIntegralChannel)*8> {};

template <int K>
struct unsigned_integral_num_bits<packed_channel_value<K> >
    : public mpl::int_<K> {};

} // namespace detail

/**
\defgroup ChannelConvertAlgorithm channel_convert
\brief Converting from one channel type to another
\ingroup ChannelAlgorithm

Conversion is done as a simple linear mapping of one channel range to the other, 
such that the minimum/maximum value of the source maps to the minimum/maximum value of the destination.
One implication of this is that the value 0 of signed channels may not be preserved!

When creating new channel models, it is often a good idea to provide specializations for the channel conversion algorithms, for
example, for performance optimizations. If the new model is an integral type that can be signed, it is easier to define the conversion 
only for the unsigned type (\p channel_converter_unsigned) and provide specializations of \p detail::channel_convert_to_unsigned 
and \p detail::channel_convert_from_unsigned to convert between the signed and unsigned type.

Example:
\code
// bits32f is a floating point channel with range [0.0f ... 1.0f]
bits32f src_channel = channel_traits<bits32f>::max_value();
assert(src_channel == 1);

// bits8 is 8-bit unsigned integral channel (typedef-ed from unsigned char)
bits8 dst_channel = channel_convert<bits8>(src_channel);
assert(dst_channel == 255);     // max value goes to max value
\endcode
*/

/** 
\defgroup ChannelConvertUnsignedAlgorithm channel_converter_unsigned
\ingroup ChannelConvertAlgorithm
\brief Convert one unsigned/floating point channel to another. Converts both the channel type and range
 @{
 */

//////////////////////////////////////
////  channel_converter_unsigned
//////////////////////////////////////

template <typename SrcChannelV, typename DstChannelV>     // Model ChannelValueConcept
struct channel_converter_unsigned
    : public detail::channel_converter_unsigned_impl<SrcChannelV,DstChannelV,is_integral<SrcChannelV>::value,is_integral<DstChannelV>::value> {};


/// \brief Converting a channel to itself - identity operation
template <typename T> struct channel_converter_unsigned<T,T> : public detail::identity<T> {};


namespace detail {

//////////////////////////////////////
////  channel_converter_unsigned_impl
//////////////////////////////////////

/// \brief This is the default implementation. Performance specializatons are provided
template <typename SrcChannelV, typename DstChannelV, bool SrcIsIntegral, bool DstIsIntegral> 
struct channel_converter_unsigned_impl : public std::unary_function<DstChannelV,SrcChannelV> {
    DstChannelV operator()(SrcChannelV src) const { 
        return DstChannelV(channel_traits<DstChannelV>::min_value() +
            (src - channel_traits<SrcChannelV>::min_value()) / channel_range<SrcChannelV>() * channel_range<DstChannelV>()); 
    }
private:
    template <typename C>
    static double channel_range() {
        return double(channel_traits<C>::max_value()) - double(channel_traits<C>::min_value());
    }
};

// When both the source and the destination are integral channels, perform a faster conversion
template <typename SrcChannelV, typename DstChannelV> 
struct channel_converter_unsigned_impl<SrcChannelV,DstChannelV,true,true>
    : public channel_converter_unsigned_integral<SrcChannelV,DstChannelV,
    mpl::less<unsigned_integral_max_value<SrcChannelV>,unsigned_integral_max_value<DstChannelV> >::value > {};


//////////////////////////////////////
////  channel_converter_unsigned_integral
//////////////////////////////////////

template <typename SrcChannelV, typename DstChannelV> 
struct channel_converter_unsigned_integral<SrcChannelV,DstChannelV,true>
    : public channel_converter_unsigned_integral_impl<SrcChannelV,DstChannelV,true,
    !(unsigned_integral_max_value<DstChannelV>::value % unsigned_integral_max_value<SrcChannelV>::value) > {};

template <typename SrcChannelV, typename DstChannelV> 
struct channel_converter_unsigned_integral<SrcChannelV,DstChannelV,false>
    : public channel_converter_unsigned_integral_impl<SrcChannelV,DstChannelV,false,
    !(unsigned_integral_max_value<SrcChannelV>::value % unsigned_integral_max_value<DstChannelV>::value) > {};


//////////////////////////////////////
////  channel_converter_unsigned_integral_impl
//////////////////////////////////////

// Both source and destination are unsigned integral channels, 
// the src max value is less than the dst max value,
// and the dst max value is divisible by the src max value
template <typename SrcChannelV, typename DstChannelV> 
struct channel_converter_unsigned_integral_impl<SrcChannelV,DstChannelV,true,true> {
    DstChannelV operator()(SrcChannelV src) const { 
        typedef typename unsigned_integral_max_value<DstChannelV>::value_type integer_t;
        static const integer_t mul = unsigned_integral_max_value<DstChannelV>::value / unsigned_integral_max_value<SrcChannelV>::value;
        return DstChannelV(src * mul);
    }
};

// Both source and destination are unsigned integral channels, 
// the dst max value is less than (or equal to) the src max value,
// and the src max value is divisible by the dst max value
template <typename SrcChannelV, typename DstChannelV> 
struct channel_converter_unsigned_integral_impl<SrcChannelV,DstChannelV,false,true> {
    DstChannelV operator()(SrcChannelV src) const { 
        typedef typename unsigned_integral_max_value<SrcChannelV>::value_type integer_t;
        static const integer_t div = unsigned_integral_max_value<SrcChannelV>::value / unsigned_integral_max_value<DstChannelV>::value;
        static const integer_t div2 = div/2;
        return DstChannelV((src + div2) / div);
    }
};

// Prevent overflow for the largest integral type
template <typename DstChannelV> 
struct channel_converter_unsigned_integral_impl<uintmax_t,DstChannelV,false,true> {
    DstChannelV operator()(uintmax_t src) const { 
        static const uintmax_t div = unsigned_integral_max_value<bits32>::value / unsigned_integral_max_value<DstChannelV>::value;
        static const uintmax_t div2 = div/2;
        if (src > unsigned_integral_max_value<uintmax_t>::value - div2)
            return unsigned_integral_max_value<DstChannelV>::value;
        return DstChannelV((src + div2) / div);
    }
};

// Both source and destination are unsigned integral channels, 
// and the dst max value is not divisible by the src max value
// See if you can represent the expression (src * dst_max) / src_max in integral form
template <typename SrcChannelV, typename DstChannelV, bool SrcLessThanDst> 
struct channel_converter_unsigned_integral_impl<SrcChannelV,DstChannelV,SrcLessThanDst,false> 
    : public channel_converter_unsigned_integral_nondivisible<SrcChannelV,DstChannelV,SrcLessThanDst,
    mpl::greater<
        mpl::plus<unsigned_integral_num_bits<SrcChannelV>,unsigned_integral_num_bits<DstChannelV> >,
        unsigned_integral_num_bits<uintmax_t>
    >::value> {};


// Both source and destination are unsigned integral channels, 
// the src max value is less than the dst max value,
// and the dst max value is not divisible by the src max value
// The expression (src * dst_max) / src_max fits in an integer
template <typename SrcChannelV, typename DstChannelV> 
struct channel_converter_unsigned_integral_nondivisible<SrcChannelV,DstChannelV,true,false> {
    DstChannelV operator()(SrcChannelV src) const {
        typedef typename detail::min_fast_uint<unsigned_integral_num_bits<SrcChannelV>::value+unsigned_integral_num_bits<DstChannelV>::value>::type integer_t;
        return DstChannelV(integer_t(src * unsigned_integral_max_value<DstChannelV>::value) / unsigned_integral_max_value<SrcChannelV>::value);
    }
};

// Both source and destination are unsigned integral channels, 
// the src max value is less than the dst max value,
// and the dst max value is not divisible by the src max value
// The expression (src * dst_max) / src_max cannot fit in an integer (overflows). Use a double
template <typename SrcChannelV, typename DstChannelV> 
struct channel_converter_unsigned_integral_nondivisible<SrcChannelV,DstChannelV,true,true> {
    DstChannelV operator()(SrcChannelV src) const {
        static const double mul = unsigned_integral_max_value<DstChannelV>::value / double(unsigned_integral_max_value<SrcChannelV>::value);
        return DstChannelV(src * mul);
    }
};

// Both source and destination are unsigned integral channels, 
// the dst max value is less than (or equal to) the src max value,
// and the src max value is not divisible by the dst max value
template <typename SrcChannelV, typename DstChannelV, bool CannotFit> 
struct channel_converter_unsigned_integral_nondivisible<SrcChannelV,DstChannelV,false,CannotFit> {
    DstChannelV operator()(SrcChannelV src) const { 

        typedef typename detail::unsigned_integral_max_value< SrcChannelV >::value_type src_integer_t;
        typedef typename detail::unsigned_integral_max_value< DstChannelV >::value_type dst_integer_t;

        static const double div = unsigned_integral_max_value<SrcChannelV>::value 
                                / static_cast< double >( unsigned_integral_max_value<DstChannelV>::value );

        static const src_integer_t div2 = static_cast< src_integer_t >( div / 2.0 );

        return DstChannelV( static_cast< dst_integer_t >(( static_cast< double >( src + div2 ) / div )));
    }
};

} // namespace detail

/////////////////////////////////////////////////////
///  bits32f conversion
/////////////////////////////////////////////////////

template <typename DstChannelV> struct channel_converter_unsigned<bits32f,DstChannelV> : public std::unary_function<bits32f,DstChannelV> {
    DstChannelV operator()(bits32f x) const
    {
        typedef typename detail::unsigned_integral_max_value< DstChannelV >::value_type dst_integer_t;
        return DstChannelV( static_cast< dst_integer_t >(x*channel_traits<DstChannelV>::max_value()+0.5f ));
    }
};

template <typename SrcChannelV> struct channel_converter_unsigned<SrcChannelV,bits32f> : public std::unary_function<SrcChannelV,bits32f> {
    bits32f operator()(SrcChannelV   x) const { return bits32f(x/float(channel_traits<SrcChannelV>::max_value())); }
};

template <> struct channel_converter_unsigned<bits32f,bits32f> : public std::unary_function<bits32f,bits32f> {
    bits32f operator()(bits32f   x) const { return x; }
};


/// \brief 32 bit <-> float channel conversion
template <> struct channel_converter_unsigned<bits32,bits32f> : public std::unary_function<bits32,bits32f> {
    bits32f operator()(bits32 x) const { 
        // unfortunately without an explicit check it is possible to get a round-off error. We must ensure that max_value of bits32 matches max_value of bits32f
        if (x>=channel_traits<bits32>::max_value()) return channel_traits<bits32f>::max_value();
        return float(x) / float(channel_traits<bits32>::max_value());
    }
};
/// \brief 32 bit <-> float channel conversion
template <> struct channel_converter_unsigned<bits32f,bits32> : public std::unary_function<bits32f,bits32> {
    bits32 operator()(bits32f x) const { 
        // unfortunately without an explicit check it is possible to get a round-off error. We must ensure that max_value of bits32 matches max_value of bits32f
        if (x>=channel_traits<bits32f>::max_value()) return channel_traits<bits32>::max_value();
        return bits32(x * channel_traits<bits32>::max_value() + 0.5f); 
    }
};

/// @} 

namespace detail {
// Converting from signed to unsigned integral channel. 
// It is both a unary function, and a metafunction (thus requires the 'type' nested typedef, which equals result_type)
template <typename ChannelValue>     // Model ChannelValueConcept
struct channel_convert_to_unsigned : public detail::identity<ChannelValue> {
    typedef ChannelValue type;
};

template <> struct channel_convert_to_unsigned<bits8s> : public std::unary_function<bits8s,bits8> { 
    typedef bits8 type;
    type operator()(bits8s  val) const { return val+128; } 
};

template <> struct channel_convert_to_unsigned<bits16s> : public std::unary_function<bits16s,bits16> { 
    typedef bits16 type;
    type operator()(bits16s  val) const { return val+32768; } 
};

template <> struct channel_convert_to_unsigned<bits32s> : public std::unary_function<bits32s,bits32> {
    typedef bits32 type;
    type operator()(bits32s x) const { return static_cast<bits32>(x+(1<<31)); }
};


// Converting from unsigned to signed integral channel
// It is both a unary function, and a metafunction (thus requires the 'type' nested typedef, which equals result_type)
template <typename ChannelValue>     // Model ChannelValueConcept
struct channel_convert_from_unsigned : public detail::identity<ChannelValue> {
    typedef ChannelValue type;
};

template <> struct channel_convert_from_unsigned<bits8s> : public std::unary_function<bits8,bits8s> { 
    typedef bits8s type;
    type  operator()(bits8  val) const { return val-128; } 
};

template <> struct channel_convert_from_unsigned<bits16s> : public std::unary_function<bits16,bits16s> { 
    typedef bits16s type;
    type operator()(bits16 val) const { return val-32768; } 
};

template <> struct channel_convert_from_unsigned<bits32s> : public std::unary_function<bits32,bits32s> {
    typedef bits32s type;
    type operator()(bits32 x) const { return static_cast<bits32s>(x-(1<<31)); }
};

}   // namespace detail

/// \ingroup ChannelConvertAlgorithm
/// \brief A unary function object converting between channel types
template <typename SrcChannelV, typename DstChannelV> // Model ChannelValueConcept
struct channel_converter : public std::unary_function<SrcChannelV,DstChannelV> {
    DstChannelV operator()(const SrcChannelV& src) const {
        typedef detail::channel_convert_to_unsigned<SrcChannelV> to_unsigned;
        typedef detail::channel_convert_from_unsigned<DstChannelV>   from_unsigned;
        typedef channel_converter_unsigned<typename to_unsigned::result_type, typename from_unsigned::argument_type> converter_unsigned;
        return from_unsigned()(converter_unsigned()(to_unsigned()(src))); 
    }
};

/// \ingroup ChannelConvertAlgorithm
/// \brief Converting from one channel type to another.
template <typename DstChannel, typename SrcChannel> // Model ChannelConcept (could be channel references)
inline typename channel_traits<DstChannel>::value_type channel_convert(const SrcChannel& src) { 
    return channel_converter<typename channel_traits<SrcChannel>::value_type,
                             typename channel_traits<DstChannel>::value_type>()(src); 
}

/// \ingroup ChannelConvertAlgorithm
/// \brief Same as channel_converter, except it takes the destination channel by reference, which allows 
///        us to move the templates from the class level to the method level. This is important when invoking it
///        on heterogeneous pixels.
struct default_channel_converter {
    template <typename Ch1, typename Ch2>
    void operator()(const Ch1& src, Ch2& dst) const {
        dst=channel_convert<Ch2>(src);
    }
};

namespace detail {
    // fast integer division by 255
    inline uint32_t div255(uint32_t in) { uint32_t tmp=in+128; return (tmp + (tmp>>8))>>8; }

    // fast integer divison by 32768
    inline uint32_t div32768(uint32_t in) { return (in+16384)>>15; }
}

/**
\defgroup ChannelMultiplyAlgorithm channel_multiply
\ingroup ChannelAlgorithm
\brief Multiplying unsigned channel values of the same type. Performs scaled multiplication result = a * b / max_value

Example:
\code
bits8 x=128;
bits8 y=128;
bits8 mul = channel_multiply(x,y);
assert(mul == 64);    // 64 = 128 * 128 / 255
\endcode
*/
/// @{

/// \brief This is the default implementation. Performance specializatons are provided
template <typename ChannelValue>
struct channel_multiplier_unsigned : public std::binary_function<ChannelValue,ChannelValue,ChannelValue> {
    ChannelValue operator()(ChannelValue a, ChannelValue b) const {
        return ChannelValue(a / double(channel_traits<ChannelValue>::max_value()) * b);
    }
};

/// \brief Specialization of channel_multiply for 8-bit unsigned channels
template<> struct channel_multiplier_unsigned<bits8> : public std::binary_function<bits8,bits8,bits8> {
    bits8 operator()(bits8 a, bits8 b) const { return bits8(detail::div255(uint32_t(a) * uint32_t(b))); }
};

/// \brief Specialization of channel_multiply for 16-bit unsigned channels
template<> struct channel_multiplier_unsigned<bits16> : public std::binary_function<bits16,bits16,bits16> {
    bits16 operator()(bits16 a, bits16 b) const { return bits16((uint32_t(a) * uint32_t(b))/65535); }
};

/// \brief Specialization of channel_multiply for float 0..1 channels
template<> struct channel_multiplier_unsigned<bits32f> : public std::binary_function<bits32f,bits32f,bits32f> {
    bits32f operator()(bits32f a, bits32f b) const { return a*b; }
};

/// \brief A function object to multiply two channels. result = a * b / max_value
template <typename ChannelValue>
struct channel_multiplier : public std::binary_function<ChannelValue, ChannelValue, ChannelValue> {
    ChannelValue operator()(ChannelValue a, ChannelValue b) const {
        typedef detail::channel_convert_to_unsigned<ChannelValue> to_unsigned;
        typedef detail::channel_convert_from_unsigned<ChannelValue>   from_unsigned;
        typedef channel_multiplier_unsigned<typename to_unsigned::result_type> multiplier_unsigned;
        return from_unsigned()(multiplier_unsigned()(to_unsigned()(a), to_unsigned()(b))); 
    }
};

/// \brief A function multiplying two channels. result = a * b / max_value
template <typename Channel> // Models ChannelConcept (could be a channel reference)
inline typename channel_traits<Channel>::value_type channel_multiply(Channel a, Channel b) { 
    return channel_multiplier<typename channel_traits<Channel>::value_type>()(a,b);
}
/// @} 

/**
\defgroup ChannelInvertAlgorithm channel_invert
\ingroup ChannelAlgorithm
\brief Returns the inverse of a channel. result = max_value - x + min_value

Example:
\code
// bits8 == uint8_t == unsigned char
bits8 x=255;
bits8 inv = channel_invert(x);
assert(inv == 0);
\endcode
*/

/// \brief Default implementation. Provide overloads for performance
/// \ingroup ChannelInvertAlgorithm channel_invert
template <typename Channel> // Models ChannelConcept (could be a channel reference)
inline typename channel_traits<Channel>::value_type channel_invert(Channel x) { 
    return channel_traits<Channel>::max_value()-x + channel_traits<Channel>::min_value(); 
}

//#ifdef _MSC_VER
//#pragma warning(pop)
//#endif

} }  // namespace boost::gil

#endif
