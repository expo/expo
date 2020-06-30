// Copyright David Abrahams 2005. Distributed under the Boost
// Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
#ifndef BOOST_PARAMETER_AUX_TAG_DWA2005610_HPP
# define BOOST_PARAMETER_AUX_TAG_DWA2005610_HPP

# include <boost/parameter/aux_/unwrap_cv_reference.hpp>
# include <boost/parameter/aux_/tagged_argument.hpp>

namespace boost { namespace parameter { namespace aux { 

template <class Keyword, class ActualArg
#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
        , class = typename is_cv_reference_wrapper<ActualArg>::type
#endif 
          >
struct tag
{
    typedef tagged_argument<
        Keyword
      , typename unwrap_cv_reference<ActualArg>::type
    > type;
};

#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
template <class Keyword, class ActualArg>
struct tag<Keyword,ActualArg,mpl::false_>
{
    typedef tagged_argument<
        Keyword
      , ActualArg
    > type;
};
#endif 

}}} // namespace boost::parameter::aux_

#endif // BOOST_PARAMETER_AUX_TAG_DWA2005610_HPP
