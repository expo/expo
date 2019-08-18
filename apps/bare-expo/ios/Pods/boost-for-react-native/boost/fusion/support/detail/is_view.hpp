/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying 
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(FUSION_IS_VIEW_03202006_0018)
#define FUSION_IS_VIEW_03202006_0018

namespace boost { namespace fusion { namespace detail
{
    template <typename T>
    struct fusion_is_view
    {
        typedef typename T::is_view type;
    };
}}}

#endif
