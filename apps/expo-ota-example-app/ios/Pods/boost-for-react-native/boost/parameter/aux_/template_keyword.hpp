// Copyright Daniel Wallin 2006. Use, modification and distribution is
// subject to the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_PARAMETER_TEMPLATE_KEYWORD_060203_HPP
# define BOOST_PARAMETER_TEMPLATE_KEYWORD_060203_HPP

# include <boost/mpl/and.hpp>
# include <boost/mpl/not.hpp>
# include <boost/type_traits/is_convertible.hpp>
# include <boost/type_traits/is_reference.hpp>

namespace boost { namespace parameter { 

namespace aux 
{

  struct template_keyword_tag {}; 

  template <class T, class U>
  struct is_pointer_convertible
    : is_convertible<T*, U*>
  {};

  template <class T>
  struct is_template_keyword
    : mpl::and_<
          mpl::not_<is_reference<T> >
        , is_pointer_convertible<T, template_keyword_tag>
      >
  {};

} // namespace aux

template <class Tag, class T>
struct template_keyword
  : aux::template_keyword_tag
{
    typedef Tag key_type;
    typedef T value_type;
    typedef value_type reference;
};

}} // namespace boost::parameter

#endif // BOOST_PARAMETER_TEMPLATE_KEYWORD_060203_HPP

