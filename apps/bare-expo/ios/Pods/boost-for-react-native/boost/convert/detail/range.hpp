// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_CONVERT_DETAIL_RANGE_HPP
#define BOOST_CONVERT_DETAIL_RANGE_HPP

#include <boost/convert/detail/has_member.hpp>
#include <boost/convert/detail/char.hpp>
#include <boost/utility/enable_if.hpp>
#include <boost/range/iterator.hpp>

namespace boost { namespace cnv
{
    namespace detail
    {
        template<typename T, bool is_class> struct is_range : mpl::false_ {};

        template<typename T> struct is_range<T, /*is_class=*/true>
        {
            BOOST_DECLARE_HAS_MEMBER(has_begin, begin);
            BOOST_DECLARE_HAS_MEMBER(  has_end, end);

            static bool const value = has_begin<T>::value && has_end<T>::value;
        };
    }
    template<typename T> struct is_range : detail::is_range<typename remove_const<T>::type, boost::is_class<T>::value> {};
    template<typename T, typename enable =void> struct range;
    template<typename T, typename enable =void> struct iterator;

    template<typename T>
    struct iterator<T, typename enable_if<is_range<T> >::type>
    {
        typedef typename boost::range_iterator<T>::type             type;
        typedef typename boost::range_iterator<T const>::type const_type;
        typedef typename boost::iterator_value<type>::type    value_type;
    };
    template<typename T>
    struct iterator<T*, void>
    {
        typedef typename remove_const<T>::type value_type;
        typedef T*                                   type;
        typedef value_type const*              const_type;
    };
    template<typename T>
    struct range_base
    {
        typedef typename cnv::iterator<T>::value_type     value_type;
        typedef typename cnv::iterator<T>::type             iterator;
        typedef typename cnv::iterator<T>::const_type const_iterator;
        typedef const_iterator                           sentry_type;

        iterator       begin () { return begin_; }
        const_iterator begin () const { return begin_; }
        void      operator++ () { ++begin_; }
//      void      operator-- () { --end_; }

        protected:

        range_base (iterator b, iterator e) : begin_(b), end_(e) {}

        iterator       begin_;
        iterator mutable end_;
    };

    template<typename T>
    struct range<T, typename enable_if<is_range<T> >::type> : public range_base<T>
    {
        typedef range                                   this_type;
        typedef range_base<T>                           base_type;
        typedef typename base_type::iterator             iterator;
        typedef typename base_type::const_iterator const_iterator;
        typedef const_iterator                        sentry_type;

        range (T& r) : base_type(r.begin(), r.end()) {}

        iterator         end () { return base_type::end_; }
        const_iterator   end () const { return base_type::end_; }
        sentry_type   sentry () const { return base_type::end_; }
        bool           empty () const { return base_type::begin_ == base_type::end_; }
    };

    template<typename T>
    struct range<T*, typename enable_if<cnv::is_char<T> >::type> : public range_base<T*>
    {
        typedef range                           this_type;
        typedef range_base<T*>                  base_type;
        typedef typename remove_const<T>::type value_type;
        typedef T*                               iterator;
        typedef value_type const*          const_iterator;

        struct sentry_type
        {
            friend bool operator!=(iterator it, sentry_type) { return !!*it; }
        };

        range (iterator b, iterator e =0) : base_type(b, e) {}

        iterator       end ()       { return base_type::end_ ? base_type::end_ : (base_type::end_ = base_type::begin_ + size()); }
        const_iterator end () const { return base_type::end_ ? base_type::end_ : (base_type::end_ = base_type::begin_ + size()); }
        sentry_type sentry () const { return sentry_type(); }
        std::size_t   size () const { return std::char_traits<value_type>::length(base_type::begin_); }
        bool         empty () const { return !*base_type::begin_; }
    };
    template<typename T>
    struct range<T* const, void> : public range<T*>
    {
        range (T* b, T* e =0) : range<T*>(b, e) {}
    };
    template <typename T, std::size_t N>
    struct range<T [N], void> : public range<T*>
    {
        range (T* b, T* e =0) : range<T*>(b, e) {}
    };
}}

#endif // BOOST_CONVERT_DETAIL_RANGE_HPP
