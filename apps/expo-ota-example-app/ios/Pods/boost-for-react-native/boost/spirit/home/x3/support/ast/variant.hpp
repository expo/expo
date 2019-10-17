/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_X3_VARIANT_AUGUST_6_2011_0859AM)
#define BOOST_SPIRIT_X3_VARIANT_AUGUST_6_2011_0859AM

#include <boost/variant.hpp>
#include <boost/mpl/list.hpp>
#include <boost/type_traits/is_base_of.hpp>
#include <type_traits>

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit { namespace x3
{
    template <typename T>
    class forward_ast
    {
    public:

        typedef T type;

    public:

        forward_ast() : p_(new T) {}

        forward_ast(forward_ast const& operand)
            : p_(new T(operand.get())) {}

        forward_ast(forward_ast&& operand)
            : p_(operand.p_)
        {
            operand.p_ = 0;
        }

        forward_ast(T const& operand)
            : p_(new T(operand)) {}

        forward_ast(T&& operand)
            : p_(new T(std::move(operand))) {}

        ~forward_ast()
        {
            boost::checked_delete(p_);
        }

        forward_ast& operator=(forward_ast const& rhs)
        {
            assign(rhs.get());
            return *this;
        }

        void swap(forward_ast& operand) BOOST_NOEXCEPT
        {
            T* temp = operand.p_;
            operand.p_ = p_;
            p_ = temp;
        }

        forward_ast& operator=(T const& rhs)
        {
            assign(rhs);
            return *this;
        }

        forward_ast& operator=(forward_ast&& rhs) BOOST_NOEXCEPT
        {
            swap(rhs);
            return *this;
        }

        forward_ast& operator=(T&& rhs)
        {
            get() = std::move(rhs);
            return *this;
        }

        T& get() { return *get_pointer(); }
        const T& get() const { return *get_pointer(); }

        T* get_pointer() { return p_; }
        const T* get_pointer() const { return p_; }

        operator T const&() const { return this->get(); }
        operator T&() { return this->get(); }

    private:

        void assign(const T& rhs)
        {
            this->get() = rhs;
        }

        T* p_;
    };

    // function template swap
    //
    // Swaps two forward_ast<T> objects of the same type T.
    //
    template <typename T>
    inline void swap(forward_ast<T>& lhs, forward_ast<T>& rhs) BOOST_NOEXCEPT
    {
        lhs.swap(rhs);
    }

    namespace detail
    {
        template <typename T>
        struct remove_forward : mpl::identity<T>
        {};

        template <typename T>
        struct remove_forward<forward_ast<T>> : mpl::identity<T>
        {};
    }

    template <typename ...Types>
    struct variant
    {
        // tell spirit that this is an adapted variant
        struct adapted_variant_tag;

        using variant_type = boost::variant<Types...>;
        using types        = mpl::list<typename detail::remove_forward<Types>::type...>;
        using base_type    = variant; // The current instantiation

        template<typename T>
        using non_self_t // used only for SFINAE checks below
            = std::enable_if_t<!(std::is_base_of<base_type
                                                ,std::remove_reference_t<T>
                                                >
                                                ::value)
                              >;

        variant() : var() {}

        template <typename T, class = non_self_t<T>>
        explicit variant(T const& rhs)
            : var(rhs) {}

        template <typename T, class = non_self_t<T>>
        explicit variant(T&& rhs)
            : var(std::forward<T>(rhs)) {}

        variant(variant const& rhs)
            : var(rhs.var) {}

        variant(variant& rhs)
            : var(rhs.var) {}

        variant(variant&& rhs)
            : var(std::forward<variant_type>(rhs.var)) {}

        variant& operator=(variant const& rhs)
        {
            var = rhs.get();
            return *this;
        }

        variant& operator=(variant&& rhs)
        {
            var = std::forward<variant_type>(rhs.get());
            return *this;
        }

        template <typename T, class = non_self_t<T>>
        variant& operator=(T const& rhs)
        {
            var = rhs;
            return *this;
        }

        template <typename T, class = non_self_t<T>>
        variant& operator=(T&& rhs)
        {
            var = std::forward<T>(rhs);
            return *this;
        }

        template <typename F>
        typename F::result_type apply_visitor(F const& v)
        {
            return var.apply_visitor(v);
        }

        template <typename F>
        typename F::result_type apply_visitor(F const& v) const
        {
            return var.apply_visitor(v);
        }

        template <typename F>
        typename F::result_type apply_visitor(F& v)
        {
            return var.apply_visitor(v);
        }

        template <typename F>
        typename F::result_type apply_visitor(F& v) const
        {
            return var.apply_visitor(v);
        }

        variant_type const& get() const
        {
            return var;
        }

        variant_type& get()
        {
            return var;
        }

        void swap(variant& rhs) BOOST_NOEXCEPT
        {
            var.swap(rhs.var);
        }

        variant_type var;
    };
}}}

namespace boost
{
    template <typename T, typename ...Types>
    inline T const&
    get(boost::spirit::x3::variant<Types...> const& x)
    {
        return boost::get<T>(x.get());
    }

    template <typename T, typename ...Types>
    inline T&
    get(boost::spirit::x3::variant<Types...>& x)
    {
        return boost::get<T>(x.get());
    }

    template <typename T, typename ...Types>
    inline T const*
    get(boost::spirit::x3::variant<Types...> const* x)
    {
        return boost::get<T>(&x->get());
    }

    template <typename T, typename ...Types>
    inline T*
    get(boost::spirit::x3::variant<Types...>* x)
    {
        return boost::get<T>(&x->get());
    }
}

#endif
