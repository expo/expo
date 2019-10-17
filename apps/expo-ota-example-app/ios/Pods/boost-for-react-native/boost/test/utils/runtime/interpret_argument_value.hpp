//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at 
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : default algorithms for string to specific type convertions
// ***************************************************************************

#ifndef BOOST_RT_INTERPRET_ARGUMENT_VALUE_HPP_062604GER
#define BOOST_RT_INTERPRET_ARGUMENT_VALUE_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>
#include <boost/test/utils/runtime/trace.hpp>

// Boost.Test
#include <boost/test/utils/basic_cstring/io.hpp>
#include <boost/test/utils/basic_cstring/compare.hpp>

// Boost
#include <boost/optional.hpp>
#include <boost/lexical_cast.hpp>

// STL
// !! could we eliminate these includes?
#include <list>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

// ************************************************************************** //
// **************       runtime::interpret_argument_value      ************** //
// ************************************************************************** //
// returns true if source is used false otherwise

// generic case
template<typename T>
struct interpret_argument_value_impl {
    static bool _( cstring source, boost::optional<T>& res )
    {
        BOOST_RT_PARAM_TRACE( "In interpret_argument_value_impl<" << typeid(T).name() << ">" );

        res = lexical_cast<T>( source );

        BOOST_RT_PARAM_TRACE( "String " << source << " is interpreted as " << *res );
        return true;
    }
};


//____________________________________________________________________________//

// dstring case
template<>
struct interpret_argument_value_impl<dstring> {
    static bool _( cstring source, boost::optional<dstring>& res )
    {
        BOOST_RT_PARAM_TRACE( "In interpret_argument_value_impl<dstring>" );

        res = dstring();
        assign_op( *res, source, 0 );

        return true;
    }
};

//____________________________________________________________________________//

// cstring case
template<>
struct interpret_argument_value_impl<cstring> {
    static bool _( cstring source, boost::optional<cstring>& res )
    {
        BOOST_RT_PARAM_TRACE( "In interpret_argument_value_impl<cstring>" );

        res = source;

        return true;
    }
};

//____________________________________________________________________________//

// specialization for type bool
template<>
struct interpret_argument_value_impl<bool> {
    static bool _( cstring source, boost::optional<bool>& res )
    {
        BOOST_RT_PARAM_TRACE( "In interpret_argument_value_impl<bool>" );

        static literal_cstring YES( BOOST_RT_PARAM_CSTRING_LITERAL( "YES" ) );
        static literal_cstring Y( BOOST_RT_PARAM_CSTRING_LITERAL( "Y" ) );
        static literal_cstring NO( BOOST_RT_PARAM_CSTRING_LITERAL( "NO" ) );
        static literal_cstring N( BOOST_RT_PARAM_CSTRING_LITERAL( "N" ) );
        static literal_cstring one( BOOST_RT_PARAM_CSTRING_LITERAL( "1" ) );
        static literal_cstring zero( BOOST_RT_PARAM_CSTRING_LITERAL( "0" ) );

        source.trim();

        if( case_ins_eq( source, YES ) || case_ins_eq( source, Y ) || case_ins_eq( source, one ) ) {
            res = true;
            return true;
        }
        else if( case_ins_eq( source, NO ) || case_ins_eq( source, N ) || case_ins_eq( source, zero ) ) {
            res = false;
            return true;
        }
        else {
            res = true;
            return false;
        }
    }
};

//____________________________________________________________________________//

template<typename T>
inline bool
interpret_argument_value( cstring source, boost::optional<T>& res, long )
{
    return interpret_argument_value_impl<T>::_( source, res );
}

//____________________________________________________________________________//

// specialization for list of values
template<typename T>
inline bool
interpret_argument_value( cstring source, boost::optional<std::list<T> >& res, int )
{
    BOOST_RT_PARAM_TRACE( "In interpret_argument_value<std::list<T>>" );

    res = std::list<T>();

    while( !source.is_empty() ) {
        // !! should we use token_iterator
        cstring::iterator single_value_end = std::find( source.begin(), source.end(), BOOST_RT_PARAM_LITERAL( ',' ) );

        boost::optional<T> value;
        interpret_argument_value( cstring( source.begin(), single_value_end ), value, 0 );

        res->push_back( *value );

        source.trim_left( single_value_end + 1 );
    }

    return true;
}

//____________________________________________________________________________//

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_INTERPRET_ARGUMENT_VALUE_HPP_062604GER
