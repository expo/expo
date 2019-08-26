/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_VIRTUAL_LOCATOR_HPP
#define GIL_VIRTUAL_LOCATOR_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Locator for virtual image views
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on February 12, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

#include <boost/iterator/iterator_facade.hpp>
#include "position_iterator.hpp"

namespace boost { namespace gil {

/// \brief A 2D locator over a virtual image. Upon dereferencing, invokes a given function object passing it its coordinates. Models: PixelLocatorConcept, HasDynamicXStepTypeConcept, HasDynamicYStepTypeConcept, HasTransposedTypeConcept
/// \ingroup PixelLocatorModel PixelBasedModel
/// 
template <typename Deref, bool IsTransposed>        // A function object that given a point returns a reference. Models PixelDereferenceAdaptorConcept
class virtual_2d_locator : public pixel_2d_locator_base<virtual_2d_locator<Deref,IsTransposed>, position_iterator<Deref,IsTransposed>, position_iterator<Deref,1-IsTransposed> > {
    typedef virtual_2d_locator<Deref,IsTransposed>  this_t;
public:
    typedef pixel_2d_locator_base<virtual_2d_locator<Deref,IsTransposed>, position_iterator<Deref,IsTransposed>, position_iterator<Deref,1-IsTransposed> > parent_t;
    typedef virtual_2d_locator<typename Deref::const_t,IsTransposed>        const_t;

    typedef Deref                                  deref_fn_t;
    typedef typename parent_t::point_t             point_t;

    typedef typename parent_t::coord_t             coord_t;
    typedef typename parent_t::x_coord_t           x_coord_t;
    typedef typename parent_t::y_coord_t           y_coord_t;
    typedef typename parent_t::x_iterator          x_iterator;
    typedef typename parent_t::y_iterator          y_iterator;

    template <typename NewDeref> struct add_deref {
        typedef virtual_2d_locator<deref_compose<NewDeref,Deref>,IsTransposed > type;
        static type make(const virtual_2d_locator<Deref,IsTransposed>& loc, const NewDeref& nderef) { 
            return type(loc.pos(), loc.step(), deref_compose<NewDeref,Deref>(nderef,loc.deref_fn())); 
        }
    };

    virtual_2d_locator(const point_t& p=point_t(0,0), const point_t& step=point_t(1,1), const deref_fn_t& d=deref_fn_t()) : _p(p,step,d) {}
    template <typename D, bool TR> virtual_2d_locator(const virtual_2d_locator<D,TR>& loc, coord_t y_step)
        : _p(loc.pos(), point_t(loc.step().x,loc.step().y*y_step),     loc.deref_fn()) {}
    template <typename D, bool TR> virtual_2d_locator(const virtual_2d_locator<D,TR>& loc, coord_t x_step, coord_t y_step, bool transpose=false)
        : _p(loc.pos(), transpose ? 
                    point_t(loc.step().x*y_step,loc.step().y*x_step) : 
                    point_t(loc.step().x*x_step,loc.step().y*y_step), loc.deref_fn()) { assert(transpose==(IsTransposed!=TR));}

    template <typename D, bool TR> virtual_2d_locator(const virtual_2d_locator<D,TR>& pl) : _p(pl._p) {}
    virtual_2d_locator(const virtual_2d_locator& pl) : _p(pl._p) {}

    bool              operator==(const this_t& p) const { return _p==p._p; }

    x_iterator&       x()                               { return *gil_reinterpret_cast<x_iterator*>(this); }
    y_iterator&       y()                               { return _p; }
    x_iterator const& x()                         const { return *gil_reinterpret_cast_c<x_iterator const*>(this); }
    y_iterator const& y()                         const { return _p; }

    // Returns the y distance between two x_iterators given the difference of their x positions
    y_coord_t y_distance_to(const this_t& it2, x_coord_t xDiff) const { return (it2.pos()[1-IsTransposed] - pos()[1-IsTransposed])/step()[1-IsTransposed]; }
    bool      is_1d_traversable(x_coord_t)        const { return false; }   // is there no gap at the end of each row? I.e. can we use x_iterator to visit every pixel instead of nested loops?

    // Methods specific for virtual 2D locator
    const point_t&   pos()                        const { return _p.pos(); }
    const point_t&   step()                       const { return _p.step(); }
    const deref_fn_t& deref_fn()                  const { return _p.deref_fn(); }
private:
    template <typename D, bool TR> friend class virtual_2d_locator;
    y_iterator        _p;    // contains the current position, the step and the dereference object
};

/////////////////////////////
//  PixelBasedConcept
/////////////////////////////

template <typename D, bool TR>
struct channel_type<virtual_2d_locator<D,TR> > : public channel_type<typename virtual_2d_locator<D,TR>::parent_t> {
};

template <typename D, bool TR>
struct color_space_type<virtual_2d_locator<D,TR> > : public color_space_type<typename virtual_2d_locator<D,TR>::parent_t> {
};

template <typename D, bool TR>
struct channel_mapping_type<virtual_2d_locator<D,TR> > : public channel_mapping_type<typename virtual_2d_locator<D,TR>::parent_t> {
};

template <typename D, bool TR>
struct is_planar<virtual_2d_locator<D,TR> > : public is_planar<typename virtual_2d_locator<D,TR>::parent_t> {
};

/////////////////////////////
//  HasDynamicXStepTypeConcept
/////////////////////////////

template <typename D, bool TR>
struct dynamic_x_step_type<virtual_2d_locator<D,TR> > {
    typedef virtual_2d_locator<D,TR> type;
};

/////////////////////////////
//  HasDynamicYStepTypeConcept
/////////////////////////////

template <typename D, bool TR>
struct dynamic_y_step_type<virtual_2d_locator<D,TR> > {
    typedef virtual_2d_locator<D,TR> type;
};

/////////////////////////////
//  HasTransposedTypeConcept
/////////////////////////////

template <typename D, bool IsTransposed>
struct transposed_type<virtual_2d_locator<D,IsTransposed> > {
    typedef virtual_2d_locator<D,1-IsTransposed> type;
};

} }  // namespace boost::gil

#endif
