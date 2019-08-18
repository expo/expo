//Copyright (c) 2006-2013 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_9011016A11A711E3B46CD9FA6088709B
#define UUID_9011016A11A711E3B46CD9FA6088709B
#if (__GNUC__*100+__GNUC_MINOR__>301) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma GCC system_header
#endif
#if defined(_MSC_VER) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma warning(push,1)
#endif

#include <boost/exception/info.hpp>
#include <boost/exception/get_error_info.hpp>

namespace
boost
    {
    //Here we're using the boost::error_info machinery to store the info in the exception
    //object. Within the context of N3757, this is strictly an implementation detail.

    template <class Tag>
    inline
    void
    exception::
    set( typename Tag::type const & v )
        {
        exception_detail::set_info(*this,error_info<Tag,typename Tag::type>(v));
        }

    template <class Tag>
    inline
    typename Tag::type const *
    exception::
    get() const
        {
        return get_error_info<error_info<Tag,typename Tag::type> >(*this);
        }
    }

#if defined(_MSC_VER) && !defined(BOOST_EXCEPTION_ENABLE_WARNINGS)
#pragma warning(pop)
#endif
#endif
