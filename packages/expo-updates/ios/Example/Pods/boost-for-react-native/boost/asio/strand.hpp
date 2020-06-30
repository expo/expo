//
// strand.hpp
// ~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_STRAND_HPP
#define BOOST_ASIO_STRAND_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <boost/asio/async_result.hpp>
#include <boost/asio/detail/handler_type_requirements.hpp>
#include <boost/asio/detail/strand_service.hpp>
#include <boost/asio/detail/wrapped_handler.hpp>
#include <boost/asio/io_service.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

/// Provides serialised handler execution.
/**
 * The io_service::strand class provides the ability to post and dispatch
 * handlers with the guarantee that none of those handlers will execute
 * concurrently.
 *
 * @par Order of handler invocation
 * Given:
 *
 * @li a strand object @c s
 *
 * @li an object @c a meeting completion handler requirements
 *
 * @li an object @c a1 which is an arbitrary copy of @c a made by the
 * implementation
 *
 * @li an object @c b meeting completion handler requirements
 *
 * @li an object @c b1 which is an arbitrary copy of @c b made by the
 * implementation
 *
 * if any of the following conditions are true:
 *
 * @li @c s.post(a) happens-before @c s.post(b)
 * 
 * @li @c s.post(a) happens-before @c s.dispatch(b), where the latter is
 * performed outside the strand
 * 
 * @li @c s.dispatch(a) happens-before @c s.post(b), where the former is
 * performed outside the strand
 * 
 * @li @c s.dispatch(a) happens-before @c s.dispatch(b), where both are
 * performed outside the strand
 *   
 * then @c asio_handler_invoke(a1, &a1) happens-before
 * @c asio_handler_invoke(b1, &b1).
 * 
 * Note that in the following case:
 * @code async_op_1(..., s.wrap(a));
 * async_op_2(..., s.wrap(b)); @endcode
 * the completion of the first async operation will perform @c s.dispatch(a),
 * and the second will perform @c s.dispatch(b), but the order in which those
 * are performed is unspecified. That is, you cannot state whether one
 * happens-before the other. Therefore none of the above conditions are met and
 * no ordering guarantee is made.
 *
 * @note The implementation makes no guarantee that handlers posted or
 * dispatched through different @c strand objects will be invoked concurrently.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Safe.
 *
 * @par Concepts:
 * Dispatcher.
 */
class io_service::strand
{
public:
  /// Constructor.
  /**
   * Constructs the strand.
   *
   * @param io_service The io_service object that the strand will use to
   * dispatch handlers that are ready to be run.
   */
  explicit strand(boost::asio::io_service& io_service)
    : service_(boost::asio::use_service<
        boost::asio::detail::strand_service>(io_service))
  {
    service_.construct(impl_);
  }

  /// Destructor.
  /**
   * Destroys a strand.
   *
   * Handlers posted through the strand that have not yet been invoked will
   * still be dispatched in a way that meets the guarantee of non-concurrency.
   */
  ~strand()
  {
  }

  /// Get the io_service associated with the strand.
  /**
   * This function may be used to obtain the io_service object that the strand
   * uses to dispatch handlers for asynchronous operations.
   *
   * @return A reference to the io_service object that the strand will use to
   * dispatch handlers. Ownership is not transferred to the caller.
   */
  boost::asio::io_service& get_io_service()
  {
    return service_.get_io_service();
  }

  /// Request the strand to invoke the given handler.
  /**
   * This function is used to ask the strand to execute the given handler.
   *
   * The strand object guarantees that handlers posted or dispatched through
   * the strand will not be executed concurrently. The handler may be executed
   * inside this function if the guarantee can be met. If this function is
   * called from within a handler that was posted or dispatched through the same
   * strand, then the new handler will be executed immediately.
   *
   * The strand's guarantee is in addition to the guarantee provided by the
   * underlying io_service. The io_service guarantees that the handler will only
   * be called in a thread in which the io_service's run member function is
   * currently being invoked.
   *
   * @param handler The handler to be called. The strand will make a copy of the
   * handler object as required. The function signature of the handler must be:
   * @code void handler(); @endcode
   */
  template <typename CompletionHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(CompletionHandler, void ())
  dispatch(BOOST_ASIO_MOVE_ARG(CompletionHandler) handler)
  {
    // If you get an error on the following line it means that your handler does
    // not meet the documented type requirements for a CompletionHandler.
    BOOST_ASIO_COMPLETION_HANDLER_CHECK(CompletionHandler, handler) type_check;

    detail::async_result_init<
      CompletionHandler, void ()> init(
        BOOST_ASIO_MOVE_CAST(CompletionHandler)(handler));

    service_.dispatch(impl_, init.handler);

    return init.result.get();
  }

  /// Request the strand to invoke the given handler and return
  /// immediately.
  /**
   * This function is used to ask the strand to execute the given handler, but
   * without allowing the strand to call the handler from inside this function.
   *
   * The strand object guarantees that handlers posted or dispatched through
   * the strand will not be executed concurrently. The strand's guarantee is in
   * addition to the guarantee provided by the underlying io_service. The
   * io_service guarantees that the handler will only be called in a thread in
   * which the io_service's run member function is currently being invoked.
   *
   * @param handler The handler to be called. The strand will make a copy of the
   * handler object as required. The function signature of the handler must be:
   * @code void handler(); @endcode
   */
  template <typename CompletionHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(CompletionHandler, void ())
  post(BOOST_ASIO_MOVE_ARG(CompletionHandler) handler)
  {
    // If you get an error on the following line it means that your handler does
    // not meet the documented type requirements for a CompletionHandler.
    BOOST_ASIO_COMPLETION_HANDLER_CHECK(CompletionHandler, handler) type_check;

    detail::async_result_init<
      CompletionHandler, void ()> init(
        BOOST_ASIO_MOVE_CAST(CompletionHandler)(handler));

    service_.post(impl_, init.handler);

    return init.result.get();
  }

  /// Create a new handler that automatically dispatches the wrapped handler
  /// on the strand.
  /**
   * This function is used to create a new handler function object that, when
   * invoked, will automatically pass the wrapped handler to the strand's
   * dispatch function.
   *
   * @param handler The handler to be wrapped. The strand will make a copy of
   * the handler object as required. The function signature of the handler must
   * be: @code void handler(A1 a1, ... An an); @endcode
   *
   * @return A function object that, when invoked, passes the wrapped handler to
   * the strand's dispatch function. Given a function object with the signature:
   * @code R f(A1 a1, ... An an); @endcode
   * If this function object is passed to the wrap function like so:
   * @code strand.wrap(f); @endcode
   * then the return value is a function object with the signature
   * @code void g(A1 a1, ... An an); @endcode
   * that, when invoked, executes code equivalent to:
   * @code strand.dispatch(boost::bind(f, a1, ... an)); @endcode
   */
  template <typename Handler>
#if defined(GENERATING_DOCUMENTATION)
  unspecified
#else
  detail::wrapped_handler<strand, Handler, detail::is_continuation_if_running>
#endif
  wrap(Handler handler)
  {
    return detail::wrapped_handler<io_service::strand, Handler,
        detail::is_continuation_if_running>(*this, handler);
  }

  /// Determine whether the strand is running in the current thread.
  /**
   * @return @c true if the current thread is executing a handler that was
   * submitted to the strand using post(), dispatch() or wrap(). Otherwise
   * returns @c false.
   */
  bool running_in_this_thread() const
  {
    return service_.running_in_this_thread(impl_);
  }

private:
  boost::asio::detail::strand_service& service_;
  boost::asio::detail::strand_service::implementation_type impl_;
};

/// (Deprecated: Use boost::asio::io_service::strand.) Typedef for backwards
/// compatibility.
typedef boost::asio::io_service::strand strand;

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_STRAND_HPP
