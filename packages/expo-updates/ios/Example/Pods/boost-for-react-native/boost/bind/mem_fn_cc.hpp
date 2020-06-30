//
//  bind/mem_fn_cc.hpp - support for different calling conventions
//
//  Do not include this header directly.
//
//  Copyright (c) 2001 Peter Dimov and Multi Media Ltd.
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
//  See http://www.boost.org/libs/bind/mem_fn.html for documentation.
//

template<class R, class T> _mfi::BOOST_MEM_FN_NAME(mf0)<R, T> mem_fn(R (BOOST_MEM_FN_CC T::*f) ())
{
    return _mfi::BOOST_MEM_FN_NAME(mf0)<R, T>(f);
}

template<class R, class T> _mfi::BOOST_MEM_FN_NAME(cmf0)<R, T> mem_fn(R (BOOST_MEM_FN_CC T::*f) () const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf0)<R, T>(f);
}

template<class R, class T, class A1> _mfi::BOOST_MEM_FN_NAME(mf1)<R, T, A1> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1))
{
    return _mfi::BOOST_MEM_FN_NAME(mf1)<R, T, A1>(f);
}

template<class R, class T, class A1> _mfi::BOOST_MEM_FN_NAME(cmf1)<R, T, A1> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf1)<R, T, A1>(f);
}

template<class R, class T, class A1, class A2> _mfi::BOOST_MEM_FN_NAME(mf2)<R, T, A1, A2> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2))
{
    return _mfi::BOOST_MEM_FN_NAME(mf2)<R, T, A1, A2>(f);
}

template<class R, class T, class A1, class A2> _mfi::BOOST_MEM_FN_NAME(cmf2)<R, T, A1, A2> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf2)<R, T, A1, A2>(f);
}

template<class R, class T, class A1, class A2, class A3> _mfi::BOOST_MEM_FN_NAME(mf3)<R, T, A1, A2, A3> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3))
{
    return _mfi::BOOST_MEM_FN_NAME(mf3)<R, T, A1, A2, A3>(f);
}

template<class R, class T, class A1, class A2, class A3> _mfi::BOOST_MEM_FN_NAME(cmf3)<R, T, A1, A2, A3> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf3)<R, T, A1, A2, A3>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4> _mfi::BOOST_MEM_FN_NAME(mf4)<R, T, A1, A2, A3, A4> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4))
{
    return _mfi::BOOST_MEM_FN_NAME(mf4)<R, T, A1, A2, A3, A4>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4> _mfi::BOOST_MEM_FN_NAME(cmf4)<R, T, A1, A2, A3, A4> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf4)<R, T, A1, A2, A3, A4>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5> _mfi::BOOST_MEM_FN_NAME(mf5)<R, T, A1, A2, A3, A4, A5> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5))
{
    return _mfi::BOOST_MEM_FN_NAME(mf5)<R, T, A1, A2, A3, A4, A5>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5> _mfi::BOOST_MEM_FN_NAME(cmf5)<R, T, A1, A2, A3, A4, A5> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf5)<R, T, A1, A2, A3, A4, A5>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5, class A6> _mfi::BOOST_MEM_FN_NAME(mf6)<R, T, A1, A2, A3, A4, A5, A6> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5, A6))
{
    return _mfi::BOOST_MEM_FN_NAME(mf6)<R, T, A1, A2, A3, A4, A5, A6>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5, class A6> _mfi::BOOST_MEM_FN_NAME(cmf6)<R, T, A1, A2, A3, A4, A5, A6> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5, A6) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf6)<R, T, A1, A2, A3, A4, A5, A6>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5, class A6, class A7> _mfi::BOOST_MEM_FN_NAME(mf7)<R, T, A1, A2, A3, A4, A5, A6, A7> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5, A6, A7))
{
    return _mfi::BOOST_MEM_FN_NAME(mf7)<R, T, A1, A2, A3, A4, A5, A6, A7>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5, class A6, class A7> _mfi::BOOST_MEM_FN_NAME(cmf7)<R, T, A1, A2, A3, A4, A5, A6, A7> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5, A6, A7) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf7)<R, T, A1, A2, A3, A4, A5, A6, A7>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5, class A6, class A7, class A8> _mfi::BOOST_MEM_FN_NAME(mf8)<R, T, A1, A2, A3, A4, A5, A6, A7, A8> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5, A6, A7, A8))
{
    return _mfi::BOOST_MEM_FN_NAME(mf8)<R, T, A1, A2, A3, A4, A5, A6, A7, A8>(f);
}

template<class R, class T, class A1, class A2, class A3, class A4, class A5, class A6, class A7, class A8> _mfi::BOOST_MEM_FN_NAME(cmf8)<R, T, A1, A2, A3, A4, A5, A6, A7, A8> mem_fn(R (BOOST_MEM_FN_CC T::*f) (A1, A2, A3, A4, A5, A6, A7, A8) const)
{
    return _mfi::BOOST_MEM_FN_NAME(cmf8)<R, T, A1, A2, A3, A4, A5, A6, A7, A8>(f);
}
