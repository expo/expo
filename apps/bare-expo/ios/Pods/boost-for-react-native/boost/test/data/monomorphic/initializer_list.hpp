//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
///@file
///Defines monomorphic dataset based on C++11 initializer_list template
// ***************************************************************************

#ifndef BOOST_TEST_DATA_MONOMORPHIC_INITIALIZATION_LIST_HPP_091515GER
#define BOOST_TEST_DATA_MONOMORPHIC_INITIALIZATION_LIST_HPP_091515GER

// Boost.Test
#include <boost/test/data/config.hpp>
#include <boost/test/data/monomorphic/fwd.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {
namespace data {
namespace monomorphic {

// ************************************************************************** //
// **************                     array                    ************** //
// ************************************************************************** //

/// Dataset view of a C array
template<typename T>
class init_list {
public:
    typedef T sample;

    enum { arity = 1 };

    typedef T const* iterator;

    //! Constructor swallows initializer_list
    init_list( std::initializer_list<T>&& il )
    : m_data( std::forward<std::initializer_list<T>>( il ) )
    {}

    //! dataset interface
    data::size_t    size() const    { return m_data.size(); }
    iterator        begin() const   { return m_data.begin(); }

private:
    // Data members
    std::initializer_list<T> m_data;    
};

//____________________________________________________________________________//

//! An array dataset is a dataset
template<typename T>
struct is_dataset<init_list<T>> : mpl::true_ {};

} // namespace monomorphic

//____________________________________________________________________________//

//! @overload boost::unit_test::data::make()
template<typename T>
inline monomorphic::init_list<T>
make( std::initializer_list<T>&& il )
{
    return monomorphic::init_list<T>( std::forward<std::initializer_list<T>>( il ) );
}

} // namespace data
} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_DATA_MONOMORPHIC_INITIALIZATION_LIST_HPP_091515GER

