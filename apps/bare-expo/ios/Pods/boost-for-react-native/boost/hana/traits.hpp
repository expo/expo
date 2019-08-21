/*!
@file
Defines function-like equivalents to the standard `<type_traits>`, and also
to some utilities like `std::declval`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_TRAITS_HPP
#define BOOST_HANA_TRAITS_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/integral_constant.hpp>
#include <boost/hana/type.hpp>

#include <cstddef>
#include <type_traits>


BOOST_HANA_NAMESPACE_BEGIN namespace traits {
    namespace detail {
        // We use this instead of hana::integral because we want to return
        // hana::integral_constants instead of std::integral_constants.
        template <template <typename ...> class F>
        struct hana_trait {
            template <typename ...T>
            constexpr auto operator()(T const& ...) const {
                using Result = typename F<typename T::type...>::type;
                return hana::integral_c<typename Result::value_type, Result::value>;
            }
        };
    }

    ///////////////////////
    // Type properties
    ///////////////////////
    // Primary type categories
    constexpr auto is_void = detail::hana_trait<std::is_void>{};
    constexpr auto is_null_pointer = detail::hana_trait<std::is_null_pointer>{};
    constexpr auto is_integral = detail::hana_trait<std::is_integral>{};
    constexpr auto is_floating_point = detail::hana_trait<std::is_floating_point>{};
    constexpr auto is_array = detail::hana_trait<std::is_array>{};
    constexpr auto is_enum = detail::hana_trait<std::is_enum>{};
    constexpr auto is_union = detail::hana_trait<std::is_union>{};
    constexpr auto is_class = detail::hana_trait<std::is_class>{};
    constexpr auto is_function = detail::hana_trait<std::is_function>{};
    constexpr auto is_pointer = detail::hana_trait<std::is_pointer>{};
    constexpr auto is_lvalue_reference = detail::hana_trait<std::is_lvalue_reference>{};
    constexpr auto is_rvalue_reference = detail::hana_trait<std::is_rvalue_reference>{};
    constexpr auto is_member_object_pointer = detail::hana_trait<std::is_member_object_pointer>{};
    constexpr auto is_member_function_pointer = detail::hana_trait<std::is_member_function_pointer>{};

    // Composite type categories
    constexpr auto is_fundamental = detail::hana_trait<std::is_fundamental>{};
    constexpr auto is_arithmetic = detail::hana_trait<std::is_arithmetic>{};
    constexpr auto is_scalar = detail::hana_trait<std::is_scalar>{};
    constexpr auto is_object = detail::hana_trait<std::is_object>{};
    constexpr auto is_compound = detail::hana_trait<std::is_compound>{};
    constexpr auto is_reference = detail::hana_trait<std::is_reference>{};
    constexpr auto is_member_pointer = detail::hana_trait<std::is_member_pointer>{};

    // Type properties
    constexpr auto is_const = detail::hana_trait<std::is_const>{};
    constexpr auto is_volatile = detail::hana_trait<std::is_volatile>{};
    constexpr auto is_trivial = detail::hana_trait<std::is_trivial>{};
    constexpr auto is_trivially_copyable = detail::hana_trait<std::is_trivially_copyable>{};
    constexpr auto is_standard_layout = detail::hana_trait<std::is_standard_layout>{};
    constexpr auto is_pod = detail::hana_trait<std::is_pod>{};
    constexpr auto is_literal_type = detail::hana_trait<std::is_literal_type>{};
    constexpr auto is_empty = detail::hana_trait<std::is_empty>{};
    constexpr auto is_polymorphic = detail::hana_trait<std::is_polymorphic>{};
    constexpr auto is_abstract = detail::hana_trait<std::is_abstract>{};
    constexpr auto is_signed = detail::hana_trait<std::is_signed>{};
    constexpr auto is_unsigned = detail::hana_trait<std::is_unsigned>{};

    // Supported operations
    constexpr auto is_constructible = detail::hana_trait<std::is_constructible>{};
    constexpr auto is_trivially_constructible = detail::hana_trait<std::is_trivially_constructible>{};
    constexpr auto is_nothrow_constructible = detail::hana_trait<std::is_nothrow_constructible>{};

    constexpr auto is_default_constructible = detail::hana_trait<std::is_default_constructible>{};
    constexpr auto is_trivially_default_constructible = detail::hana_trait<std::is_trivially_default_constructible>{};
    constexpr auto is_nothrow_default_constructible = detail::hana_trait<std::is_nothrow_default_constructible>{};

    constexpr auto is_copy_constructible = detail::hana_trait<std::is_copy_constructible>{};
    constexpr auto is_trivially_copy_constructible = detail::hana_trait<std::is_trivially_copy_constructible>{};
    constexpr auto is_nothrow_copy_constructible = detail::hana_trait<std::is_nothrow_copy_constructible>{};

    constexpr auto is_move_constructible = detail::hana_trait<std::is_move_constructible>{};
    constexpr auto is_trivially_move_constructible = detail::hana_trait<std::is_trivially_move_constructible>{};
    constexpr auto is_nothrow_move_constructible = detail::hana_trait<std::is_nothrow_move_constructible>{};

    constexpr auto is_assignable = detail::hana_trait<std::is_assignable>{};
    constexpr auto is_trivially_assignable = detail::hana_trait<std::is_trivially_assignable>{};
    constexpr auto is_nothrow_assignable = detail::hana_trait<std::is_nothrow_assignable>{};

    constexpr auto is_copy_assignable = detail::hana_trait<std::is_copy_assignable>{};
    constexpr auto is_trivially_copy_assignable = detail::hana_trait<std::is_trivially_copy_assignable>{};
    constexpr auto is_nothrow_copy_assignable = detail::hana_trait<std::is_nothrow_copy_assignable>{};

    constexpr auto is_move_assignable = detail::hana_trait<std::is_move_assignable>{};
    constexpr auto is_trivially_move_assignable = detail::hana_trait<std::is_trivially_move_assignable>{};
    constexpr auto is_nothrow_move_assignable = detail::hana_trait<std::is_nothrow_move_assignable>{};

    constexpr auto is_destructible = detail::hana_trait<std::is_destructible>{};
    constexpr auto is_trivially_destructible = detail::hana_trait<std::is_trivially_destructible>{};
    constexpr auto is_nothrow_destructible = detail::hana_trait<std::is_nothrow_destructible>{};

    constexpr auto has_virtual_destructor = detail::hana_trait<std::has_virtual_destructor>{};

    // Property queries
    constexpr auto alignment_of = detail::hana_trait<std::alignment_of>{};
    constexpr auto rank = detail::hana_trait<std::rank>{};
    constexpr struct extent_t {
        template <typename T, typename N>
        constexpr auto operator()(T const&, N const&) const {
            constexpr unsigned n = N::value;
            using Result = typename std::extent<typename T::type, n>::type;
            return hana::integral_c<typename Result::value_type, Result::value>;
        }

        template <typename T>
        constexpr auto operator()(T const& t) const
        { return (*this)(t, hana::uint_c<0>); }
    } extent{};

    // Type relationships
    constexpr auto is_same = detail::hana_trait<std::is_same>{};
    constexpr auto is_base_of = detail::hana_trait<std::is_base_of>{};
    constexpr auto is_convertible = detail::hana_trait<std::is_convertible>{};

    ///////////////////////
    // Type modifications
    ///////////////////////
    // Const-volatility specifiers
    constexpr auto remove_cv = metafunction<std::remove_cv>;
    constexpr auto remove_const = metafunction<std::remove_const>;
    constexpr auto remove_volatile = metafunction<std::remove_volatile>;

    constexpr auto add_cv = metafunction<std::add_cv>;
    constexpr auto add_const = metafunction<std::add_const>;
    constexpr auto add_volatile = metafunction<std::add_volatile>;

    // References
    constexpr auto remove_reference = metafunction<std::remove_reference>;
    constexpr auto add_lvalue_reference = metafunction<std::add_lvalue_reference>;
    constexpr auto add_rvalue_reference = metafunction<std::add_rvalue_reference>;

    // Pointers
    constexpr auto remove_pointer = metafunction<std::remove_pointer>;
    constexpr auto add_pointer = metafunction<std::add_pointer>;

    // Sign modifiers
    constexpr auto make_signed = metafunction<std::make_signed>;
    constexpr auto make_unsigned = metafunction<std::make_unsigned>;

    // Arrays
    constexpr auto remove_extent = metafunction<std::remove_extent>;
    constexpr auto remove_all_extents = metafunction<std::remove_all_extents>;

    // Miscellaneous transformations
    constexpr struct aligned_storage_t {
        template <typename Len, typename Align>
        constexpr auto operator()(Len const&, Align const&) const {
            constexpr std::size_t len = Len::value;
            constexpr std::size_t align = Align::value;
            using Result = typename std::aligned_storage<len, align>::type;
            return hana::type_c<Result>;
        }

        template <typename Len>
        constexpr auto operator()(Len const&) const {
            constexpr std::size_t len = Len::value;
            using Result = typename std::aligned_storage<len>::type;
            return hana::type_c<Result>;
        }
    } aligned_storage{};

    constexpr struct aligned_union_t {
        template <typename Len, typename ...T>
        constexpr auto operator()(Len const&, T const&...) const {
            constexpr std::size_t len = Len::value;
            using Result = typename std::aligned_union<len, typename T::type...>::type;
            return hana::type_c<Result>;
        }
    } aligned_union{};

    constexpr auto decay = metafunction<std::decay>;
    // enable_if
    // disable_if
    // conditional

    constexpr auto common_type = metafunction<std::common_type>;
    constexpr auto underlying_type = metafunction<std::underlying_type>;
    constexpr auto result_of = metafunction<std::result_of>;


    ///////////////////////
    // Utilities
    ///////////////////////
    struct declval_t {
        template <typename T>
        typename std::add_rvalue_reference<
            typename T::type
        >::type operator()(T const&) const;
    };

    constexpr declval_t declval{};
} BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_TRAITS_HPP
