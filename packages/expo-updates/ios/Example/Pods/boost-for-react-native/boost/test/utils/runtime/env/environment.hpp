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
//  Description : defines and implements inline model of program environment 
// ***************************************************************************

#ifndef BOOST_RT_ENV_ENVIRONMENT_HPP_062604GER
#define BOOST_RT_ENV_ENVIRONMENT_HPP_062604GER

#ifdef UNDER_CE
#error Windows CE does not support environment variables.
#endif

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>
#include <boost/test/utils/runtime/fwd.hpp>
#include <boost/test/utils/runtime/argument.hpp>
#include <boost/test/utils/runtime/interpret_argument_value.hpp>

#include <boost/test/utils/runtime/env/fwd.hpp>
#include <boost/test/utils/runtime/env/modifier.hpp>
#include <boost/test/utils/runtime/env/variable.hpp>

// Boost.Test
#include <boost/test/utils/callback.hpp>

// Boost
#include <boost/optional.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

// ************************************************************************** //
// **************      runtime::environment implementation     ************** //
// ************************************************************************** //

namespace environment {

namespace rt_env_detail {

template<typename T, typename Modifiers>
variable_data&
init_new_var( cstring var_name, Modifiers m = nfp::no_params )
{
    rt_env_detail::variable_data& new_vd = new_var_record( var_name );

    cstring str_value = sys_read_var( new_vd.m_var_name );

    if( !str_value.is_empty() ) {
        try {
            boost::optional<T> value;

            if( m.has( interpreter ) )
                m[interpreter]( str_value, value );
            else
                interpret_argument_value( str_value, value, 0 );

            if( !!value ) {
                new_vd.m_value.reset( new typed_argument<T>( new_vd ) );

                arg_value<T>( *new_vd.m_value ) = *value;
            }
        }
        catch( ... ) { // !! could we do that
            // !! should we report an error?
        }
    }

    if( !new_vd.m_value && m.has( default_value ) ) {
        new_vd.m_value.reset( new typed_argument<T>( new_vd ) );

        nfp::optionally_assign( arg_value<T>( *new_vd.m_value ), m[default_value] );
    }

    nfp::optionally_assign( new_vd.m_global_id, m, global_id );

    return new_vd;
}

//____________________________________________________________________________//

} // namespace rt_env_detail

} // namespace environment

// ************************************************************************** //
// **************             runtime::environment             ************** //
// ************************************************************************** //

namespace environment {

    // variable access
    variable_base
    var( cstring var_name );

    //________________________________________________________________________//

    template<typename T>
    inline variable<T>
    var( cstring var_name )
    {
        rt_env_detail::variable_data* vd = rt_env_detail::find_var_record( var_name );

        return environment::variable<T>( !vd ? rt_env_detail::init_new_var<T>( var_name, nfp::no_params ) : *vd );
    }

    //________________________________________________________________________//

    template<typename T, typename Modifiers>
    inline variable<T>
    var( cstring var_name, Modifiers const& m )
    {
        rt_env_detail::variable_data* vd = rt_env_detail::find_var_record( var_name );

        return environment::variable<T>( !vd ? rt_env_detail::init_new_var<T>( var_name, m ) : *vd );
    }

    //________________________________________________________________________//

    // direct variable value access
    inline cstring
    get( cstring var_name )
    {
        return environment::var<cstring>( var_name ).value();
    }

    //________________________________________________________________________//

    template<typename T>
    inline T const&
    get( cstring var_name )
    {
        return environment::var<T>( var_name ).value();
    }

    //________________________________________________________________________//

    template<typename T>
    inline void
    get( cstring var_name, boost::optional<T>& res )
    {
        variable<T> const& v = environment::var<T>( var_name );
        v.value( res );
    }

    //________________________________________________________________________//

} // namespace environment

namespace env = environment;

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#ifndef BOOST_RT_PARAM_OFFLINE

#define BOOST_RT_PARAM_INLINE inline
#include <boost/test/utils/runtime/env/environment.ipp>

#endif

#endif // BOOST_RT_ENV_ENVIRONMENT_HPP_062604GER
