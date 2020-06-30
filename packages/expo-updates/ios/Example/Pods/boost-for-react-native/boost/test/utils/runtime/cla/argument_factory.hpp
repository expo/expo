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
//  Description : generic typed_argument_factory implementation
// ***************************************************************************

#ifndef BOOST_RT_CLA_ARGUMENT_FACTORY_HPP_062604GER
#define BOOST_RT_CLA_ARGUMENT_FACTORY_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/fwd.hpp>
#include <boost/test/utils/runtime/validation.hpp>
#include <boost/test/utils/runtime/argument.hpp>
#include <boost/test/utils/runtime/trace.hpp>
#include <boost/test/utils/runtime/interpret_argument_value.hpp>

#include <boost/test/utils/runtime/cla/fwd.hpp>
#include <boost/test/utils/runtime/cla/value_generator.hpp>
#include <boost/test/utils/runtime/cla/value_handler.hpp>
#include <boost/test/utils/runtime/cla/validation.hpp>
#include <boost/test/utils/runtime/cla/argv_traverser.hpp>
#include <boost/test/utils/runtime/cla/detail/argument_value_usage.hpp>

#include <boost/test/utils/runtime/cla/iface/argument_factory.hpp>

// Boost.Test
#include <boost/test/utils/callback.hpp>

// Boost
#include <boost/optional.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************           default_value_interpreter          ************** //
// ************************************************************************** //

namespace rt_cla_detail {

struct default_value_interpreter {
    template<typename T>
    void operator()( argv_traverser& tr, boost::optional<T>& value )
    {
        if( interpret_argument_value( tr.token(), value, 0 ) )
            tr.next_token();
    }
};

} // namespace rt_cla_detail

// ************************************************************************** //
// **************             typed_argument_factory           ************** //
// ************************************************************************** //

template<typename T>
struct typed_argument_factory : public argument_factory {
    // Constructor
    typed_argument_factory()
    : m_value_interpreter( rt_cla_detail::default_value_interpreter() )
    {}
    BOOST_RT_PARAM_UNNEEDED_VIRTUAL ~typed_argument_factory() {}

    // properties modification
    template<typename Modifier>
    void                accept_modifier( Modifier const& m )
    {
        optionally_assign( m_value_handler, m, handler );
        optionally_assign( m_value_interpreter, m, interpreter );

        if( m.has( default_value ) ) {
            BOOST_RT_PARAM_VALIDATE_LOGIC( !m_value_generator, 
                BOOST_RT_PARAM_LITERAL( "multiple value generators for parameter" ) );

            T const& dv_ref = m[default_value];
            m_value_generator = rt_cla_detail::const_generator<T>( dv_ref );
        }

        if( m.has( default_refer_to ) ) {
            BOOST_RT_PARAM_VALIDATE_LOGIC( !m_value_generator, 
                BOOST_RT_PARAM_LITERAL( "multiple value generators for parameter" ) );

            cstring ref_id = m[default_refer_to];
            m_value_generator = rt_cla_detail::ref_generator<T>( ref_id );
        }

        if( m.has( assign_to ) ) {
            BOOST_RT_PARAM_VALIDATE_LOGIC( !m_value_handler, 
                BOOST_RT_PARAM_LITERAL( "multiple value handlers for parameter" ) );

            m_value_handler = rt_cla_detail::assigner<T>( m[assign_to] );
        }
    }

    // Argument factory implementation
    virtual argument_ptr produce_using( parameter& p, argv_traverser& tr );
    virtual argument_ptr produce_using( parameter& p, parser const& );
    virtual void         argument_usage_info( format_stream& fs );

// !! private?
    // Data members
    unit_test::callback2<parameter const&,T&>                   m_value_handler;
    unit_test::callback2<parser const&,boost::optional<T>&>     m_value_generator;
    unit_test::callback2<argv_traverser&,boost::optional<T>&>   m_value_interpreter;
};

//____________________________________________________________________________//

template<typename T>
inline argument_ptr
typed_argument_factory<T>::produce_using( parameter& p, argv_traverser& tr )
{
    boost::optional<T> value;

    try {
        m_value_interpreter( tr, value );
    }
    catch( ... ) { // !! should we do that?
        BOOST_RT_PARAM_TRACE( "Fail to parse argument value" );

        if( !p.p_optional_value )
            throw;
    }

    argument_ptr actual_arg = p.actual_argument();

    BOOST_RT_CLA_VALIDATE_INPUT( !!value || p.p_optional_value, tr, 
        BOOST_RT_PARAM_LITERAL( "Argument value missing for parameter " ) << p.id_2_report() );

    BOOST_RT_CLA_VALIDATE_INPUT( !actual_arg || p.p_multiplicable, tr, 
        BOOST_RT_PARAM_LITERAL( "Unexpected repetition of the parameter " ) << p.id_2_report() );

    if( !!value && !!m_value_handler )
        m_value_handler( p, *value );

    if( !p.p_multiplicable )
        actual_arg.reset( p.p_optional_value && (rtti::type_id<T>() != rtti::type_id<bool>())
            ? static_cast<argument*>(new typed_argument<boost::optional<T> >( p, value ))
            : static_cast<argument*>(new typed_argument<T>( p, *value )) );
    else {
        typedef std::list<boost::optional<T> > optional_list;

        if( !actual_arg )
            actual_arg.reset( p.p_optional_value 
                ? static_cast<argument*>(new typed_argument<optional_list>( p ))
                : static_cast<argument*>(new typed_argument<std::list<T> >( p )) );

        if( p.p_optional_value ) {
            optional_list& values = arg_value<optional_list>( *actual_arg );

            values.push_back( value );
        }
        else {
            std::list<T>& values = arg_value<std::list<T> >( *actual_arg );
            
            values.push_back( *value );
        }
    }

    return actual_arg;
}

//____________________________________________________________________________//

template<typename T>
inline argument_ptr 
typed_argument_factory<T>::produce_using( parameter& p, parser const& pa )
{
    argument_ptr actual_arg;

    if( !m_value_generator )
        return actual_arg;

    boost::optional<T> value;
    m_value_generator( pa, value );

    if( !value )
        return actual_arg;

    if( !!m_value_handler )
        m_value_handler( p, *value );

    actual_arg.reset( new typed_argument<T>( p, *value ) );

    return actual_arg;
}

//____________________________________________________________________________//

template<typename T>
inline void
typed_argument_factory<T>::argument_usage_info( format_stream& fs )
{
    rt_cla_detail::argument_value_usage( fs, 0, reinterpret_cast<T*>(0) );
}

//____________________________________________________________________________//

} // namespace boost

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace cla

#endif // BOOST_RT_CLA_ARGUMENT_FACTORY_HPP_062604GER
