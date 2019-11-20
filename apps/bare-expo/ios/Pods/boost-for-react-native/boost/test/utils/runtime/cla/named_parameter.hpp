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
//  Description : defines model of named parameter
// ***************************************************************************

#ifndef BOOST_RT_CLA_NAMED_PARAMETER_HPP_062604GER
#define BOOST_RT_CLA_NAMED_PARAMETER_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/cla/basic_parameter.hpp>
#include <boost/test/utils/runtime/cla/id_policy.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace cla {

// ************************************************************************** //
// **************              string_name_policy              ************** //
// ************************************************************************** //

class string_name_policy : public basic_naming_policy {
public:
    // Constructor
    string_name_policy();
    BOOST_RT_PARAM_UNNEEDED_VIRTUAL ~string_name_policy() {}

    // policy interface
    virtual bool    responds_to( cstring name ) const;
    virtual bool    conflict_with( identification_policy const& ) const;

    // Accept modifier
    template<typename Modifier>
    void            accept_modifier( Modifier const& m )
    {
        basic_naming_policy::accept_modifier( m );

        if( m.has( guess_name_m ) )
            m_guess_name = true;
    }

private:
    // Naming policy interface
    virtual bool    match_name( argv_traverser& tr ) const;

    // Data members
    bool            m_guess_name;
};

// ************************************************************************** //
// **************         runtime::cla::named_parameter        ************** //
// ************************************************************************** //

template<typename T>
class named_parameter_t : public basic_parameter<T,string_name_policy> {
    typedef basic_parameter<T,string_name_policy> base;
public:
    // Constructors
    explicit    named_parameter_t( cstring name ) : base( name ) {}
};

//____________________________________________________________________________//

BOOST_RT_CLA_NAMED_PARAM_GENERATORS( named_parameter )

//____________________________________________________________________________//

} // namespace cla

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#ifndef BOOST_RT_PARAM_OFFLINE

#  define BOOST_RT_PARAM_INLINE inline
#  include <boost/test/utils/runtime/cla/named_parameter.ipp>

#endif

#endif // BOOST_RT_CLA_NAMED_PARAMETER_HPP_062604GER
