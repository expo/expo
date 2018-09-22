/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_UTILITIES_H
#define GIL_UTILITIES_H

#include "gil_config.hpp"
#include <functional>
#include <boost/config/no_tr1/cmath.hpp>
#include <cstddef>
#include <algorithm>
#include <utility>
#include <iterator>
#include <boost/static_assert.hpp>
#include <boost/type_traits.hpp>
#include <boost/mpl/size.hpp>
#include <boost/mpl/distance.hpp>
#include <boost/mpl/begin.hpp>
#include <boost/mpl/find.hpp>
#include <boost/mpl/range_c.hpp>
#include <boost/iterator/iterator_adaptor.hpp>
#include <boost/iterator/iterator_facade.hpp>

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief  Various utilities not specific to the image library. Some are non-standard STL extensions or generic iterator adaptors
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on September 18, 2007
///
///
////////////////////////////////////////////////////////////////////////////////////////

namespace boost { namespace gil {

/**
\addtogroup PointModel

Example:
\code
point2<std::ptrdiff_t> p(3,2);
assert((p[0] == p.x) && (p[1] == p.y));
assert(axis_value<0>(p) == 3);
assert(axis_value<1>(p) == 2);
\endcode
*/

////////////////////////////////////////////////////////////////////////////////////////
//                           CLASS point2
///
/// \brief 2D point both axes of which have the same dimension type
/// \ingroup PointModel
/// Models: Point2DConcept
///
////////////////////////////////////////////////////////////////////////////////////////

template <typename T>
class point2 {
public:
    typedef T value_type;
    template <std::size_t D> struct axis { typedef value_type coord_t; };
    static const std::size_t num_dimensions=2;

    point2()                : x(0),     y(0)    {}
    point2(T newX, T newY)  : x(newX),  y(newY) {}
    point2(const point2& p) : x(p.x), y(p.y) {}
    ~point2() {}

    point2& operator=(const point2& p)            { x=p.x; y=p.y; return *this; }

    point2        operator<<(std::ptrdiff_t shift)         const   { return point2(x<<shift,y<<shift); }
    point2        operator>>(std::ptrdiff_t shift)         const   { return point2(x>>shift,y>>shift); }
    point2& operator+=(const point2& p)           { x+=p.x; y+=p.y; return *this; }
    point2& operator-=(const point2& p)           { x-=p.x; y-=p.y; return *this; }
    point2& operator/=(double t)                  { x/=t; y/=t; return *this; }

    const T& operator[](std::size_t i)          const   { return this->*mem_array[i]; }
          T& operator[](std::size_t i)                  { return this->*mem_array[i]; }

    T x,y;
private:
    // this static array of pointers to member variables makes operator[] safe and doesn't seem to exhibit any performance penalty
    static T point2<T>::* const mem_array[num_dimensions];
};

template <typename T>
T point2<T>::* const point2<T>::mem_array[point2<T>::num_dimensions] = { &point2<T>::x, &point2<T>::y };

/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
bool operator==(const point2<T>& p1, const point2<T>& p2) { return (p1.x==p2.x && p1.y==p2.y); }
/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
bool operator!=(const point2<T>& p1, const point2<T>& p2) { return  p1.x!=p2.x || p1.y!=p2.y; }
/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
point2<T> operator+(const point2<T>& p1, const point2<T>& p2) { return point2<T>(p1.x+p2.x,p1.y+p2.y); }
/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
point2<T> operator-(const point2<T>& p) { return point2<T>(-p.x,-p.y); }
/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
point2<T> operator-(const point2<T>& p1, const point2<T>& p2) { return point2<T>(p1.x-p2.x,p1.y-p2.y); }
/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
point2<double> operator/(const point2<T>& p, double t)      { return t==0 ? point2<double>(0,0):point2<double>(p.x/t,p.y/t); }
/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
point2<T> operator*(const point2<T>& p, std::ptrdiff_t t)      { return point2<T>(p.x*t,p.y*t); }
/// \ingroup PointModel
template <typename T> GIL_FORCEINLINE
point2<T> operator*(std::ptrdiff_t t, const point2<T>& p)      { return point2<T>(p.x*t,p.y*t); }

/// \ingroup PointModel
template <std::size_t K, typename T> GIL_FORCEINLINE
const T& axis_value(const point2<T>& p) { return p[K]; }

/// \ingroup PointModel
template <std::size_t K, typename T> GIL_FORCEINLINE
      T& axis_value(      point2<T>& p) { return p[K]; }

////////////////////////////////////////////////////////////////////////////////////////
///
///  Rounding of real numbers / points to integers / integer points
///
////////////////////////////////////////////////////////////////////////////////////////

inline std::ptrdiff_t iround(float x ) { return static_cast<std::ptrdiff_t>(x + (x < 0.0f ? -0.5f : 0.5f)); }
inline std::ptrdiff_t iround(double x) { return static_cast<std::ptrdiff_t>(x + (x < 0.0 ? -0.5 : 0.5)); }
inline std::ptrdiff_t ifloor(float x ) { return static_cast<std::ptrdiff_t>(std::floor(x)); }
inline std::ptrdiff_t ifloor(double x) { return static_cast<std::ptrdiff_t>(std::floor(x)); }
inline std::ptrdiff_t iceil(float x )  { return static_cast<std::ptrdiff_t>(std::ceil(x)); }
inline std::ptrdiff_t iceil(double x)  { return static_cast<std::ptrdiff_t>(std::ceil(x)); }

/**
\addtogroup PointAlgorithm

Example:
\code
assert(iround(point2<double>(3.1, 3.9)) == point2<std::ptrdiff_t>(3,4));
\endcode
*/

/// \ingroup PointAlgorithm
inline point2<std::ptrdiff_t> iround(const point2<float >& p)  { return point2<std::ptrdiff_t>(iround(p.x),iround(p.y)); }
/// \ingroup PointAlgorithm
inline point2<std::ptrdiff_t> iround(const point2<double>& p)  { return point2<std::ptrdiff_t>(iround(p.x),iround(p.y)); }
/// \ingroup PointAlgorithm
inline point2<std::ptrdiff_t> ifloor(const point2<float >& p)  { return point2<std::ptrdiff_t>(ifloor(p.x),ifloor(p.y)); }
/// \ingroup PointAlgorithm
inline point2<std::ptrdiff_t> ifloor(const point2<double>& p)  { return point2<std::ptrdiff_t>(ifloor(p.x),ifloor(p.y)); }
/// \ingroup PointAlgorithm
inline point2<std::ptrdiff_t> iceil (const point2<float >& p)  { return point2<std::ptrdiff_t>(iceil(p.x), iceil(p.y)); }
/// \ingroup PointAlgorithm
inline point2<std::ptrdiff_t> iceil (const point2<double>& p)  { return point2<std::ptrdiff_t>(iceil(p.x), iceil(p.y)); }

////////////////////////////////////////////////////////////////////////////////////////
///
///  computing size with alignment
///
////////////////////////////////////////////////////////////////////////////////////////

template <typename T> 
inline T align(T val, std::size_t alignment) { 
    return val+(alignment - val%alignment)%alignment; 
}

/// \brief Helper base class for pixel dereference adaptors. 
/// \ingroup PixelDereferenceAdaptorModel
///
template <typename ConstT, typename Value, typename Reference, typename ConstReference,
          typename ArgType, typename ResultType, bool IsMutable>
struct deref_base : public std::unary_function<ArgType, ResultType> {
    typedef ConstT         const_t;
    typedef Value          value_type;
    typedef Reference      reference;
    typedef ConstReference const_reference;
    BOOST_STATIC_CONSTANT(bool, is_mutable = IsMutable);
};

/// \brief Composes two dereference function objects. Similar to std::unary_compose but needs to pull some typedefs from the component types.  Models: PixelDereferenceAdaptorConcept
/// \ingroup PixelDereferenceAdaptorModel
///
template <typename D1, typename D2>
class deref_compose : public deref_base<
      deref_compose<typename D1::const_t, typename D2::const_t>,
      typename D1::value_type, typename D1::reference, typename D1::const_reference, 
      typename D2::argument_type, typename D1::result_type, D1::is_mutable && D2::is_mutable>
{
public:
    D1 _fn1;
    D2 _fn2;

    typedef typename D2::argument_type   argument_type;
    typedef typename D1::result_type     result_type;

    deref_compose() {}
    deref_compose(const D1& x, const D2& y) : _fn1(x), _fn2(y) {}
    deref_compose(const deref_compose& dc)  : _fn1(dc._fn1), _fn2(dc._fn2) {}
    template <typename _D1, typename _D2> deref_compose(const deref_compose<_D1,_D2>& dc) : _fn1(dc._fn1), _fn2(dc._fn2) {}

    result_type operator()(argument_type x) const { return _fn1(_fn2(x)); }
    result_type operator()(argument_type x)       { return _fn1(_fn2(x)); }
};

// reinterpret_cast is implementation-defined. Static cast is not.
template <typename OutPtr, typename In> GIL_FORCEINLINE
      OutPtr gil_reinterpret_cast(      In* p) { return static_cast<OutPtr>(static_cast<void*>(p)); }

template <typename OutPtr, typename In> GIL_FORCEINLINE
const OutPtr gil_reinterpret_cast_c(const In* p) { return static_cast<const OutPtr>(static_cast<const void*>(p)); }

namespace detail {

////////////////////////////////////////////////////////////////////////////////////////
///
///  \brief copy_n taken from SGI STL.
///
////////////////////////////////////////////////////////////////////////////////////////

template <class InputIter, class Size, class OutputIter>
std::pair<InputIter, OutputIter> _copy_n(InputIter first, Size count,
                                         OutputIter result,
                                         std::input_iterator_tag) {
   for ( ; count > 0; --count) {
      *result = *first;
      ++first;
      ++result;
   }
   return std::pair<InputIter, OutputIter>(first, result);
}

template <class RAIter, class Size, class OutputIter>
inline std::pair<RAIter, OutputIter>
_copy_n(RAIter first, Size count, OutputIter result, std::random_access_iterator_tag) {
   RAIter last = first + count;
   return std::pair<RAIter, OutputIter>(last, std::copy(first, last, result));
}

template <class InputIter, class Size, class OutputIter>
inline std::pair<InputIter, OutputIter>
_copy_n(InputIter first, Size count, OutputIter result) {
   return _copy_n(first, count, result, typename std::iterator_traits<InputIter>::iterator_category());
}

template <class InputIter, class Size, class OutputIter>
inline std::pair<InputIter, OutputIter>
copy_n(InputIter first, Size count, OutputIter result) {
    return detail::_copy_n(first, count, result);
}

/// \brief identity taken from SGI STL.
template <typename T> 
struct identity : public std::unary_function<T,T> {
    const T& operator()(const T& val) const { return val; }
};

/*************************************************************************************************/

/// \brief plus function object whose arguments may be of different type.
template <typename T1, typename T2>
struct plus_asymmetric : public std::binary_function<T1,T2,T1> {
    T1 operator()(T1 f1, T2 f2) const {
        return f1+f2;
    }
};

/*************************************************************************************************/

/// \brief operator++ wrapped in a function object
template <typename T>
struct inc : public std::unary_function<T,T> {
    T operator()(T x) const { return ++x; }
};

/*************************************************************************************************/

/// \brief operator-- wrapped in a function object
template <typename T>
struct dec : public std::unary_function<T,T> {
    T operator()(T x) const { return --x; }
};

/// \brief Returns the index corresponding to the first occurrance of a given given type in 
//         a given MPL RandomAccessSequence (or size if the type is not present)
template <typename Types, typename T>
struct type_to_index 
    : public mpl::distance<typename mpl::begin<Types>::type, 
                                  typename mpl::find<Types,T>::type>::type {};
} // namespace detail



/// \ingroup ColorSpaceAndLayoutModel
/// \brief Represents a color space and ordering of channels in memory
template <typename ColorSpace, typename ChannelMapping = mpl::range_c<int,0,mpl::size<ColorSpace>::value> >
struct layout {
    typedef ColorSpace      color_space_t;
    typedef ChannelMapping  channel_mapping_t;
};

/// \brief A version of swap that also works with reference proxy objects
template <typename Value, typename T1, typename T2> // where value_type<T1>  == value_type<T2> == Value
void swap_proxy(T1& left, T2& right) {
    Value tmp = left;
    left = right;
    right = tmp;
}

/// \brief Run-time detection of whether the underlying architecture is little endian
inline bool little_endian() {
    short tester = 0x0001;
    return  *(char*)&tester!=0;
}
/// \brief Run-time detection of whether the underlying architecture is big endian
inline bool big_endian() {
    return !little_endian();
}

} }  // namespace boost::gil

#endif
