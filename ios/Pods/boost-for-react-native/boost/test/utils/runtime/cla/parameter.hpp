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
//  Description : defines model of formal parameter
// ***************************************************************************

#ifndef BOOST_RT_CLA_PARAMETER_HPP_062604GER
#define BOOST_RT_CLA_PARAMETER_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/fwd.hpp>
#include <boost/test/utils/runtime/parameter.hpp>
#include <boost/test/utils/runtime/validation.hpp>

#include <boost/test/utils/runtime/cla/fwd.hpp>
#include <boost/test/utils/runtime/cla/modifier.hpp>
#include <boost/test/utils/runtime/cla/iface/argument_factory.hpp>
#include <boost/test/utils/runtime/cla/iface/id_policy.hpp>

// Boost.Test
#include <boost/test/utils/rtti.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************            runtime::cla::parameter           ************** //
// ************************************************************************** //

class parameter : public BOOST_RT_PARAM_NAMESPACE::parameter {
public:
    parameter( identification_policy& ID, argument_factory& F, bool optional_value = false )
    : p_optional( false )
    , p_multiplicable( false )
    , p_optional_value( optional_value )
    , m_id_policy( ID )
    , m_arg_factory( F )
    {}

    // Destructor
    virtual         ~parameter()                                {}

    unit_test::readwrite_property<bool>      p_optional;
    unit_test::readwrite_property<bool>      p_multiplicable;
    unit_test::readwrite_property<bool>      p_optional_value;
    unit_test::readwrite_property<dstring>   p_description;

    // parameter properties modification
    template<typename Modifier>
    void            accept_modifier( Modifier const& m )
    {
        if( m.has( optional_m ) )
            p_optional.value = true;

        if( m.has( required_m ) )
            p_optional.value = false;

        if( m.has( multiplicable_m ) )
            p_multiplicable.value = true;

        if( m.has( optional_value_m ) )
            p_optional_value.value = true;

        nfp::optionally_assign( p_description.value, m, description );
    }

    // access methods
    bool            has_argument() const                        { return m_actual_argument!=0; }
    argument const& actual_argument() const                     { return *m_actual_argument; }
    argument_ptr    actual_argument()                           { return m_actual_argument; }


    // identification interface
    bool            responds_to( cstring name ) const           { return m_id_policy.responds_to( name ); }
    bool            conflict_with( parameter const& p ) const
    {
        return (id_2_report() == p.id_2_report() && !id_2_report().is_empty())  ||
               m_id_policy.conflict_with( p.m_id_policy )                       || 
               ((m_id_policy.p_type_id != p.m_id_policy.p_type_id) && p.m_id_policy.conflict_with( m_id_policy ));
    }
    cstring         id_2_report() const                         { return m_id_policy.id_2_report(); }
    void            usage_info( format_stream& fs ) const
    { 
        m_id_policy.usage_info( fs );
        if( p_optional_value )
            fs << BOOST_RT_PARAM_LITERAL( '[' );

        m_arg_factory.argument_usage_info( fs );

        if( p_optional_value )
            fs << BOOST_RT_PARAM_LITERAL( ']' );
    }

    // argument match/produce based on input
    bool            matching( argv_traverser& tr, bool primary ) const
    {
        return m_id_policy.matching( *this, tr, primary );
    }

    // argument production based on different source
    void            produce_argument( argv_traverser& tr )
    {
        m_id_policy.matching( *this, tr, true ); // !! can we save this position somehow
        m_actual_argument = m_arg_factory.produce_using( *this, tr );
    }
    void            produce_argument( parser const& p )
    {
        m_actual_argument = m_arg_factory.produce_using( *this, p );
    }

private:
    //Data members
    identification_policy&  m_id_policy;
    argument_factory&       m_arg_factory;
    argument_ptr            m_actual_argument;
};

//____________________________________________________________________________//

template<typename Parameter,typename Modifier>
inline shared_ptr<Parameter>
operator-( shared_ptr<Parameter> p, Modifier const& m )
{
    p->accept_modifier( m );

    return p;
}

//____________________________________________________________________________//

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_CLA_PARAMETER_HPP_062604GER
