#ifndef BOOST_ARCHIVE_ITERATORS_HEAD_ITERATOR_HPP
#define BOOST_ARCHIVE_ITERATORS_HEAD_ITERATOR_HPP

// MS compatible compilers support #pragma once
#if defined(_MSC_VER)
# pragma once
#endif

/////////1/////////2/////////3/////////4/////////5/////////6/////////7/////////8
// head_iterator.hpp

// (C) Copyright 2002 Robert Ramey - http://www.rrsd.com . 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org for updates, documentation, and revision history.

#include <boost/iterator/iterator_adaptor.hpp>
#include <boost/iterator/iterator_traits.hpp>

namespace boost {
namespace archive {
namespace iterators {

template<class Predicate, class Base>
class head_iterator
    : public boost::iterator_adaptor<
        head_iterator<Predicate, Base>,
        Base,
        use_default,
        single_pass_traversal_tag
    >
{
private:
    friend class iterator_core_access;
    typedef boost::iterator_adaptor<
        head_iterator<Predicate, Base>,
        Base,
        use_default,
        single_pass_traversal_tag
    > super_t;

    typedef head_iterator<Predicate, Base> this_t;
    typedef super_t::value_type value_type;
    typedef super_t::reference reference_type;

    reference_type dereference_impl(){
        if(! m_end){
            while(! m_predicate(* this->base_reference()))
                ++ this->base_reference();
            m_end = true;
        }
        return * this->base_reference();
    }

    reference_type dereference() const {
        return const_cast<this_t *>(this)->dereference_impl();
    }

    void increment(){
        ++base_reference();
    }
    Predicate m_predicate;
    bool m_end;
public:
    template<class T>
    head_iterator(Predicate f, T start) : 
        super_t(Base(start)), 
        m_predicate(f),
        m_end(false)
    {}

};

} // namespace iterators
} // namespace archive
} // namespace boost

#endif // BOOST_ARCHIVE_ITERATORS_HEAD_ITERATOR_HPP
