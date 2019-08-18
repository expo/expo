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
//  Description : flexible configuration file iterator definition
// ***************************************************************************

#ifndef BOOST_RT_FILE_CONFIG_FILE_ITERATOR_HPP_062604GER
#define BOOST_RT_FILE_CONFIG_FILE_ITERATOR_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#include <boost/test/utils/runtime/fwd.hpp>

// Boost.Test
#include <boost/test/utils/iterator/input_iterator_facade.hpp>
#include <boost/test/utils/callback.hpp>
#include <boost/test/utils/named_params.hpp>

// Boost
#include <boost/shared_ptr.hpp>

namespace boost {

namespace BOOST_RT_PARAM_NAMESPACE {

namespace file {

// Public typedef 
typedef std::pair<dstring,long> location;

// ************************************************************************** //
// **************                   modifiers                  ************** //
// ************************************************************************** //

namespace cfg_detail {
    struct path_separators_t;
    struct line_delimeter_t;
    struct sl_comment_delimeter_t;
    struct command_delimeter_t;
    struct line_beak_t;
    struct macro_ref_begin_t;
    struct macro_ref_end_t;
    struct include_kw_t;
    struct define_kw_t;
    struct undef_kw_t;
    struct ifdef_kw_t;
    struct ifndef_kw_t;
    struct else_kw_t;
    struct endif_kw_t;

    struct buffer_size_t;

    struct trim_leading_spaces_t;
    struct trim_trailing_spaces_t;
    struct skip_empty_lines_t;
    struct detect_missing_macro_t;
} // namespace cfg_detail

namespace {

nfp::typed_keyword<cstring,cfg_detail::path_separators_t>       path_separators;
nfp::typed_keyword<char_type ,cfg_detail::line_delimeter_t>     line_delimeter;
nfp::typed_keyword<cstring,cfg_detail::sl_comment_delimeter_t>  single_line_comment_delimeter;
nfp::typed_keyword<cstring,cfg_detail::command_delimeter_t>     command_delimeter;
nfp::typed_keyword<cstring,cfg_detail::line_beak_t>             line_beak;
nfp::typed_keyword<cstring,cfg_detail::macro_ref_begin_t>       macro_ref_begin;
nfp::typed_keyword<cstring,cfg_detail::macro_ref_end_t>         macro_ref_end;
nfp::typed_keyword<cstring,cfg_detail::include_kw_t>            include_kw;
nfp::typed_keyword<cstring,cfg_detail::define_kw_t>             define_kw;
nfp::typed_keyword<cstring,cfg_detail::undef_kw_t>              undef_kw;
nfp::typed_keyword<cstring,cfg_detail::ifdef_kw_t>              ifdef_kw;
nfp::typed_keyword<cstring,cfg_detail::ifndef_kw_t>             ifndef_kw;
nfp::typed_keyword<cstring,cfg_detail::else_kw_t>               else_kw;
nfp::typed_keyword<cstring,cfg_detail::endif_kw_t>              endif_kw;

nfp::typed_keyword<std::size_t,cfg_detail::buffer_size_t>       buffer_size;

nfp::typed_keyword<bool,cfg_detail::trim_leading_spaces_t>      trim_leading_spaces;
nfp::typed_keyword<bool,cfg_detail::trim_trailing_spaces_t>     trim_trailing_spaces;
nfp::typed_keyword<bool,cfg_detail::skip_empty_lines_t>         skip_empty_lines;
nfp::typed_keyword<bool,cfg_detail::detect_missing_macro_t>     detect_missing_macro;

} // local namespace

// ************************************************************************** //
// **************      runtime::file::config_file_iterator      ************** //
// ************************************************************************** //

class config_file_iterator : public unit_test::input_iterator_facade<config_file_iterator,cstring,cstring> {
    typedef unit_test::input_iterator_facade<config_file_iterator,cstring,cstring> base;
public:
    // Public typedefs
    typedef unit_test::callback1<cstring>   command_handler;

    // Constructors
                    config_file_iterator() {}
    explicit        config_file_iterator( cstring file_name )
    {
        construct();
        load( file_name );
    }
    template<typename Modifiers>
                    config_file_iterator( cstring file_name, Modifiers const& m )
    {
        construct();
        m.apply_to( *this );
        load( file_name );
    }
    config_file_iterator( config_file_iterator const& rhs )
    : base( rhs )
    , m_pimpl( rhs.m_pimpl )
    {
        rhs.m_valid = false;
    }

    void operator=( config_file_iterator const& rhs )
    {
        if( this == &rhs )
            return;

        (base&)(*this)  = rhs;
        m_pimpl         = rhs.m_pimpl;
        rhs.m_valid     = false;
    }    // Assignment


    // Access methods
    location const& curr_location();
    void            register_command_handler( cstring command_kw, command_handler const& );

    // Parameters setters
    void            set_parameter( rtti::id_t, cstring );
    void            set_parameter( rtti::id_t, bool );
    void            set_parameter( rtti::id_t, char_type );
    void            set_parameter( rtti::id_t, std::size_t );

private:
    friend class unit_test::input_iterator_core_access;

    void            construct();
    void            load( cstring file_name );

    // increment implementation
    bool            get();

    // Data members
    struct Impl;
    shared_ptr<Impl> m_pimpl;
};

} // namespace file

} // namespace BOOST_RT_PARAM_NAMESPACE

} // namespace boost

#endif // BOOST_RT_FILE_CONFIG_FILE_ITERATOR_HPP_062604GER
