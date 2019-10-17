//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Use, modification, and distribution are subject to the 
//  Boost Software License, Version 1.0. (See accompanying file 
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : defines model of generic parameter with dual naming
// ***************************************************************************

#ifndef BOOST_RT_CLA_DUAL_NAME_PARAMETER_HPP_062604GER
#define BOOST_RT_CLA_DUAL_NAME_PARAMETER_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/cla/named_parameter.hpp>
#include <boost/test/utils/runtime/cla/char_parameter.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************               dual_name_policy               ************** //
// ************************************************************************** //

class dual_name_policy : public dual_id_policy<dual_name_policy,string_name_policy,char_name_policy> {
public:
    dual_name_policy();

    // Accept modifier
    template<typename Modifier>
    void    accept_modifier( Modifier const& m )
    {
        if( m.has( prefix ) ) {
            set_prefix( m[prefix] );
            m.erase( prefix );
        }

        if( m.has( name ) ) {
            set_name( m[name] );
            m.erase( name );
        }

        if( m.has( separator ) ) {
            set_separator( m[separator] );
            m.erase( separator );
        }

        dual_id_policy<dual_name_policy,string_name_policy,char_name_policy>::accept_modifier( m );
    }
private:
    void    set_prefix( cstring );
    void    set_name( cstring );
    void    set_separator( cstring );
};

// ************************************************************************** //
// **************       runtime::cla::dual_name_parameter      ************** //
// ************************************************************************** //

template<typename T>
class dual_name_parameter_t : public basic_parameter<T,dual_name_policy> {
    typedef basic_parameter<T,dual_name_policy> base;
public:
    // Constructors
    explicit    dual_name_parameter_t( cstring name ) : base( name ) {}
};

//____________________________________________________________________________//

BOOST_RT_CLA_NAMED_PARAM_GENERATORS( dual_name_parameter )

//____________________________________________________________________________//

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#ifndef BOOST_RT_PARAM_OFFLINE

#  define BOOST_RT_PARAM_INLINE inline
#  include <boost/test/utils/runtime/cla/dual_name_parameter.ipp>

#endif

#endif // BOOST_RT_CLA_DUAL_NAME_PARAMETER_HPP_062604GER
