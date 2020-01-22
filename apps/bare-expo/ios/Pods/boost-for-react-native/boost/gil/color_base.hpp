/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://stlab.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_COLOR_BASE_HPP
#define GIL_COLOR_BASE_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief pixel class and related utilities
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on May 6, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

#include <cassert>
#include <boost/mpl/range_c.hpp>
#include <boost/mpl/size.hpp>
#include <boost/mpl/vector_c.hpp>
#include <boost/type_traits.hpp>
#include <boost/utility/enable_if.hpp>

#include "gil_config.hpp"
#include "utilities.hpp"
#include "gil_concept.hpp"

namespace boost { namespace gil {

// Forward-declare
template <typename P> P* memunit_advanced(const P* p, std::ptrdiff_t diff);

// Forward-declare semantic_at_c
template <int K, typename ColorBase>
typename disable_if<is_const<ColorBase>,typename kth_semantic_element_reference_type<ColorBase,K>::type>::type semantic_at_c(ColorBase& p);
template <int K, typename ColorBase>
typename kth_semantic_element_const_reference_type<ColorBase,K>::type semantic_at_c(const ColorBase& p);

// Forward declare element_reference_type
template <typename ColorBase> struct element_reference_type;
template <typename ColorBase> struct element_const_reference_type;
template <typename ColorBase, int K> struct kth_element_type;
template <typename ColorBase, int K> struct kth_element_type<const ColorBase,K> : public kth_element_type<ColorBase,K> {};
template <typename ColorBase, int K> struct kth_element_reference_type;
template <typename ColorBase, int K> struct kth_element_reference_type<const ColorBase,K> : public kth_element_reference_type<ColorBase,K> {};
template <typename ColorBase, int K> struct kth_element_const_reference_type;
template <typename ColorBase, int K> struct kth_element_const_reference_type<const ColorBase,K> : public kth_element_const_reference_type<ColorBase,K> {};

namespace detail {

template <typename DstLayout, typename SrcLayout, int K>
struct mapping_transform 
    : public mpl::at<typename SrcLayout::channel_mapping_t, 
                     typename detail::type_to_index<typename DstLayout::channel_mapping_t,mpl::integral_c<int,K> >::type
                           >::type {};

/// \defgroup ColorBaseModelHomogeneous detail::homogeneous_color_base 
/// \ingroup ColorBaseModel
/// \brief A homogeneous color base holding one color element. Models HomogeneousColorBaseConcept or HomogeneousColorBaseValueConcept
/// If the element type models Regular, this class models HomogeneousColorBaseValueConcept.


/// \brief A homogeneous color base holding one color element. Models HomogeneousColorBaseConcept or HomogeneousColorBaseValueConcept
/// \ingroup ColorBaseModelHomogeneous
template <typename Element, typename Layout>
struct homogeneous_color_base<Element,Layout,1> {
private:
    Element _v0;
public:
    typedef Layout layout_t;
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<0>)       { return _v0; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<0>) const { return _v0; }

    homogeneous_color_base() {}
    homogeneous_color_base(Element v) : _v0(v) {}
 
    // grayscale pixel values are convertible to channel type
    operator Element () const { return _v0; }

    template <typename E2, typename L2> homogeneous_color_base(const homogeneous_color_base<E2,L2,1>& c) : _v0(at_c<0>(c)) {}
};


/// \brief A homogeneous color base holding two color elements. Models HomogeneousColorBaseConcept or HomogeneousColorBaseValueConcept
/// \ingroup ColorBaseModelHomogeneous
template <typename Element, typename Layout>
struct homogeneous_color_base<Element,Layout,2> {
private:
    Element _v0, _v1;
public:
    typedef Layout layout_t;
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<0>)       { return _v0; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<0>) const { return _v0; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<1>)       { return _v1; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<1>) const { return _v1; }

    homogeneous_color_base() {}
    explicit homogeneous_color_base(Element v) : _v0(v), _v1(v) {}
    homogeneous_color_base(Element v0, Element v1) : _v0(v0), _v1(v1) {}

    template <typename E2, typename L2> homogeneous_color_base(const homogeneous_color_base<E2,L2,2>& c) : 
        _v0(at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(at_c<mapping_transform<Layout,L2,1>::value>(c)) {}

    // Support for l-value reference proxy copy construction
    template <typename E2, typename L2> homogeneous_color_base(      homogeneous_color_base<E2,L2,2>& c) : 
        _v0(at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(at_c<mapping_transform<Layout,L2,1>::value>(c)) {}

    // Support for planar_pixel_iterator construction and dereferencing
    template <typename P> homogeneous_color_base(P* p,bool) : 
        _v0(&semantic_at_c<0>(*p)), 
        _v1(&semantic_at_c<1>(*p)) {}
    template <typename Ref> Ref deref() const { 
        return Ref(*semantic_at_c<0>(*this), 
                   *semantic_at_c<1>(*this)); }

    // Support for planar_pixel_reference offset constructor
    template <typename Ptr> homogeneous_color_base(const Ptr& ptr, std::ptrdiff_t diff) 
        : _v0(*memunit_advanced(semantic_at_c<0>(ptr),diff)),
          _v1(*memunit_advanced(semantic_at_c<1>(ptr),diff)) {}

    // Support for planar_pixel_reference operator[]
    Element at_c_dynamic(std::size_t i) const {
        if (i==0) return _v0;
        return _v1;
    }
};

/// \brief A homogeneous color base holding three color elements. Models HomogeneousColorBaseConcept or HomogeneousColorBaseValueConcept
/// \ingroup ColorBaseModelHomogeneous
template <typename Element, typename Layout>
struct homogeneous_color_base<Element,Layout,3> {
private:
    Element _v0, _v1, _v2;
public:
    typedef Layout layout_t;
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<0>)       { return _v0; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<0>) const { return _v0; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<1>)       { return _v1; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<1>) const { return _v1; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<2>)       { return _v2; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<2>) const { return _v2; }

    homogeneous_color_base() {}
    explicit homogeneous_color_base(Element v) : _v0(v), _v1(v), _v2(v) {}
    homogeneous_color_base(Element v0, Element v1, Element v2) : _v0(v0), _v1(v1), _v2(v2) {}

    template <typename E2, typename L2> homogeneous_color_base(const homogeneous_color_base<E2,L2,3>& c) : 
        _v0(gil::at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(gil::at_c<mapping_transform<Layout,L2,1>::value>(c)), 
        _v2(gil::at_c<mapping_transform<Layout,L2,2>::value>(c)) {}

    // Support for l-value reference proxy copy construction
    template <typename E2, typename L2> homogeneous_color_base(      homogeneous_color_base<E2,L2,3>& c) : 
        _v0(gil::at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(gil::at_c<mapping_transform<Layout,L2,1>::value>(c)), 
        _v2(gil::at_c<mapping_transform<Layout,L2,2>::value>(c)) {}

    // Support for planar_pixel_iterator construction and dereferencing
    template <typename P> homogeneous_color_base(P* p,bool) : 
        _v0(&semantic_at_c<0>(*p)), 
        _v1(&semantic_at_c<1>(*p)), 
        _v2(&semantic_at_c<2>(*p)) {}
    template <typename Ref> Ref deref() const { 
        return Ref(*semantic_at_c<0>(*this), 
                   *semantic_at_c<1>(*this), 
                   *semantic_at_c<2>(*this)); }

    // Support for planar_pixel_reference offset constructor
    template <typename Ptr> homogeneous_color_base(const Ptr& ptr, std::ptrdiff_t diff) 
        : _v0(*memunit_advanced(semantic_at_c<0>(ptr),diff)),
          _v1(*memunit_advanced(semantic_at_c<1>(ptr),diff)),
          _v2(*memunit_advanced(semantic_at_c<2>(ptr),diff)) {}

    // Support for planar_pixel_reference operator[]
    Element at_c_dynamic(std::size_t i) const {
        switch (i) {
            case 0: return _v0;
            case 1: return _v1;
        }
        return _v2;
    }
};

/// \brief A homogeneous color base holding four color elements. Models HomogeneousColorBaseConcept or HomogeneousColorBaseValueConcept
/// \ingroup ColorBaseModelHomogeneous
template <typename Element, typename Layout>
struct homogeneous_color_base<Element,Layout,4> {
private:
    Element _v0, _v1, _v2, _v3;
public:
    typedef Layout layout_t;
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<0>)       { return _v0; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<0>) const { return _v0; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<1>)       { return _v1; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<1>) const { return _v1; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<2>)       { return _v2; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<2>) const { return _v2; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<3>)       { return _v3; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<3>) const { return _v3; }
    homogeneous_color_base() {}
    explicit homogeneous_color_base(Element v) : _v0(v), _v1(v), _v2(v), _v3(v) {}
    homogeneous_color_base(Element v0, Element v1, Element v2, Element v3) : _v0(v0), _v1(v1), _v2(v2), _v3(v3) {}

    template <typename E2, typename L2> homogeneous_color_base(const homogeneous_color_base<E2,L2,4>& c) :
        _v0(at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(at_c<mapping_transform<Layout,L2,1>::value>(c)), 
        _v2(at_c<mapping_transform<Layout,L2,2>::value>(c)),
        _v3(at_c<mapping_transform<Layout,L2,3>::value>(c)) {}

    // Support for l-value reference proxy copy construction
    template <typename E2, typename L2> homogeneous_color_base(      homogeneous_color_base<E2,L2,4>& c) : 
        _v0(at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(at_c<mapping_transform<Layout,L2,1>::value>(c)), 
        _v2(at_c<mapping_transform<Layout,L2,2>::value>(c)),
        _v3(at_c<mapping_transform<Layout,L2,3>::value>(c)) {}

    // Support for planar_pixel_iterator construction and dereferencing
    template <typename P> homogeneous_color_base(P* p,bool) : 
        _v0(&semantic_at_c<0>(*p)), 
        _v1(&semantic_at_c<1>(*p)), 
        _v2(&semantic_at_c<2>(*p)), 
        _v3(&semantic_at_c<3>(*p)) {}

    template <typename Ref> Ref deref() const { 
        return Ref(*semantic_at_c<0>(*this), 
                   *semantic_at_c<1>(*this), 
                   *semantic_at_c<2>(*this), 
                   *semantic_at_c<3>(*this)); }

    // Support for planar_pixel_reference offset constructor
    template <typename Ptr> homogeneous_color_base(const Ptr& ptr, std::ptrdiff_t diff) 
        : _v0(*memunit_advanced(semantic_at_c<0>(ptr),diff)),
          _v1(*memunit_advanced(semantic_at_c<1>(ptr),diff)),
          _v2(*memunit_advanced(semantic_at_c<2>(ptr),diff)),
          _v3(*memunit_advanced(semantic_at_c<3>(ptr),diff)) {}

    // Support for planar_pixel_reference operator[]
    Element at_c_dynamic(std::size_t i) const {
        switch (i) {
            case 0: return _v0;
            case 1: return _v1;
            case 2: return _v2;
        }
        return _v3;
    }
};

/// \brief A homogeneous color base holding five color elements. Models HomogeneousColorBaseConcept or HomogeneousColorBaseValueConcept
/// \ingroup ColorBaseModelHomogeneous
template <typename Element, typename Layout>
struct homogeneous_color_base<Element,Layout,5> {
private:
    Element _v0, _v1, _v2, _v3, _v4;
public:
    typedef Layout layout_t;
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<0>)       { return _v0; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<0>) const { return _v0; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<1>)       { return _v1; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<1>) const { return _v1; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<2>)       { return _v2; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<2>) const { return _v2; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<3>)       { return _v3; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<3>) const { return _v3; }
    typename element_reference_type<homogeneous_color_base>::type       at(mpl::int_<4>)       { return _v4; }
    typename element_const_reference_type<homogeneous_color_base>::type at(mpl::int_<4>) const { return _v4; }
    homogeneous_color_base() {}
    explicit homogeneous_color_base(Element v) : _v0(v), _v1(v), _v2(v), _v3(v), _v4(v) {}
    homogeneous_color_base(Element v0, Element v1, Element v2, Element v3, Element v4) : _v0(v0), _v1(v1), _v2(v2), _v3(v3), _v4(v4) {}

    template <typename E2, typename L2> homogeneous_color_base(const homogeneous_color_base<E2,L2,5>& c) :
        _v0(at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(at_c<mapping_transform<Layout,L2,1>::value>(c)), 
        _v2(at_c<mapping_transform<Layout,L2,2>::value>(c)),
        _v3(at_c<mapping_transform<Layout,L2,3>::value>(c)),
        _v4(at_c<mapping_transform<Layout,L2,4>::value>(c)) {}

    // Support for l-value reference proxy copy construction
    template <typename E2, typename L2> homogeneous_color_base(      homogeneous_color_base<E2,L2,5>& c) : 
        _v0(at_c<mapping_transform<Layout,L2,0>::value>(c)), 
        _v1(at_c<mapping_transform<Layout,L2,1>::value>(c)), 
        _v2(at_c<mapping_transform<Layout,L2,2>::value>(c)),
        _v3(at_c<mapping_transform<Layout,L2,3>::value>(c)),
        _v4(at_c<mapping_transform<Layout,L2,4>::value>(c)) {}

    // Support for planar_pixel_iterator construction and dereferencing
    template <typename P> homogeneous_color_base(P* p,bool) : 
        _v0(&semantic_at_c<0>(*p)), 
        _v1(&semantic_at_c<1>(*p)), 
        _v2(&semantic_at_c<2>(*p)), 
        _v3(&semantic_at_c<3>(*p)),
        _v4(&semantic_at_c<4>(*p)) {}

    template <typename Ref> Ref deref() const { 
        return Ref(*semantic_at_c<0>(*this), 
                   *semantic_at_c<1>(*this), 
                   *semantic_at_c<2>(*this), 
                   *semantic_at_c<3>(*this),
                   *semantic_at_c<4>(*this)); }

    // Support for planar_pixel_reference offset constructor
    template <typename Ptr> homogeneous_color_base(const Ptr& ptr, std::ptrdiff_t diff) 
        : _v0(*memunit_advanced(semantic_at_c<0>(ptr),diff)),
          _v1(*memunit_advanced(semantic_at_c<1>(ptr),diff)),
          _v2(*memunit_advanced(semantic_at_c<2>(ptr),diff)),
          _v3(*memunit_advanced(semantic_at_c<3>(ptr),diff)),
          _v4(*memunit_advanced(semantic_at_c<4>(ptr),diff)) {}

    // Support for planar_pixel_reference operator[]
    Element at_c_dynamic(std::size_t i) const {
        switch (i) {
            case 0: return _v0;
            case 1: return _v1;
            case 2: return _v2;
            case 3: return _v3;
        }
        return _v4;
    }
};

// The following way of casting adjacent channels (the contents of color_base) into an array appears to be unsafe
// -- there is no guarantee that the compiler won't add any padding between adjacent channels.
// Note, however, that GIL _must_ be compiled with compiler settings ensuring there is no padding in the color base structs.
// This is because the color base structs must model the interleaved organization in memory. In other words, the client may
// have existing RGB image in the form "RGBRGBRGB..." and we must be able to represent it with an array of RGB color bases (i.e. RGB pixels)
// with no padding. We have tested with char/int/float/double channels on gcc and VC and have so far discovered no problem.
// We have even tried using strange channels consisting of short + char (3 bytes). With the default 4-byte alignment on VC, the size
// of this channel is padded to 4 bytes, so an RGB pixel of it will be 4x3=12 bytes. The code below will still work properly.
// However, the client must nevertheless ensure that proper compiler settings are used for their compiler and their channel types.

template <typename Element, typename Layout, int K>
typename element_reference_type<homogeneous_color_base<Element,Layout,K> >::type       
dynamic_at_c(homogeneous_color_base<Element,Layout,K>& cb, std::size_t i) {
    assert(i<K);
    return (gil_reinterpret_cast<Element*>(&cb))[i];
}

template <typename Element, typename Layout, int K>
typename element_const_reference_type<homogeneous_color_base<Element,Layout,K> >::type 
dynamic_at_c(const homogeneous_color_base<Element,Layout,K>& cb, std::size_t i) {
    assert(i<K);
    return (gil_reinterpret_cast_c<const Element*>(&cb))[i];
}

template <typename Element, typename Layout, int K>
typename element_reference_type<homogeneous_color_base<Element&,Layout,K> >::type       
dynamic_at_c(const homogeneous_color_base<Element&,Layout,K>& cb, std::size_t i) {
    assert(i<K);
    return cb.at_c_dynamic(i);
}

template <typename Element, typename Layout, int K>
typename element_const_reference_type<homogeneous_color_base<const Element&,Layout,K> >::type 
dynamic_at_c(const homogeneous_color_base<const Element&,Layout,K>& cb, std::size_t i) {
    assert(i<K);
    return cb.at_c_dynamic(i);
}


} // namespace detail

template <typename Element, typename Layout, int K1, int K>  
struct kth_element_type<detail::homogeneous_color_base<Element,Layout,K1>, K> {
    typedef Element type;
};

template <typename Element, typename Layout, int K1, int K> 
struct kth_element_reference_type<detail::homogeneous_color_base<Element,Layout,K1>, K> : public add_reference<Element> {};

template <typename Element, typename Layout, int K1, int K> 
struct kth_element_const_reference_type<detail::homogeneous_color_base<Element,Layout,K1>, K> : public add_reference<typename add_const<Element>::type> {};

/// \brief Provides mutable access to the K-th element, in physical order
/// \ingroup ColorBaseModelHomogeneous
template <int K, typename E, typename L, int N> inline
typename add_reference<E>::type
at_c(      detail::homogeneous_color_base<E,L,N>& p) { return p.at(mpl::int_<K>()); }

/// \brief Provides constant access to the K-th element, in physical order
/// \ingroup ColorBaseModelHomogeneous
template <int K, typename E, typename L, int N> inline
typename add_reference<typename add_const<E>::type>::type
at_c(const detail::homogeneous_color_base<E,L,N>& p) { return p.at(mpl::int_<K>()); }

namespace detail {
    struct swap_fn {
        template <typename T> void operator()(T& x, T& y) const {
            using std::swap;
            swap(x,y);
        }
    };
}
template <typename E, typename L, int N> inline
void swap(detail::homogeneous_color_base<E,L,N>& x, detail::homogeneous_color_base<E,L,N>& y) { 
    static_for_each(x,y,detail::swap_fn());
}


} }  // namespace boost::gil

#endif
