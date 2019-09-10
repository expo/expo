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
//  Description : Facilities to perform exception safety_tests
// ***************************************************************************

#ifndef BOOST_TEST_MOCK_OBJECT_HPP_112205GER
#define BOOST_TEST_MOCK_OBJECT_HPP_112205GER

// Boost.Test
#include <boost/test/detail/config.hpp>
#include <boost/test/interaction_based.hpp>

// Boost
#include <boost/preprocessor/punctuation/comma.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {

namespace itest {

// ************************************************************************** //
// **************                mock_object_base              ************** //
// ************************************************************************** //

class mock_object_base {
public:
    mock_object_base() {}

    template<typename T1>
    mock_object_base( T1 const& ) {}

    template<typename T1, typename T2>
    mock_object_base( T1 const&, T2 const& ) {}

    template<typename T1, typename T2, typename T3>
    mock_object_base( T1 const&, T2 const&, T3 const& ) {}

    template<typename T1, typename T2, typename T3, typename T4>
    mock_object_base( T1 const&, T2 const&, T3 const&, T4 const& ) {}

    template<typename T1, typename T2, typename T3, typename T4, typename T5>
    mock_object_base( T1 const&, T2 const&, T3 const&, T4 const&, T5 const& ) {}
};

// ************************************************************************** //
// **************      mock_object implementation helpers      ************** //
// ************************************************************************** //

#define MO_OP_IMPL( op, descr, ret )                        \
    BOOST_ITEST_SCOPE( mock_object::operator op );          \
    BOOST_ITEST_EPOINT( descr );                            \
    return ret                                              \
/**/

#define MO_UNARY_OP( op, descr )                            \
self_type const& operator op() const                        \
{                                                           \
    MO_OP_IMPL( op, descr, prototype() );                   \
}                                                           \
/**/

#define MO_UNARY_BOOL_OP( op, descr )                       \
bool operator op() const                                    \
{                                                           \
    MO_OP_IMPL( op, descr, (!!BOOST_ITEST_DPOINT()) );      \
}                                                           \
/**/

#define MO_BINARY_OP( op, descr )                           \
template<int i1, typename Base1,int i2, typename Base2>     \
inline mock_object<i1,Base1> const&                         \
operator op( mock_object<i1,Base1> const& mo,               \
             mock_object<i2,Base2> const& )                 \
{                                                           \
    MO_OP_IMPL( op, descr, mo );                            \
}                                                           \
                                                            \
template<int i, typename Base, typename T>                  \
inline mock_object<i,Base> const&                           \
operator op( mock_object<i,Base> const& mo, T const& )      \
{                                                           \
    MO_OP_IMPL( op, descr, mo );                            \
}                                                           \
                                                            \
template<int i, typename Base, typename T>                  \
inline mock_object<i,Base> const&                           \
operator op( T const&, mock_object<i,Base> const& mo )      \
{                                                           \
    MO_OP_IMPL( op, descr, mo );                            \
}                                                           \
/**/

#define MO_BINARY_BOOL_OP( op, descr )                      \
template<int i1, typename Base1,int i2, typename Base2>     \
inline bool                                                 \
operator op( mock_object<i1,Base1> const&,                  \
             mock_object<i2,Base2> const& )                 \
{                                                           \
    MO_OP_IMPL( op, descr, BOOST_ITEST_DPOINT() );          \
}                                                           \
                                                            \
template<int i, typename Base, typename T>                  \
inline bool                                                 \
operator op( mock_object<i,Base> const&, T const& )         \
{                                                           \
    MO_OP_IMPL( op, descr, BOOST_ITEST_DPOINT() );          \
}                                                           \
                                                            \
template<int i, typename Base, typename T>                  \
inline bool                                                 \
operator op( T const&, mock_object<i,Base> const& )         \
{                                                           \
    MO_OP_IMPL( op, descr, BOOST_ITEST_DPOINT() );          \
}                                                           \
/**/

// ************************************************************************** //
// **************                  mock_object                 ************** //
// ************************************************************************** //

template<int i = 0, typename Base=mock_object_base>
class mock_object;

template<int i, typename Base>
class mock_object : public Base {
    // Private typeefs
    typedef mock_object<i,Base> self_type;
    struct dummy { void nonnull() {}; };
    typedef void (dummy::*safe_bool)();

    // prototype constructor
    mock_object( dummy* ) {}

public:
    static mock_object& prototype()
    {
        static mock_object p( reinterpret_cast<dummy*>(0) ); 
        return p;
    }

    // Constructors
    mock_object()
    {
        BOOST_ITEST_SCOPE( mock_object::mock_object );
        BOOST_ITEST_EPOINT( "Mock object default constructor" );
    }

    template<typename T1>
    mock_object( T1 const& arg1 )
    : mock_object_base( arg1 )
    {
        BOOST_ITEST_SCOPE( mock_object::mock_object );
        BOOST_ITEST_EPOINT( "Mock object constructor" );
    }

    template<typename T1, typename T2>
    mock_object( T1 const& arg1, T2 const& arg2 )
    : mock_object_base( arg1, arg2 )
    {
        BOOST_ITEST_SCOPE( mock_object::mock_object );
        BOOST_ITEST_EPOINT( "Mock object constructor" );
    }

    template<typename T1, typename T2, typename T3>
    mock_object( T1 const& arg1, T2 const& arg2, T3 const& arg3 )
    : mock_object_base( arg1, arg2, arg3 )
    {
        BOOST_ITEST_SCOPE( mock_object::mock_object );
        BOOST_ITEST_EPOINT( "Mock object constructor" );
    }

    template<typename T1, typename T2, typename T3, typename T4>
    mock_object( T1 const& arg1, T2 const& arg2, T3 const& arg3, T4 const& arg4 )
    : mock_object_base( arg1, arg2, arg3, arg4 )
    {
        BOOST_ITEST_SCOPE( mock_object::mock_object );
        BOOST_ITEST_EPOINT( "Mock object constructor" );
    }

    template<typename T1, typename T2, typename T3, typename T4, typename T5>
    mock_object( T1 const& arg1, T2 const& arg2, T3 const& arg3, T4 const& arg4, T5 const& arg5 )
    : mock_object_base( arg1, arg2, arg3, arg4, arg5 )
    {
        BOOST_ITEST_SCOPE( mock_object::mock_object );
        BOOST_ITEST_EPOINT( "Mock object constructor" );
    }

    mock_object( mock_object const& )
    {
        BOOST_ITEST_SCOPE( mock_object::mock_object );
        BOOST_ITEST_EPOINT( "Mock object copy constructor" );
    }

    // assignment
    self_type const&    operator =( mock_object const& ) const
    {
        MO_OP_IMPL( =, "Copy assignment", prototype() );
    }

    template <typename T>
    self_type const&    operator =( T const& ) const
    {
        MO_OP_IMPL( =, "Copy assignment", prototype() );
    }

    // Unary operators
    MO_UNARY_BOOL_OP( !, "Logical NOT operator" )
    MO_UNARY_OP( &, "Address-of operator" )
    MO_UNARY_OP( ~, "One's complement operator" )
    MO_UNARY_OP( *, "Pointer dereference" )
    MO_UNARY_OP( +, "Unary plus" )

    // Increment and Decrement
    MO_UNARY_OP( ++, "Prefix increment" )
    MO_UNARY_OP( --, "Prefix decrement" )
    self_type const&    operator ++(int) const
    {
        MO_OP_IMPL( ++, "Postfix increment", prototype() );
    }
    self_type const&    operator --(int) const
    {
        MO_OP_IMPL( --, "Postfix decrement", prototype() );
    }

    // Bool context convertion
    operator safe_bool() const
    {
        MO_OP_IMPL( safe_bool, "Bool context conversion",
                    (BOOST_ITEST_DPOINT() ? 0 : &dummy::nonnull) );
    }

    // Function-call operators
    self_type const&    operator ()() const
    {
        MO_OP_IMPL( (), "0-arity function-call", prototype() );
    }
    template<typename T1>
    self_type const&    operator ()( T1 const& arg1 ) const
    {
        MO_OP_IMPL( (), "1-arity function-call", prototype() );
    }
    template<typename T1, typename T2>
    self_type const&    operator ()( T1 const&, T2 const& ) const
    {
        MO_OP_IMPL( (), "2-arity function-call", prototype() );
    }
    template<typename T1, typename T2, typename T3>
    self_type const&    operator ()( T1 const&, T2 const&, T3 const& ) const
    {
        MO_OP_IMPL( (), "3-arity function-call", prototype() );
    }
    template<typename T1, typename T2, typename T3, typename T4>
    self_type const&    operator ()( T1 const&, T2 const&, T3 const&, T4 const& ) const
    {
        MO_OP_IMPL( (), "4-arity function-call", prototype() );
    }
    template<typename T1, typename T2, typename T3, typename T4, typename T5>
    self_type const&    operator ()( T1 const&, T2 const&, T3 const&, T4 const&, T5 const& ) const
    {
        MO_OP_IMPL( (), "5-arity function-call", prototype() );
    }

    // Substripting
    template<typename T>
    self_type const&    operator []( T const& ) const
    {
        MO_OP_IMPL( [], "Substripting", prototype() );
    }

    // Class member access
    self_type const*    operator->() const
    {
        MO_OP_IMPL( ->, "Class member access", this );
    }
};

// !! MO_BINARY_OP( BOOST_PP_COMMA(), "Comma operator" )

MO_BINARY_BOOL_OP( !=, "Inequality" )
MO_BINARY_OP( %, "Modulus" )
MO_BINARY_OP( %=, "Modulus/assignment" )
MO_BINARY_OP( &, "Bitwise AND" )
MO_BINARY_BOOL_OP( &&, "Logical AND" )
MO_BINARY_OP( &=, "Bitwise AND/assignment" )
MO_BINARY_OP( *, "Multiplication" )
MO_BINARY_OP( *=, "Multiplication/assignment" )
MO_BINARY_OP( +, "Addition" )
MO_BINARY_OP( +=, "Addition/assignment" )
//MO_BINARY_OP( -, "Subtraction" )
MO_BINARY_OP( -=, "Subtraction/assignment" )
MO_BINARY_OP( ->*, "Pointer-to-member selection" )
MO_BINARY_OP( /, "Division" )
MO_BINARY_OP( /=, "Division/assignment" )
MO_BINARY_BOOL_OP( <, "Less than" )
MO_BINARY_OP( <<=, "Left shift/assignment" )
MO_BINARY_BOOL_OP( <=, "Less than or equal to" )
MO_BINARY_BOOL_OP( ==, "Equality" )
MO_BINARY_BOOL_OP( >, "Greater than" )
MO_BINARY_BOOL_OP( >=, "Greater than or equal to" )
MO_BINARY_OP( >>=, "Right shift/assignment" )
MO_BINARY_OP( ^, "Exclusive OR" )
MO_BINARY_OP( ^=, "Exclusive OR/assignment" )
MO_BINARY_OP( |, "Bitwise inclusive OR" )
MO_BINARY_OP( |=, "Bitwise inclusive OR/assignment" )
MO_BINARY_BOOL_OP( ||, "Logical OR" )

MO_BINARY_OP( <<, "Left shift" )
MO_BINARY_OP( >>, "Right shift" )

} // namespace itest

} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_MOCK_OBJECT_HPP_112205GER
