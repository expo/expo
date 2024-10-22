// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
#pragma once

#include <optional>

#include <winsqlite/winsqlite3.h>

#include "NativeModules.h"

struct DBStorage {
    // To pass KeyValue pairs in the native module API.
    // It has custom ReadValue and WriteValue to read/write to/from JSON.
    struct KeyValue {
        std::string Key;
        std::string Value;
    };

    // An Error object for the native module API.
    // It has a custom WriteValue to write to JSON.
    struct Error {
        std::string Message;
    };

    // An error list shared between Promise and DBTask.
    struct ErrorManager {
        std::nullopt_t AddError(std::string &&message) noexcept;
        bool HasErrors() const noexcept;
        const std::vector<Error> &GetErrorList() const noexcept;
        Error GetCombinedError() const noexcept;

    private:
        std::vector<Error> m_errors;
    };

    // Ensure that only one result onResolve or onReject callback is called once.
    template <typename TOnResolve, typename TOnReject>
    struct Promise {

        Promise(TOnResolve &&onResolve, TOnReject &&onReject) noexcept
            : m_onResolve(std::move(onResolve)), m_onReject(std::move(onReject))
        {
        }

        ~Promise()
        {
            Reject();
        }

        Promise(const Promise &other) = delete;
        Promise &operator=(const Promise &other) = delete;

        ErrorManager &GetErrorManager() noexcept
        {
            return m_errorManager;
        }

        template <typename TValue>
        void Resolve(const TValue &value) noexcept
        {
            Complete([&] { m_onResolve(value); });
        }

        void Reject() noexcept
        {
            Complete([&] {
                // Ensure that we have at least one error on rejection.
                if (!m_errorManager.HasErrors()) {
                    m_errorManager.AddError("Promise is rejected.");
                }
                m_onReject(m_errorManager);
            });
        }

        template <typename TValue>
        void ResolveOrReject(const std::optional<TValue> &value) noexcept
        {
            if (value) {
                Resolve(*value);
            } else {
                Reject();
            }
        }

    private:
        template <typename Fn>
        void Complete(Fn &&fn)
        {
            if (m_isCompleted.test_and_set() == false) {
                fn();
            }
        }

    private:
        ErrorManager m_errorManager;
        std::atomic_flag m_isCompleted = ATOMIC_FLAG_INIT;
        TOnResolve m_onResolve;
        TOnReject m_onReject;
    };

    // An asynchronous task that run in a background thread.
    struct DBTask {
        DBTask(ErrorManager &errorManager,
               std::function<void(DBTask &task, sqlite3 *db)> &&onRun) noexcept;

        DBTask() = default;
        DBTask(const DBTask &) = delete;
        DBTask &operator=(const DBTask &) = delete;

        void Run(DBStorage &storage, sqlite3 *db) noexcept;
        void Cancel() noexcept;

        std::optional<std::vector<KeyValue>>
        MultiGet(sqlite3 *db, const std::vector<std::string> &keys) noexcept;
        std::optional<bool> MultiSet(sqlite3 *db, const std::vector<KeyValue> &keyValues) noexcept;
        std::optional<bool> MultiMerge(sqlite3 *db,
                                       const std::vector<KeyValue> &keyValues) noexcept;
        std::optional<bool> MultiRemove(sqlite3 *db, const std::vector<std::string> &keys) noexcept;
        std::optional<std::vector<std::string>> GetAllKeys(sqlite3 *db) noexcept;
        std::optional<bool> RemoveAll(sqlite3 *db) noexcept;

    private:
        std::function<void(DBTask &task, sqlite3 *db)> m_onRun;
        ErrorManager &m_errorManager;
    };

    using DatabasePtr = std::unique_ptr<sqlite3, decltype(&sqlite3_close)>;

    std::optional<sqlite3 *> InitializeStorage(ErrorManager &errorManager) noexcept;
    ~DBStorage();

    template <typename TOnResolve, typename TOnReject>
    static auto CreatePromise(TOnResolve &&onResolve, TOnReject &&onReject) noexcept
    {
        using PromiseType = Promise<std::decay_t<TOnResolve>, std::decay_t<TOnReject>>;
        return std::make_shared<PromiseType>(std::forward<TOnResolve>(onResolve),
                                             std::forward<TOnReject>(onReject));
    }

    void AddTask(ErrorManager &errorManager,
                 std::function<void(DBTask &task, sqlite3 *db)> &&onRun) noexcept;

    winrt::Windows::Foundation::IAsyncAction RunTasks() noexcept;

private:
    static constexpr auto s_dbPathProperty = L"React-Native-Community-Async-Storage-Database-Path";

    DatabasePtr m_db{nullptr, &sqlite3_close};
    winrt::slim_mutex m_lock;
    winrt::slim_condition_variable m_cv;
    winrt::Windows::Foundation::IAsyncAction m_action{nullptr};
    std::vector<std::unique_ptr<DBTask>> m_tasks;
};

void ReadValue(const winrt::Microsoft::ReactNative::IJSValueReader &reader,
               /*out*/ DBStorage::KeyValue &value) noexcept;

void WriteValue(const winrt::Microsoft::ReactNative::IJSValueWriter &writer,
                const DBStorage::KeyValue &value) noexcept;

void WriteValue(const winrt::Microsoft::ReactNative::IJSValueWriter &writer,
                const DBStorage::Error &value) noexcept;
