/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_DYNAMICIMAGE_VARIANT_HPP
#define GIL_DYNAMICIMAGE_VARIANT_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Support for run-time instantiated types
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on September 18, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

#include "../../gil_config.hpp"
#include "../../utilities.hpp"
#include <cstddef>
#include <cassert>
#include <algorithm>
#include <typeinfo>
#include <boost/bind.hpp>

#include <boost/mpl/transform.hpp>
#include <boost/mpl/size.hpp>
#include <boost/mpl/sizeof.hpp>
#include <boost/mpl/max.hpp>
#include <boost/mpl/at.hpp>
#include <boost/mpl/fold.hpp>

namespace boost { namespace gil {

namespace detail { 
    template <typename Types, typename T> struct type_to_index;
    template <typename Op, typename T> struct reduce;
    struct destructor_op {
        typedef void result_type;
        template <typename T> result_type operator()(const T& t) const { t.~T(); }
    };
    template <typename T, typename Bits> void copy_construct_in_place(const T& t, Bits& bits);
    template <typename Bits> struct copy_construct_in_place_fn;
}
/**
\brief Represents a concrete instance of a run-time specified type from a set of types
\class variant
\ingroup Variant

A concept is typically modeled by a collection of different types. They may be instantiations
of a templated type with different template parameters or even completely unrelated types.

We call the type with which the concept is instantiated in a given place in the code "the concrete type".
The concrete type must be chosen at compile time, which sometimes is a severe limitation.
Consider, for example, having an image concept modeled by an image class templated over the color space.
It would be difficult to write a function that reads an image from file preserving its native color space, since the
type of the return value is only available at run time. It would be difficult to store images of different color
spaces in the same container or apply operations on them uniformly.

The variant class addresses this deficiency. It allows for run-time instantiation of a class from a given set of allowed classes 
specified at compile time. For example, the set of allowed classes may include 8-bit and 16-bit RGB and CMYK images. Such a variant 
can be constructed with rgb8_image_t and then assigned a cmyk16_image_t.

The variant has a templated constructor, which allows us to construct it with any concrete type instantiation. It can also perform a generic 
operation on the concrete type via a call to apply_operation. The operation must be provided as a function object whose application
operator has a single parameter which can be instantiated with any of the allowed types of the variant.

variant breaks down the instantiated type into a non-templated underlying base type and a unique instantiation 
type identifier. In the most common implementation the concrete instantiation in stored 'in-place' - in 'bits_t'.
bits_t contains sufficient space to fit the largest of the instantiated objects.

GIL's variant is similar to boost::variant in spirit (hence we borrow the name from there) but it differs in several ways from the current boost
implementation. Most notably, it does not take a variable number of template parameters but a single parameter defining the type enumeration. As
such it can be used more effectively in generic code. 

The Types parameter specifies the set of allowable types. It models MPL Random Access Container
*/

template <typename Types>    // models MPL Random Access Container
class variant {
    // size in bytes of the largest type in Types
    static const std::size_t MAX_SIZE  = mpl::fold<Types, mpl::size_t<0>, mpl::max<mpl::_1, mpl::sizeof_<mpl::_2> > >::type::value;
    static const std::size_t NUM_TYPES = mpl::size<Types>::value;
public:
    typedef Types                            types_t;

    typedef struct { char data[MAX_SIZE]; } base_t;    // empty space equal to the size of the largest type in Types

    // Default constructor - default construct the first type
    variant() : _index(0)    { new(&_bits) typename mpl::at_c<Types,0>::type(); }
    virtual ~variant()        { apply_operation(*this, detail::destructor_op()); }

    // Throws std::bad_cast if T is not in Types
    template <typename T> explicit variant(const T& obj){ _index=type_id<T>(); if (_index==NUM_TYPES) throw std::bad_cast(); detail::copy_construct_in_place(obj, _bits); }

    // When doSwap is true, swaps obj with the contents of the variant. obj will contain default-constructed instance after the call
    template <typename T> explicit variant(T& obj, bool do_swap);

    template <typename T> variant& operator=(const T& obj) { variant tmp(obj); swap(*this,tmp); return *this; }
    variant& operator=(const variant& v)                   { variant tmp(v  ); swap(*this,tmp); return *this; }

    variant(const variant& v) : _index(v._index)           { apply_operation(v, detail::copy_construct_in_place_fn<base_t>(_bits)); }
    template <typename T> void move_in(T& obj)             { variant tmp(obj, true); swap(*this,tmp); }

    template <typename TS> friend bool operator==(const variant<TS>& x, const variant<TS>& y);
    template <typename TS> friend bool operator!=(const variant<TS>& x, const variant<TS>& y);

    template <typename T> static bool has_type()           { return type_id<T>()!=NUM_TYPES; }

    template <typename T> const T& _dynamic_cast()   const { if (!current_type_is<T>()) throw std::bad_cast(); return *gil_reinterpret_cast_c<const T*>(&_bits); }
    template <typename T>       T& _dynamic_cast()         { if (!current_type_is<T>()) throw std::bad_cast(); return *gil_reinterpret_cast  <      T*>(&_bits); }

    template <typename T> bool current_type_is()     const { return type_id<T>()==_index; }

    base_t      bits()  const { return _bits;  }
    std::size_t index() const { return _index; }

private:
    template <typename T> static std::size_t type_id()     { return detail::type_to_index<Types,T>::value; }

    template <typename Cs> friend void swap(variant<Cs>& x, variant<Cs>& y);
    template <typename Types2, typename UnaryOp> friend typename UnaryOp::result_type apply_operation(variant<Types2>& var, UnaryOp op);
    template <typename Types2, typename UnaryOp> friend typename UnaryOp::result_type apply_operation(const variant<Types2>& var, UnaryOp op);
    template <typename Types1, typename Types2, typename BinaryOp> friend typename BinaryOp::result_type apply_operation(const variant<Types1>& arg1, const variant<Types2>& arg2, BinaryOp op);

    base_t      _bits;
    std::size_t    _index;
};

namespace detail {

    template <typename T, typename Bits>
    void copy_construct_in_place(const T& t, Bits& bits) {
        T& b=*gil_reinterpret_cast<T*>(&bits);
        new(&b)T(t);     // default-construct
    }

    template <typename Bits>
    struct copy_construct_in_place_fn {
        typedef void result_type;
        Bits& _dst;
        copy_construct_in_place_fn(Bits& dst) : _dst(dst) {}

        template <typename T> void operator()(const T& src) const { copy_construct_in_place(src,_dst); }
    };

    template <typename Bits>
    struct equal_to_fn {
        const Bits& _dst;
        equal_to_fn(const Bits& dst) : _dst(dst) {}
        
        typedef bool result_type;
        template <typename T> result_type operator()(const T& x) const {
            return x==*gil_reinterpret_cast_c<const T*>(&_dst);
        }
    };
}

// When doSwap is true, swaps obj with the contents of the variant. obj will contain default-constructed instance after the call
template <typename Types> 
template <typename T> variant<Types>::variant(T& obj, bool do_swap) {
    _index=type_id<T>(); 
    if (_index==NUM_TYPES) throw std::bad_cast(); 

    if (do_swap) {
        new(&_bits) T();    // default construct
        swap(obj, *gil_reinterpret_cast<T*>(&_bits));
    } else 
        detail::copy_construct_in_place(const_cast<const T&>(obj), _bits);
}

template <typename Types> 
void swap(variant<Types>& x, variant<Types>& y) {
    std::swap(x._bits,y._bits); 
    std::swap(x._index, y._index);
}

template <typename Types>
inline bool operator==(const variant<Types>& x, const variant<Types>& y) {
    return x._index==y._index && apply_operation(x,detail::equal_to_fn<typename variant<Types>::base_t>(y._bits));
}

template <typename C>
inline bool operator!=(const variant<C>& x, const variant<C>& y) {
    return !(x==y);
}

} }  // namespace boost::gil

#endif
