// Boost.TypeErasure library
//
// Copyright 2012 Steven Watanabe
//
// Distributed under the Boost Software License Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// $Id$

#ifndef BOOST_TYPE_ERASURE_DETAIL_CHECK_MAP_HPP_INCLUDED
#define BOOST_TYPE_ERASURE_DETAIL_CHECK_MAP_HPP_INCLUDED

#include <boost/mpl/not.hpp>
#include <boost/mpl/or.hpp>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/set.hpp>
#include <boost/mpl/has_key.hpp>
#include <boost/mpl/find_if.hpp>
#include <boost/mpl/fold.hpp>
#include <boost/mpl/end.hpp>
#include <boost/type_traits/is_same.hpp>
#include <boost/type_erasure/detail/get_placeholders.hpp>
#include <boost/type_erasure/detail/normalize.hpp>
#include <boost/type_erasure/deduced.hpp>
#include <boost/type_erasure/static_binding.hpp>

namespace boost {
namespace type_erasure {
namespace detail {

template<class T>
struct is_deduced : boost::mpl::false_ {};
template<class T>
struct is_deduced< ::boost::type_erasure::deduced<T> > : boost::mpl::true_ {};

// returns true if Map has a key for every non-deduced placeholder in Concept
template<class Concept, class Map>
struct check_map {
    typedef typename normalize_concept<Concept>::basic basic_components;
    
    // Every non-deduced placeholder referenced in this
    // map is indirectly deduced.
    typedef typename ::boost::type_erasure::detail::get_placeholder_normalization_map<
        Concept>::type placeholder_subs;
    typedef typename ::boost::mpl::fold<
        placeholder_subs,
        ::boost::mpl::set0<>,
        ::boost::mpl::insert<
            ::boost::mpl::_1,
            ::boost::mpl::second< ::boost::mpl::_2>
        >
    >::type indirect_deduced_placeholders;

    typedef typename ::boost::mpl::fold<
        basic_components,
        ::boost::mpl::set0<>,
        ::boost::type_erasure::detail::get_placeholders<
            ::boost::mpl::_2,
            ::boost::mpl::_1
        >
    >::type placeholders;
    typedef typename ::boost::is_same<
        typename ::boost::mpl::find_if<
            placeholders,
            ::boost::mpl::not_<
                ::boost::mpl::or_<
                    ::boost::type_erasure::detail::is_deduced< ::boost::mpl::_1>,
                    ::boost::mpl::has_key<Map, ::boost::mpl::_1>,
                    ::boost::mpl::has_key<indirect_deduced_placeholders, ::boost::mpl::_1>
                >
            >
        >::type,
        typename ::boost::mpl::end<placeholders>::type
    >::type type;
};

template<class Concept, class Map>
struct check_map<Concept, ::boost::type_erasure::static_binding<Map> > :
    check_map<Concept, Map>
{};

}
}
}

#endif
