// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_PARAMETER_EXT_PRIVATE_HPP
#define BOOST_PARAMETER_EXT_PRIVATE_HPP

#include <boost/parameter/keyword.hpp>

// A Boost.Parameter extension by Andrey Semashev.
// This should really go to Boost.Parameter in the end.

namespace boost { namespace parameter {

// The metafunction, given the type of the arguments pack and the keyword tag,
// returns the corresponding parameter type
template< typename ArgsT, typename KeywordTagT >
struct parameter_type
{
    typedef void type;
};

template< typename ArgT, typename KeywordTagT >
struct parameter_type<aux::tagged_argument<KeywordTagT, ArgT>, KeywordTagT>
{
    typedef typename aux::tagged_argument< KeywordTagT, ArgT >::value_type type;
};

template< typename KeywordTagT1, typename ArgT, typename KeywordTagT2 >
struct parameter_type< aux::tagged_argument< KeywordTagT1, ArgT >, KeywordTagT2 >
{
    typedef void type;
};

template< typename ArgT, typename TailT, typename KeywordTagT >
struct parameter_type<
    aux::arg_list<
        aux::tagged_argument< KeywordTagT, ArgT >,
        TailT
    >,
    KeywordTagT
>
{
    typedef typename aux::tagged_argument< KeywordTagT, ArgT >::value_type type;
};

template< typename KeywordTagT1, typename ArgT, typename TailT, typename KeywordTagT2 >
struct parameter_type<
    aux::arg_list<
        aux::tagged_argument< KeywordTagT1, ArgT >,
        TailT
    >,
    KeywordTagT2
> :
    public parameter_type< TailT, KeywordTagT2 >
{
};

}} // boost::parameter

#endif // BOOST_PARAMETER_EXT_PRIVATE_HPP

