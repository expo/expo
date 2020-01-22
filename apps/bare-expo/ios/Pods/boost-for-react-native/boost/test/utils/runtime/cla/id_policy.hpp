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
//  Description : some generic identification policies definition
// ***************************************************************************

#ifndef BOOST_RT_CLA_ID_POLICY_HPP_062604GER
#define BOOST_RT_CLA_ID_POLICY_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/cla/fwd.hpp>
#include <boost/test/utils/runtime/cla/modifier.hpp>
#include <boost/test/utils/runtime/cla/argv_traverser.hpp>

#include <boost/test/utils/runtime/cla/iface/id_policy.hpp>

// Boost.Test
#include <boost/test/utils/class_properties.hpp>
#include <boost/test/utils/rtti.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************               naming_policy_base             ************** //
// ************************************************************************** //
// model: <prefix> <name> <separtor>

class basic_naming_policy : public identification_policy {
public:
    // Public properties
    unit_test::readwrite_property<dstring>    p_prefix;
    unit_test::readwrite_property<dstring>    p_name;
    unit_test::readwrite_property<dstring>    p_separator;

    // Policy interface
    virtual bool    responds_to( cstring name ) const       { return p_name == name; }
    virtual cstring id_2_report() const                     { return p_name.get(); }
    virtual void    usage_info( format_stream& fs ) const;
    virtual bool    matching( parameter const& p, argv_traverser& tr, bool primary ) const;

    // Accept modifier
    template<typename Modifier>
    void            accept_modifier( Modifier const& m )
    {
        nfp::optionally_assign( p_prefix.value,    m, prefix );
        nfp::optionally_assign( p_name.value,      m, name );
        nfp::optionally_assign( p_separator.value, m, separator );
    }

protected:
    explicit basic_naming_policy( rtti::id_t dyn_type )
    : identification_policy( dyn_type )
    {}
    BOOST_RT_PARAM_UNNEEDED_VIRTUAL ~basic_naming_policy() {}

    // Naming policy interface
    virtual bool    match_prefix( argv_traverser& tr ) const;
    virtual bool    match_name( argv_traverser& tr ) const;
    virtual bool    match_separator( argv_traverser& tr, bool optional_value ) const;
};

// ************************************************************************** //
// **************                 dual_id_policy               ************** //
// ************************************************************************** //

template<typename MostDerived,typename PrimaryId,typename SecondId>
class dual_id_policy : public identification_policy {
public:
    // Constructor
    dual_id_policy()
    : identification_policy( rtti::type_id<MostDerived>() )
    , m_primary()
    , m_secondary()
    {}

    // Policy interface
    virtual bool    responds_to( cstring name ) const
    {
        return m_primary.responds_to( name ) || m_secondary.responds_to( name );
    }
    virtual bool    conflict_with( identification_policy const& id_p ) const
    {
        return id_p.conflict_with( m_primary ) || id_p.conflict_with( m_secondary );
    }
    virtual cstring id_2_report() const
    {
        return m_primary.id_2_report();
    }
    virtual void    usage_info( format_stream& fs ) const
    {
        fs << BOOST_RT_PARAM_LITERAL( '{' );
        m_primary.usage_info( fs );
        fs << BOOST_RT_PARAM_LITERAL( '|' );
        m_secondary.usage_info( fs );
        fs << BOOST_RT_PARAM_LITERAL( '}' );
    }
    virtual bool    matching( parameter const& p, argv_traverser& tr, bool primary ) const
    {
        return m_primary.matching( p, tr, primary ) || m_secondary.matching( p, tr, primary );
    }

    // Accept modifier
    template<typename Modifier>
    void    accept_modifier( Modifier const& m )
    {
        m_primary.accept_modifier( m );
        m_secondary.accept_modifier( m );
    }

protected:
    BOOST_RT_PARAM_UNNEEDED_VIRTUAL ~dual_id_policy() {}

    // Data members
    PrimaryId       m_primary;
    SecondId        m_secondary;
};

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#ifndef BOOST_RT_PARAM_OFFLINE

#  define BOOST_RT_PARAM_INLINE inline
#  include <boost/test/utils/runtime/cla/id_policy.ipp>

#endif

#endif // BOOST_RT_CLA_ID_POLICY_HPP_062604GER
