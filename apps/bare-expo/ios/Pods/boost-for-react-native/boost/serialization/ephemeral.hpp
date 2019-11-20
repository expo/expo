#ifndef BOOST_SERIALIZATION_EPHEMERAL_HPP
#define BOOST_SERIALIZATION_EPHEMERAL_HPP

// MS compatible compilers support 
#pragma once
#if defined(_MSC_VER)
# pragma once
#endif

/////////1/////////2/////////3/////////4/////////5/////////6/////////7/////////8
// ephemeral_object.hpp: interface for serialization system.

// (C) Copyright 2007 Matthias Troyer. 
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org for updates, documentation, and revision history.

#include <utility>

#include <boost/config.hpp>
#include <boost/detail/workaround.hpp>

#include <boost/mpl/integral_c.hpp>
#include <boost/mpl/integral_c_tag.hpp>

#include <boost/serialization/level.hpp>
#include <boost/serialization/tracking.hpp>
#include <boost/serialization/split_member.hpp>
#include <boost/serialization/base_object.hpp>
#include <boost/serialization/traits.hpp>
#include <boost/serialization/wrapper.hpp>

namespace boost {
namespace serialization {

template<class T>
struct ephemeral_object : 
    public wrapper_traits<ephemeral_object<T> >
{
    explicit ephemeral_object(T& t) :
        val(t)
    {}

    T & value() const {
        return val;
    }

    const T & const_value() const {
        return val;
    }

    template<class Archive>
    void serialize(Archive &ar, const unsigned int) const
    {
       ar & val;
    }

private:
    T & val;
};

template<class T>
inline
const ephemeral_object<T> ephemeral(const char * name, T & t){
    return ephemeral_object<T>(name, t);
}

} // seralization
} // boost

#endif // BOOST_SERIALIZATION_EPHEMERAL_HPP
