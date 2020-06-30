/////////1/////////2/////////3/////////4/////////5/////////6/////////7/////////8

// (C) Copyright 2002-4 Pavel Vozenilek . 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// Provides non-intrusive serialization for boost::optional.

#ifndef BOOST_SERIALIZATION_OPTIONAL_HPP_
#define BOOST_SERIALIZATION_OPTIONAL_HPP_

#if defined(_MSC_VER)
# pragma once
#endif

#include <boost/config.hpp>

#include <boost/archive/detail/basic_iarchive.hpp>

#include <boost/optional.hpp>
#include <boost/serialization/item_version_type.hpp>
#include <boost/serialization/split_free.hpp>
#include <boost/serialization/level.hpp>
#include <boost/serialization/nvp.hpp>
#include <boost/serialization/version.hpp>
#include <boost/serialization/detail/stack_constructor.hpp>

// function specializations must be defined in the appropriate
// namespace - boost::serialization
namespace boost { 
namespace serialization {

template<class Archive, class T>
void save(
    Archive & ar, 
    const boost::optional< T > & t, 
    const unsigned int /*version*/
){
    const bool tflag = t.is_initialized();
    ar << boost::serialization::make_nvp("initialized", tflag);
    if (tflag){
        const boost::serialization::item_version_type item_version(version< T >::value);
        #if 0
        const boost::archive::library_version_type library_version(
            ar.get_library_version()
        };
        if(boost::archive::library_version_type(3) < library_version){
            ar << BOOST_SERIALIZATION_NVP(item_version);
        }
        #else
            ar << BOOST_SERIALIZATION_NVP(item_version);
        #endif
        ar << boost::serialization::make_nvp("value", *t);
    }
}

template<class Archive, class T>
void load(
    Archive & ar, 
    boost::optional< T > & t, 
    const unsigned int /*version*/
){
    bool tflag;
    ar >> boost::serialization::make_nvp("initialized", tflag);
    if (tflag){
        boost::serialization::item_version_type item_version(0);
        boost::archive::library_version_type library_version(
            ar.get_library_version()
        );
        if(boost::archive::library_version_type(3) < library_version){
            // item_version is handled as an attribute so it doesnt need an NVP
           ar >> BOOST_SERIALIZATION_NVP(item_version);
        }
        detail::stack_construct<Archive, T> aux(ar, item_version);
        ar >> boost::serialization::make_nvp("value", aux.reference());
        t.reset(aux.reference());
    }
    else {
        t.reset();
    }
}

template<class Archive, class T>
void serialize(
    Archive & ar, 
    boost::optional< T > & t, 
    const unsigned int version
){
    boost::serialization::split_free(ar, t, version);
}

} // serialization
} // namespace boost

#endif // BOOST_SERIALIZATION_OPTIONAL_HPP_
