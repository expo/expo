//
// io_service.hpp
// ~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IO_SERVICE_HPP
#define BOOST_ASIO_IO_SERVICE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <cstddef>
#include <stdexcept>
#include <typeinfo>
#include <boost/asio/async_result.hpp>
#include <boost/asio/detail/noncopyable.hpp>
#include <boost/asio/detail/wrapped_handler.hpp>
#include <boost/system/error_code.hpp>

#if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
# include <boost/asio/detail/winsock_init.hpp>
#elif defined(__sun) || defined(__QNX__) || defined(__hpux) || defined(_AIX) \
  || defined(__osf__)
# include <boost/asio/detail/signal_init.hpp>
#endif

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

class io_service;
template <typename Service> Service& use_service(io_service& ios);
template <typename Service> void add_service(io_service& ios, Service* svc);
template <typename Service> bool has_service(io_service& ios);

namespace detail {
#if defined(BOOST_ASIO_HAS_IOCP)
  typedef class win_iocp_io_service io_service_impl;
  class win_iocp_overlapped_ptr;
#else
  typedef class task_io_service io_service_impl;
#endif
  class service_registry;
} // namespace detail

/// Provides core I/O functionality.
/**
 * The io_service class provides the core I/O functionality for users of the
 * asynchronous I/O objects, including:
 *
 * @li boost::asio::ip::tcp::socket
 * @li boost::asio::ip::tcp::acceptor
 * @li boost::asio::ip::udp::socket
 * @li boost::asio::deadline_timer.
 *
 * The io_service class also includes facilities intended for developers of
 * custom asynchronous services.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Safe, with the specific exceptions of the reset() and
 * notify_fork() functions. Calling reset() while there are unfinished run(),
 * run_one(), poll() or poll_one() calls results in undefined behaviour. The
 * notify_fork() function should not be called while any io_service function,
 * or any function on an I/O object that is associated with the io_service, is
 * being called in another thread.
 *
 * @par Concepts:
 * Dispatcher.
 *
 * @par Synchronous and asynchronous operations
 *
 * Synchronous operations on I/O objects implicitly run the io_service object
 * for an individual operation. The io_service functions run(), run_one(),
 * poll() or poll_one() must be called for the io_service to perform
 * asynchronous operations on behalf of a C++ program. Notification that an
 * asynchronous operation has completed is delivered by invocation of the
 * associated handler. Handlers are invoked only by a thread that is currently
 * calling any overload of run(), run_one(), poll() or poll_one() for the
 * io_service.
 *
 * @par Effect of exceptions thrown from handlers
 *
 * If an exception is thrown from a handler, the exception is allowed to
 * propagate through the throwing thread's invocation of run(), run_one(),
 * poll() or poll_one(). No other threads that are calling any of these
 * functions are affected. It is then the responsibility of the application to
 * catch the exception.
 *
 * After the exception has been caught, the run(), run_one(), poll() or
 * poll_one() call may be restarted @em without the need for an intervening
 * call to reset(). This allows the thread to rejoin the io_service object's
 * thread pool without impacting any other threads in the pool.
 *
 * For example:
 *
 * @code
 * boost::asio::io_service io_service;
 * ...
 * for (;;)
 * {
 *   try
 *   {
 *     io_service.run();
 *     break; // run() exited normally
 *   }
 *   catch (my_exception& e)
 *   {
 *     // Deal with exception as appropriate.
 *   }
 * }
 * @endcode
 *
 * @par Stopping the io_service from running out of work
 *
 * Some applications may need to prevent an io_service object's run() call from
 * returning when there is no more work to do. For example, the io_service may
 * be being run in a background thread that is launched prior to the
 * application's asynchronous operations. The run() call may be kept running by
 * creating an object of type boost::asio::io_service::work:
 *
 * @code boost::asio::io_service io_service;
 * boost::asio::io_service::work work(io_service);
 * ... @endcode
 *
 * To effect a shutdown, the application will then need to call the io_service
 * object's stop() member function. This will cause the io_service run() call
 * to return as soon as possible, abandoning unfinished operations and without
 * permitting ready handlers to be dispatched.
 *
 * Alternatively, if the application requires that all operations and handlers
 * be allowed to finish normally, the work object may be explicitly destroyed.
 *
 * @code boost::asio::io_service io_service;
 * auto_ptr<boost::asio::io_service::work> work(
 *     new boost::asio::io_service::work(io_service));
 * ...
 * work.reset(); // Allow run() to exit. @endcode
 *
 * @par The io_service class and I/O services
 *
 * Class io_service implements an extensible, type-safe, polymorphic set of I/O
 * services, indexed by service type. An object of class io_service must be
 * initialised before I/O objects such as sockets, resolvers and timers can be
 * used. These I/O objects are distinguished by having constructors that accept
 * an @c io_service& parameter.
 *
 * I/O services exist to manage the logical interface to the operating system on
 * behalf of the I/O objects. In particular, there are resources that are shared
 * across a class of I/O objects. For example, timers may be implemented in
 * terms of a single timer queue. The I/O services manage these shared
 * resources.
 *
 * Access to the services of an io_service is via three function templates,
 * use_service(), add_service() and has_service().
 *
 * In a call to @c use_service<Service>(), the type argument chooses a service,
 * making available all members of the named type. If @c Service is not present
 * in an io_service, an object of type @c Service is created and added to the
 * io_service. A C++ program can check if an io_service implements a
 * particular service with the function template @c has_service<Service>().
 *
 * Service objects may be explicitly added to an io_service using the function
 * template @c add_service<Service>(). If the @c Service is already present, the
 * service_already_exists exception is thrown. If the owner of the service is
 * not the same object as the io_service parameter, the invalid_service_owner
 * exception is thrown.
 *
 * Once a service reference is obtained from an io_service object by calling
 * use_service(), that reference remains usable as long as the owning io_service
 * object exists.
 *
 * All I/O service implementations have io_service::service as a public base
 * class. Custom I/O services may be implemented by deriving from this class and
 * then added to an io_service using the facilities described above.
 */
class io_service
  : private noncopyable
{
private:
  typedef detail::io_service_impl impl_type;
#if defined(BOOST_ASIO_HAS_IOCP)
  friend class detail::win_iocp_overlapped_ptr;
#endif

public:
  class work;
  friend class work;

  class id;

  class service;

  class strand;

  /// Constructor.
  BOOST_ASIO_DECL io_service();

  /// Constructor.
  /**
   * Construct with a hint about the required level of concurrency.
   *
   * @param concurrency_hint A suggestion to the implementation on how many
   * threads it should allow to run simultaneously.
   */
  BOOST_ASIO_DECL explicit io_service(std::size_t concurrency_hint);

  /// Destructor.
  /**
   * On destruction, the io_service performs the following sequence of
   * operations:
   *
   * @li For each service object @c svc in the io_service set, in reverse order
   * of the beginning of service object lifetime, performs
   * @c svc->shutdown_service().
   *
   * @li Uninvoked handler objects that were scheduled for deferred invocation
   * on the io_service, or any associated strand, are destroyed.
   *
   * @li For each service object @c svc in the io_service set, in reverse order
   * of the beginning of service object lifetime, performs
   * <tt>delete static_cast<io_service::service*>(svc)</tt>.
   *
   * @note The destruction sequence described above permits programs to
   * simplify their resource management by using @c shared_ptr<>. Where an
   * object's lifetime is tied to the lifetime of a connection (or some other
   * sequence of asynchronous operations), a @c shared_ptr to the object would
   * be bound into the handlers for all asynchronous operations associated with
   * it. This works as follows:
   *
   * @li When a single connection ends, all associated asynchronous operations
   * complete. The corresponding handler objects are destroyed, and all
   * @c shared_ptr references to the objects are destroyed.
   *
   * @li To shut down the whole program, the io_service function stop() is
   * called to terminate any run() calls as soon as possible. The io_service
   * destructor defined above destroys all handlers, causing all @c shared_ptr
   * references to all connection objects to be destroyed.
   */
  BOOST_ASIO_DECL ~io_service();

  /// Run the io_service object's event processing loop.
  /**
   * The run() function blocks until all work has finished and there are no
   * more handlers to be dispatched, or until the io_service has been stopped.
   *
   * Multiple threads may call the run() function to set up a pool of threads
   * from which the io_service may execute handlers. All threads that are
   * waiting in the pool are equivalent and the io_service may choose any one
   * of them to invoke a handler.
   *
   * A normal exit from the run() function implies that the io_service object
   * is stopped (the stopped() function returns @c true). Subsequent calls to
   * run(), run_one(), poll() or poll_one() will return immediately unless there
   * is a prior call to reset().
   *
   * @return The number of handlers that were executed.
   *
   * @throws boost::system::system_error Thrown on failure.
   *
   * @note The run() function must not be called from a thread that is currently
   * calling one of run(), run_one(), poll() or poll_one() on the same
   * io_service object.
   *
   * The poll() function may also be used to dispatch ready handlers, but
   * without blocking.
   */
  BOOST_ASIO_DECL std::size_t run();

  /// Run the io_service object's event processing loop.
  /**
   * The run() function blocks until all work has finished and there are no
   * more handlers to be dispatched, or until the io_service has been stopped.
   *
   * Multiple threads may call the run() function to set up a pool of threads
   * from which the io_service may execute handlers. All threads that are
   * waiting in the pool are equivalent and the io_service may choose any one
   * of them to invoke a handler.
   *
   * A normal exit from the run() function implies that the io_service object
   * is stopped (the stopped() function returns @c true). Subsequent calls to
   * run(), run_one(), poll() or poll_one() will return immediately unless there
   * is a prior call to reset().
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @return The number of handlers that were executed.
   *
   * @note The run() function must not be called from a thread that is currently
   * calling one of run(), run_one(), poll() or poll_one() on the same
   * io_service object.
   *
   * The poll() function may also be used to dispatch ready handlers, but
   * without blocking.
   */
  BOOST_ASIO_DECL std::size_t run(boost::system::error_code& ec);

  /// Run the io_service object's event processing loop to execute at most one
  /// handler.
  /**
   * The run_one() function blocks until one handler has been dispatched, or
   * until the io_service has been stopped.
   *
   * @return The number of handlers that were executed. A zero return value
   * implies that the io_service object is stopped (the stopped() function
   * returns @c true). Subsequent calls to run(), run_one(), poll() or
   * poll_one() will return immediately unless there is a prior call to
   * reset().
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  BOOST_ASIO_DECL std::size_t run_one();

  /// Run the io_service object's event processing loop to execute at most one
  /// handler.
  /**
   * The run_one() function blocks until one handler has been dispatched, or
   * until the io_service has been stopped.
   *
   * @return The number of handlers that were executed. A zero return value
   * implies that the io_service object is stopped (the stopped() function
   * returns @c true). Subsequent calls to run(), run_one(), poll() or
   * poll_one() will return immediately unless there is a prior call to
   * reset().
   *
   * @return The number of handlers that were executed.
   */
  BOOST_ASIO_DECL std::size_t run_one(boost::system::error_code& ec);

  /// Run the io_service object's event processing loop to execute ready
  /// handlers.
  /**
   * The poll() function runs handlers that are ready to run, without blocking,
   * until the io_service has been stopped or there are no more ready handlers.
   *
   * @return The number of handlers that were executed.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  BOOST_ASIO_DECL std::size_t poll();

  /// Run the io_service object's event processing loop to execute ready
  /// handlers.
  /**
   * The poll() function runs handlers that are ready to run, without blocking,
   * until the io_service has been stopped or there are no more ready handlers.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @return The number of handlers that were executed.
   */
  BOOST_ASIO_DECL std::size_t poll(boost::system::error_code& ec);

  /// Run the io_service object's event processing loop to execute one ready
  /// handler.
  /**
   * The poll_one() function runs at most one handler that is ready to run,
   * without blocking.
   *
   * @return The number of handlers that were executed.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  BOOST_ASIO_DECL std::size_t poll_one();

  /// Run the io_service object's event processing loop to execute one ready
  /// handler.
  /**
   * The poll_one() function runs at most one handler that is ready to run,
   * without blocking.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @return The number of handlers that were executed.
   */
  BOOST_ASIO_DECL std::size_t poll_one(boost::system::error_code& ec);

  /// Stop the io_service object's event processing loop.
  /**
   * This function does not block, but instead simply signals the io_service to
   * stop. All invocations of its run() or run_one() member functions should
   * return as soon as possible. Subsequent calls to run(), run_one(), poll()
   * or poll_one() will return immediately until reset() is called.
   */
  BOOST_ASIO_DECL void stop();

  /// Determine whether the io_service object has been stopped.
  /**
   * This function is used to determine whether an io_service object has been
   * stopped, either through an explicit call to stop(), or due to running out
   * of work. When an io_service object is stopped, calls to run(), run_one(),
   * poll() or poll_one() will return immediately without invoking any
   * handlers.
   *
   * @return @c true if the io_service object is stopped, otherwise @c false.
   */
  BOOST_ASIO_DECL bool stopped() const;

  /// Reset the io_service in preparation for a subsequent run() invocation.
  /**
   * This function must be called prior to any second or later set of
   * invocations of the run(), run_one(), poll() or poll_one() functions when a
   * previous invocation of these functions returned due to the io_service
   * being stopped or running out of work. After a call to reset(), the
   * io_service object's stopped() function will return @c false.
   *
   * This function must not be called while there are any unfinished calls to
   * the run(), run_one(), poll() or poll_one() functions.
   */
  BOOST_ASIO_DECL void reset();

  /// Request the io_service to invoke the given handler.
  /**
   * This function is used to ask the io_service to execute the given handler.
   *
   * The io_service guarantees that the handler will only be called in a thread
   * in which the run(), run_one(), poll() or poll_one() member functions is
   * currently being invoked. The handler may be executed inside this function
   * if the guarantee can be met.
   *
   * @param handler The handler to be called. The io_service will make
   * a copy of the handler object as required. The function signature of the
   * handler must be: @code void handler(); @endcode
   *
   * @note This function throws an exception only if:
   *
   * @li the handler's @c asio_handler_allocate function; or
   *
   * @li the handler's copy constructor
   *
   * throws an exception.
   */
  template <typename CompletionHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(CompletionHandler, void ())
  dispatch(BOOST_ASIO_MOVE_ARG(CompletionHandler) handler);

  /// Request the io_service to invoke the given handler and return immediately.
  /**
   * This function is used to ask the io_service to execute the given handler,
   * but without allowing the io_service to call the handler from inside this
   * function.
   *
   * The io_service guarantees that the handler will only be called in a thread
   * in which the run(), run_one(), poll() or poll_one() member functions is
   * currently being invoked.
   *
   * @param handler The handler to be called. The io_service will make
   * a copy of the handler object as required. The function signature of the
   * handler must be: @code void handler(); @endcode
   *
   * @note This function throws an exception only if:
   *
   * @li the handler's @c asio_handler_allocate function; or
   *
   * @li the handler's copy constructor
   *
   * throws an exception.
   */
  template <typename CompletionHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(CompletionHandler, void ())
  post(BOOST_ASIO_MOVE_ARG(CompletionHandler) handler);

  /// Create a new handler that automatically dispatches the wrapped handler
  /// on the io_service.
  /**
   * This function is used to create a new handler function object that, when
   * invoked, will automatically pass the wrapped handler to the io_service
   * object's dispatch function.
   *
   * @param handler The handler to be wrapped. The io_service will make a copy
   * of the handler object as required. The function signature of the handler
   * must be: @code void handler(A1 a1, ... An an); @endcode
   *
   * @return A function object that, when invoked, passes the wrapped handler to
   * the io_service object's dispatch function. Given a function object with the
   * signature:
   * @code R f(A1 a1, ... An an); @endcode
   * If this function object is passed to the wrap function like so:
   * @code io_service.wrap(f); @endcode
   * then the return value is a function object with the signature
   * @code void g(A1 a1, ... An an); @endcode
   * that, when invoked, executes code equivalent to:
   * @code io_service.dispatch(boost::bind(f, a1, ... an)); @endcode
   */
  template <typename Handler>
#if defined(GENERATING_DOCUMENTATION)
  unspecified
#else
  detail::wrapped_handler<io_service&, Handler>
#endif
  wrap(Handler handler);

  /// Fork-related event notifications.
  enum fork_event
  {
    /// Notify the io_service that the process is about to fork.
    fork_prepare,

    /// Notify the io_service that the process has forked and is the parent.
    fork_parent,

    /// Notify the io_service that the process has forked and is the child.
    fork_child
  };

  /// Notify the io_service of a fork-related event.
  /**
   * This function is used to inform the io_service that the process is about
   * to fork, or has just forked. This allows the io_service, and the services
   * it contains, to perform any necessary housekeeping to ensure correct
   * operation following a fork.
   *
   * This function must not be called while any other io_service function, or
   * any function on an I/O object associated with the io_service, is being
   * called in another thread. It is, however, safe to call this function from
   * within a completion handler, provided no other thread is accessing the
   * io_service.
   *
   * @param event A fork-related event.
   *
   * @throws boost::system::system_error Thrown on failure. If the notification
   * fails the io_service object should no longer be used and should be
   * destroyed.
   *
   * @par Example
   * The following code illustrates how to incorporate the notify_fork()
   * function:
   * @code my_io_service.notify_fork(boost::asio::io_service::fork_prepare);
   * if (fork() == 0)
   * {
   *   // This is the child process.
   *   my_io_service.notify_fork(boost::asio::io_service::fork_child);
   * }
   * else
   * {
   *   // This is the parent process.
   *   my_io_service.notify_fork(boost::asio::io_service::fork_parent);
   * } @endcode
   *
   * @note For each service object @c svc in the io_service set, performs
   * <tt>svc->fork_service();</tt>. When processing the fork_prepare event,
   * services are visited in reverse order of the beginning of service object
   * lifetime. Otherwise, services are visited in order of the beginning of
   * service object lifetime.
   */
  BOOST_ASIO_DECL void notify_fork(boost::asio::io_service::fork_event event);

  /// Obtain the service object corresponding to the given type.
  /**
   * This function is used to locate a service object that corresponds to
   * the given service type. If there is no existing implementation of the
   * service, then the io_service will create a new instance of the service.
   *
   * @param ios The io_service object that owns the service.
   *
   * @return The service interface implementing the specified service type.
   * Ownership of the service interface is not transferred to the caller.
   */
  template <typename Service>
  friend Service& use_service(io_service& ios);

  /// Add a service object to the io_service.
  /**
   * This function is used to add a service to the io_service.
   *
   * @param ios The io_service object that owns the service.
   *
   * @param svc The service object. On success, ownership of the service object
   * is transferred to the io_service. When the io_service object is destroyed,
   * it will destroy the service object by performing:
   * @code delete static_cast<io_service::service*>(svc) @endcode
   *
   * @throws boost::asio::service_already_exists Thrown if a service of the
   * given type is already present in the io_service.
   *
   * @throws boost::asio::invalid_service_owner Thrown if the service's owning
   * io_service is not the io_service object specified by the ios parameter.
   */
  template <typename Service>
  friend void add_service(io_service& ios, Service* svc);

  /// Determine if an io_service contains a specified service type.
  /**
   * This function is used to determine whether the io_service contains a
   * service object corresponding to the given service type.
   *
   * @param ios The io_service object that owns the service.
   *
   * @return A boolean indicating whether the io_service contains the service.
   */
  template <typename Service>
  friend bool has_service(io_service& ios);

private:
#if defined(BOOST_ASIO_WINDOWS) || defined(__CYGWIN__)
  detail::winsock_init<> init_;
#elif defined(__sun) || defined(__QNX__) || defined(__hpux) || defined(_AIX) \
  || defined(__osf__)
  detail::signal_init<> init_;
#endif

  // The service registry.
  boost::asio::detail::service_registry* service_registry_;

  // The implementation.
  impl_type& impl_;
};

/// Class to inform the io_service when it has work to do.
/**
 * The work class is used to inform the io_service when work starts and
 * finishes. This ensures that the io_service object's run() function will not
 * exit while work is underway, and that it does exit when there is no
 * unfinished work remaining.
 *
 * The work class is copy-constructible so that it may be used as a data member
 * in a handler class. It is not assignable.
 */
class io_service::work
{
public:
  /// Constructor notifies the io_service that work is starting.
  /**
   * The constructor is used to inform the io_service that some work has begun.
   * This ensures that the io_service object's run() function will not exit
   * while the work is underway.
   */
  explicit work(boost::asio::io_service& io_service);

  /// Copy constructor notifies the io_service that work is starting.
  /**
   * The constructor is used to inform the io_service that some work has begun.
   * This ensures that the io_service object's run() function will not exit
   * while the work is underway.
   */
  work(const work& other);

  /// Destructor notifies the io_service that the work is complete.
  /**
   * The destructor is used to inform the io_service that some work has
   * finished. Once the count of unfinished work reaches zero, the io_service
   * object's run() function is permitted to exit.
   */
  ~work();

  /// Get the io_service associated with the work.
  boost::asio::io_service& get_io_service();

private:
  // Prevent assignment.
  void operator=(const work& other);

  // The io_service implementation.
  detail::io_service_impl& io_service_impl_;
};

/// Class used to uniquely identify a service.
class io_service::id
  : private noncopyable
{
public:
  /// Constructor.
  id() {}
};

/// Base class for all io_service services.
class io_service::service
  : private noncopyable
{
public:
  /// Get the io_service object that owns the service.
  boost::asio::io_service& get_io_service();

protected:
  /// Constructor.
  /**
   * @param owner The io_service object that owns the service.
   */
  BOOST_ASIO_DECL service(boost::asio::io_service& owner);

  /// Destructor.
  BOOST_ASIO_DECL virtual ~service();

private:
  /// Destroy all user-defined handler objects owned by the service.
  virtual void shutdown_service() = 0;

  /// Handle notification of a fork-related event to perform any necessary
  /// housekeeping.
  /**
   * This function is not a pure virtual so that services only have to
   * implement it if necessary. The default implementation does nothing.
   */
  BOOST_ASIO_DECL virtual void fork_service(
      boost::asio::io_service::fork_event event);

  friend class boost::asio::detail::service_registry;
  struct key
  {
    key() : type_info_(0), id_(0) {}
    const std::type_info* type_info_;
    const boost::asio::io_service::id* id_;
  } key_;

  boost::asio::io_service& owner_;
  service* next_;
};

/// Exception thrown when trying to add a duplicate service to an io_service.
class service_already_exists
  : public std::logic_error
{
public:
  BOOST_ASIO_DECL service_already_exists();
};

/// Exception thrown when trying to add a service object to an io_service where
/// the service has a different owner.
class invalid_service_owner
  : public std::logic_error
{
public:
  BOOST_ASIO_DECL invalid_service_owner();
};

namespace detail {

// Special derived service id type to keep classes header-file only.
template <typename Type>
class service_id
  : public boost::asio::io_service::id
{
};

// Special service base class to keep classes header-file only.
template <typename Type>
class service_base
  : public boost::asio::io_service::service
{
public:
  static boost::asio::detail::service_id<Type> id;

  // Constructor.
  service_base(boost::asio::io_service& io_service)
    : boost::asio::io_service::service(io_service)
  {
  }
};

template <typename Type>
boost::asio::detail::service_id<Type> service_base<Type>::id;

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#include <boost/asio/impl/io_service.hpp>
#if defined(BOOST_ASIO_HEADER_ONLY)
# include <boost/asio/impl/io_service.ipp>
#endif // defined(BOOST_ASIO_HEADER_ONLY)

#endif // BOOST_ASIO_IO_SERVICE_HPP
