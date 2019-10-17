//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
/// @file
/// @brief defines simple text based progress monitor
// ***************************************************************************

#ifndef BOOST_TEST_PROGRESS_MONITOR_HPP_020105GER
#define BOOST_TEST_PROGRESS_MONITOR_HPP_020105GER

// Boost.Test
#include <boost/test/tree/observer.hpp>
#include <boost/test/utils/trivial_singleton.hpp>

// STL
#include <iosfwd>   // for std::ostream&

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {

// ************************************************************************** //
// **************                progress_monitor              ************** //
// ************************************************************************** //

/// This class implements test observer interface and updates test progress as test units finish or get aborted
class BOOST_TEST_DECL progress_monitor_t : public test_observer, public singleton<progress_monitor_t> {
public:
    /// @name Test observer interface
    /// @{
    virtual void    test_start( counter_t test_cases_amount );
    virtual void    test_aborted();

    virtual void    test_unit_finish( test_unit const&, unsigned long );
    virtual void    test_unit_skipped( test_unit const&, const_string );

    virtual int     priority() { return 3; }
    /// @}

    /// @name Configuration
    /// @{
    void            set_stream( std::ostream& );
    /// @}

private:
    BOOST_TEST_SINGLETON_CONS( progress_monitor_t )
}; // progress_monitor_t

BOOST_TEST_SINGLETON_INST( progress_monitor )

} // namespace unit_test
} // namespace boost

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_PROGRESS_MONITOR_HPP_020105GER

