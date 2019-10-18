/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_POSITION_ITERATOR_HPP
#define GIL_POSITION_ITERATOR_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Locator for virtual image views
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on February 12, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

#include <boost/iterator/iterator_facade.hpp>
#include "locator.hpp"

namespace boost { namespace gil {

/// \defgroup PixelIteratorModelVirtual position_iterator
/// \ingroup PixelIteratorModel
/// \brief An iterator that remembers its current X,Y position and invokes a function object with it upon dereferencing. Models PixelIteratorConcept, PixelBasedConcept, HasDynamicXStepTypeConcept. Used to create virtual image views. 


/// \brief An iterator that remembers its current X,Y position and invokes a function object with it upon dereferencing. Models PixelIteratorConcept. Used to create virtual image views.
///    Models: StepIteratorConcept, PixelIteratorConcept, PixelBasedConcept, HasDynamicXStepTypeConcept
/// \ingroup PixelIteratorModelVirtual PixelBasedModel
template <typename Deref, // A function object that given a point returns a pixel reference. Models PixelDereferenceAdaptorConcept
          int Dim>        // the dimension to advance along
struct position_iterator : public iterator_facade<position_iterator<Deref,Dim>,
                                                  typename Deref::value_type,
                                                  std::random_access_iterator_tag,
                                                  typename Deref::reference,
                                                  typename Deref::argument_type::template axis<Dim>::coord_t> {
    typedef iterator_facade<position_iterator<Deref,Dim>,
                            typename Deref::value_type,
                            std::random_access_iterator_tag,
                            typename Deref::reference,
                            typename Deref::argument_type::template axis<Dim>::coord_t> parent_t;
    typedef typename parent_t::difference_type difference_type;
    typedef typename parent_t::reference       reference;
    typedef typename Deref::argument_type      point_t;

    position_iterator() {}
    position_iterator(const point_t& p, const point_t& step, const Deref& d) : _p(p), _step(step), _d(d) {}

    position_iterator(const position_iterator& p) : _p(p._p), _step(p._step), _d(p._d) {}
    template <typename D> position_iterator(const position_iterator<D,Dim>& p) : _p(p._p), _step(p._step), _d(p._d) {}
    position_iterator& operator=(const position_iterator& p) { _p=p._p; _d=p._d; _step=p._step; return *this; }

    const point_t&   pos()      const { return _p; }
    const point_t&   step()     const { return _step; }
    const Deref&     deref_fn() const { return _d; }

    void set_step(difference_type s) { _step[Dim]=s; }
    /// For some reason operator[] provided by iterator_adaptor returns a custom class that is convertible to reference
    /// We require our own reference because it is registered in iterator_traits
    reference operator[](difference_type d) const { point_t p=_p; p[Dim]+=d*_step[Dim]; return _d(p); }

private:
    point_t _p, _step;
    Deref   _d;

    template <typename DE, int DI> friend struct position_iterator;
    friend class boost::iterator_core_access;
    reference dereference()     const { return _d(_p); }
    void increment()                  { _p[Dim]+=_step[Dim]; }
    void decrement()                  { _p[Dim]-=_step[Dim]; }
    void advance(difference_type d)   { _p[Dim]+=d*_step[Dim]; }

    difference_type distance_to(const position_iterator& it) const { return (it._p[Dim]-_p[Dim])/_step[Dim]; }
    bool equal(const position_iterator& it) const { return _p==it._p; }
};

template <typename Deref,int Dim> 
struct const_iterator_type<position_iterator<Deref,Dim> > {
    typedef position_iterator<typename Deref::const_t,Dim> type;
};

template <typename Deref,int Dim> 
struct iterator_is_mutable<position_iterator<Deref,Dim> > : public mpl::bool_<Deref::is_mutable> {
};

/////////////////////////////
//  PixelBasedConcept
/////////////////////////////

template <typename Deref,int Dim> 
struct color_space_type<position_iterator<Deref,Dim> > : public color_space_type<typename Deref::value_type> {};

template <typename Deref,int Dim> 
struct channel_mapping_type<position_iterator<Deref,Dim> > : public channel_mapping_type<typename Deref::value_type> {};

template <typename Deref,int Dim> 
struct is_planar<position_iterator<Deref,Dim> > : public mpl::false_ {};

template <typename Deref,int Dim> 
struct channel_type<position_iterator<Deref,Dim> > : public channel_type<typename Deref::value_type> {};

/////////////////////////////
//  HasDynamicXStepTypeConcept
/////////////////////////////

template <typename Deref,int Dim> 
struct dynamic_x_step_type<position_iterator<Deref,Dim> > {
    typedef position_iterator<Deref,Dim> type;
};

} }  // namespace boost::gil

#endif
