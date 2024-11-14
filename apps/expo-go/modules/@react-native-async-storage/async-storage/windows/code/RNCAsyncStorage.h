// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
#pragma once

#include "DBStorage.h"
#include "NativeModules.h"

namespace winrt::ReactNativeAsyncStorage::implementation
{
    REACT_MODULE(RNCAsyncStorage)
    struct RNCAsyncStorage {

        REACT_METHOD(multiGet)
        void multiGet(
            std::vector<std::string> &&keys,
            std::function<void(const std::vector<DBStorage::Error> &errors,
                               const std::vector<DBStorage::KeyValue> &result)> &&callback) noexcept
        {
            auto promise = DBStorage::CreatePromise(
                [callback](const std::vector<DBStorage::KeyValue> &result) {
                    callback({}, result);
                },
                [callback](const DBStorage::ErrorManager &errorManager) {
                    callback(errorManager.GetErrorList(), {});
                });
            m_dbStorage.AddTask(
                promise->GetErrorManager(),
                [promise, keys = std::move(keys)](DBStorage::DBTask &task, sqlite3 *db) noexcept {
                    promise->ResolveOrReject(task.MultiGet(db, keys));
                });
        }

        REACT_METHOD(multiSet)
        void multiSet(
            std::vector<DBStorage::KeyValue> &&keyValues,
            std::function<void(const std::vector<DBStorage::Error> &errors)> &&callback) noexcept
        {
            auto promise =
                DBStorage::CreatePromise([callback](bool /*value*/) { callback({}); },
                                         [callback](const DBStorage::ErrorManager &errorManager) {
                                             callback(errorManager.GetErrorList());
                                         });
            m_dbStorage.AddTask(promise->GetErrorManager(),
                                [promise, keyValues = std::move(keyValues)](DBStorage::DBTask &task,
                                                                            sqlite3 *db) noexcept {
                                    promise->ResolveOrReject(task.MultiSet(db, keyValues));
                                });
        }

        REACT_METHOD(multiMerge)
        void multiMerge(
            std::vector<DBStorage::KeyValue> &&keyValues,
            std::function<void(const std::vector<DBStorage::Error> &errors)> &&callback) noexcept
        {
            auto promise =
                DBStorage::CreatePromise([callback](bool /*value*/) { callback({}); },
                                         [callback](const DBStorage::ErrorManager &errorManager) {
                                             callback(errorManager.GetErrorList());
                                         });
            m_dbStorage.AddTask(promise->GetErrorManager(),
                                [promise, keyValues = std::move(keyValues)](DBStorage::DBTask &task,
                                                                            sqlite3 *db) noexcept {
                                    promise->ResolveOrReject(task.MultiMerge(db, keyValues));
                                });
        }

        REACT_METHOD(multiRemove)
        void multiRemove(
            std::vector<std::string> &&keys,
            std::function<void(const std::vector<DBStorage::Error> &errors)> &&callback) noexcept
        {
            auto promise =
                DBStorage::CreatePromise([callback](bool /*value*/) { callback({}); },
                                         [callback](const DBStorage::ErrorManager &errorManager) {
                                             callback(errorManager.GetErrorList());
                                         });
            m_dbStorage.AddTask(
                promise->GetErrorManager(),
                [promise, keys = std::move(keys)](DBStorage::DBTask &task, sqlite3 *db) noexcept {
                    promise->ResolveOrReject(task.MultiRemove(db, keys));
                });
        }

        REACT_METHOD(getAllKeys)
        void
        getAllKeys(std::function<void(const std::optional<DBStorage::Error> &error,
                                      const std::vector<std::string> &keys)> &&callback) noexcept
        {
            auto promise = DBStorage::CreatePromise(
                [callback](const std::vector<std::string> &keys) { callback(std::nullopt, keys); },
                [callback](const DBStorage::ErrorManager &errorManager) {
                    callback(errorManager.GetCombinedError(), {});
                });
            m_dbStorage.AddTask(promise->GetErrorManager(),
                                [promise](DBStorage::DBTask &task, sqlite3 *db) noexcept {
                                    promise->ResolveOrReject(task.GetAllKeys(db));
                                });
        }

        REACT_METHOD(clear)
        void
        clear(std::function<void(const std::optional<DBStorage::Error> &error)> &&callback) noexcept
        {
            auto promise =
                DBStorage::CreatePromise([callback](bool /*value*/) { callback(std::nullopt); },
                                         [callback](const DBStorage::ErrorManager &errorManager) {
                                             callback(errorManager.GetCombinedError());
                                         });
            m_dbStorage.AddTask(promise->GetErrorManager(),
                                [promise](DBStorage::DBTask &task, sqlite3 *db) noexcept {
                                    promise->ResolveOrReject(task.RemoveAll(db));
                                });
        }

    private:
        DBStorage m_dbStorage;
    };
}  // namespace winrt::ReactNativeAsyncStorage::implementation
