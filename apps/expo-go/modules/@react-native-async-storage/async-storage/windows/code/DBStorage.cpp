// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
#include "pch.h"

#include "DBStorage.h"

#include <unordered_map>

namespace winrt
{
    using namespace Microsoft::ReactNative;
    using namespace Windows::ApplicationModel::Core;
    using namespace Windows::Data::Json;
    using namespace Windows::Foundation;
    using namespace Windows::Storage;
}  // namespace winrt

// All functions below return std::nullopt on error.
#define CHECK(expr)                                                                                \
    if (!(expr)) {                                                                                 \
        return std::nullopt;                                                                       \
    }

// Convenience macro to call CheckSQLiteResult.
#define CHECK_SQL_OK(expr) CHECK(CheckSQLiteResult(db, m_errorManager, (expr)))

namespace
{
    // To implement safe operator& for unique_ptr.
    template <typename T, typename TDeleter>
    struct UniquePtrSetter {
        UniquePtrSetter(std::unique_ptr<T, TDeleter> &ptr) noexcept : m_ptr(ptr)
        {
        }

        ~UniquePtrSetter()
        {
            m_ptr = {m_rawPtr, m_ptr.get_deleter()};
        }

        operator T **() noexcept
        {
            return &m_rawPtr;
        }

    private:
        T *m_rawPtr{};
        std::unique_ptr<T, TDeleter> &m_ptr;
    };

    template <typename T, typename TDeleter>
    UniquePtrSetter<T, TDeleter> operator&(std::unique_ptr<T, TDeleter> &ptr) noexcept
    {
        return UniquePtrSetter<T, TDeleter>(ptr);
    }

    using ExecCallback = int(SQLITE_CALLBACK *)(void *callbackData,
                                                int columnCount,
                                                char **columnTexts,
                                                char **columnNames);

    // Execute the provided SQLite statement (and optional execCallback & user data
    // in callbackData). On error, report it to the errorManager and return std::nullopt.
    std::optional<bool> Exec(sqlite3 *db,
                             DBStorage::ErrorManager &errorManager,
                             const char *statement,
                             ExecCallback execCallback = nullptr,
                             void *callbackData = nullptr) noexcept
    {
        auto errMsg = std::unique_ptr<char, decltype(&sqlite3_free)>{nullptr, &sqlite3_free};
        int rc = sqlite3_exec(db, statement, execCallback, callbackData, &errMsg);
        if (errMsg) {
            return errorManager.AddError(errMsg.get());
        }
        if (rc != SQLITE_OK) {
            return errorManager.AddError(sqlite3_errmsg(db));
        }
        return true;
    }

    // Convenience wrapper for using Exec with lambda expressions.
    template <typename Fn>
    std::optional<bool>
    Exec(sqlite3 *db, DBStorage::ErrorManager &errorManager, const char *statement, Fn &fn) noexcept
    {
        return Exec(
            db,
            errorManager,
            statement,
            [](void *callbackData, int columnCount, char **columnTexts, char **columnNames) {
                return (*static_cast<Fn *>(callbackData))(columnCount, columnTexts, columnNames);
            },
            &fn);
    }

    // Check that the args collection size is less than SQLITE_LIMIT_VARIABLE_NUMBER, and that
    // every member of args is not an empty string.
    // On error, report it to the errorManager and return std::nullopt.
    std::optional<bool> CheckArgs(sqlite3 *db,
                                  DBStorage::ErrorManager &errorManager,
                                  const std::vector<std::string> &args) noexcept
    {
        int varLimit = sqlite3_limit(db, SQLITE_LIMIT_VARIABLE_NUMBER, -1);
        auto argCount = args.size();
        if (argCount > static_cast<size_t>(std::numeric_limits<int>::max()) ||
            static_cast<int>(argCount) > varLimit) {
            char errorMsg[60];
            sprintf_s(errorMsg, "Too many keys. Maximum supported keys :%d.", varLimit);
            return errorManager.AddError(errorMsg);
        }
        for (int i = 0; i < static_cast<int>(argCount); i++) {
            if (args[i].empty()) {
                return errorManager.AddError("The key must be a non-empty string.");
            }
        }
        return true;
    }

    // RAII object to manage SQLite transaction. On destruction, if
    // Commit() has not been called, rolls back the transactions.
    // The provided SQLite connection handle & errorManager must outlive
    // the Sqlite3Transaction object.
    struct Sqlite3Transaction {
        Sqlite3Transaction(sqlite3 *db, DBStorage::ErrorManager &errorManager) noexcept
            : m_db(db), m_errorManager(errorManager)
        {
            if (!Exec(m_db, m_errorManager, "BEGIN TRANSACTION")) {
                m_db = nullptr;
            }
        }

        Sqlite3Transaction(const Sqlite3Transaction &) = delete;
        Sqlite3Transaction &operator=(const Sqlite3Transaction &) = delete;

        ~Sqlite3Transaction()
        {
            Rollback();
        }

        explicit operator bool() const noexcept
        {
            return m_db != nullptr;
        }

        std::optional<bool> Commit() noexcept
        {
            if (m_db) {
                return Exec(std::exchange(m_db, nullptr), m_errorManager, "COMMIT");
            }
            return std::nullopt;
        }

        std::optional<bool> Rollback() noexcept
        {
            if (m_db) {
                return Exec(std::exchange(m_db, nullptr), m_errorManager, "ROLLBACK");
            }
            return std::nullopt;
        }

    private:
        sqlite3 *m_db{};
        DBStorage::ErrorManager &m_errorManager;
    };

    // Append argCount variables to prefix in a comma-separated list.
    std::string MakeSQLiteParameterizedStatement(const char *prefix, int argCount) noexcept
    {
        assert(argCount != 0);
        std::string result(prefix);
        result.reserve(result.size() + (argCount * 2) + 1);
        result += '(';
        for (int x = 0; x < argCount - 1; x++) {
            result += "?,";
        }
        result += "?)";
        return result;
    }

    // Check if sqliteResult is SQLITE_OK.
    // If not, report the error to the errorManager and return std::nullopt.
    std::optional<bool> CheckSQLiteResult(sqlite3 *db,
                                          DBStorage::ErrorManager &errorManager,
                                          int sqliteResult) noexcept
    {
        if (sqliteResult == SQLITE_OK) {
            return true;
        } else {
            return errorManager.AddError(sqlite3_errmsg(db));
        }
    }

    using StatementPtr = std::unique_ptr<sqlite3_stmt, decltype(&sqlite3_finalize)>;

    // A convenience wrapper for sqlite3_prepare_v2 function.
    int PrepareStatement(sqlite3 *db,
                         const std::string &statementText,
                         sqlite3_stmt **statement) noexcept
    {
        return sqlite3_prepare_v2(db, statementText.c_str(), -1, statement, nullptr);
    }

    // A convenience wrapper for sqlite3_bind_text function.
    int BindString(StatementPtr &statement, int index, const std::string &str) noexcept
    {
        return sqlite3_bind_text(statement.get(), index, str.c_str(), -1, SQLITE_TRANSIENT);
    }

    // Merge source into destination.
    // It only merges objects - all other types are just clobbered (including arrays).
    void MergeJsonObjects(winrt::JsonObject const &destination,
                          winrt::JsonObject const &source) noexcept
    {
        for (auto keyValue : source) {
            auto key = keyValue.Key();
            auto sourceValue = keyValue.Value();
            if (destination.HasKey(key)) {
                auto destinationValue = destination.GetNamedValue(key);
                if (destinationValue.ValueType() == winrt::JsonValueType::Object &&
                    sourceValue.ValueType() == winrt::JsonValueType::Object) {
                    MergeJsonObjects(destinationValue.GetObject(), sourceValue.GetObject());
                    continue;
                }
            }
            destination.SetNamedValue(key, sourceValue);
        }
    }
}  // namespace

// Initialize storage. On error, report it to the errorManager and return std::nullopt.
std::optional<sqlite3 *>
DBStorage::InitializeStorage(DBStorage::ErrorManager &errorManager) noexcept
{
    winrt::slim_lock_guard guard{m_lock};
    if (m_db) {
        return m_db.get();
    }

    std::string path;
    try {
        if (auto pathInspectable =
                winrt::CoreApplication::Properties().TryLookup(s_dbPathProperty)) {
            path = winrt::to_string(winrt::unbox_value<winrt::hstring>(pathInspectable));
        } else {
            auto const localAppDataPath = winrt::ApplicationData::Current().LocalFolder().Path();
            path = winrt::to_string(localAppDataPath) + "\\AsyncStorage.db";
        }
    } catch (const winrt::hresult_error &error) {
        errorManager.AddError(winrt::to_string(error.message()));
        return errorManager.AddError(
            "Please specify 'React-Native-Community-Async-Storage-Database-Path' in "
            "CoreApplication::Properties");
    }

    auto db = DatabasePtr{nullptr, &sqlite3_close};
    if (sqlite3_open_v2(path.c_str(),
                        &db,
                        SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX,
                        nullptr) != SQLITE_OK) {
        if (db) {
            return errorManager.AddError(sqlite3_errmsg(db.get()));
        } else {
            return errorManager.AddError("Storage database cannot be opened.");
        }
    }

    int userVersion = 0;
    auto getUserVersionCallback =
        [](void *callbackData, int colomnCount, char **columnTexts, char ** /*columnNames*/) {
            if (colomnCount < 1) {
                return 1;
            }
            *static_cast<int *>(callbackData) = atoi(columnTexts[0]);
            return SQLITE_OK;
        };

    CHECK(
        Exec(db.get(), errorManager, "PRAGMA user_version", getUserVersionCallback, &userVersion));

    if (userVersion == 0) {
        CHECK(Exec(db.get(),
                   errorManager,
                   "CREATE TABLE IF NOT EXISTS AsyncLocalStorage(key TEXT PRIMARY KEY, value TEXT "
                   "NOT NULL); PRAGMA user_version=1"));
    }

    m_db = std::move(db);
    return m_db.get();
}

DBStorage::~DBStorage()
{
    decltype(m_tasks) tasks;
    {
        // If there is an in-progress async task, cancel it and wait on the condition_variable for
        // the async task to acknowledge cancellation by nulling out m_action. Once m_action is
        // null, it is safe to proceed with closing the DB connection. The DB connection is closed
        // by the m_db destructor.
        winrt::slim_lock_guard guard{m_lock};
        swap(tasks, m_tasks);
        if (m_action) {
            m_action.Cancel();
            m_cv.wait(m_lock, [this]() { return m_action == nullptr; });
        }
    }
}

// Under the lock, add a task to m_tasks and, if no async task is in progress schedule it.
void DBStorage::AddTask(ErrorManager &errorManager,
                        std::function<void(DBStorage::DBTask &task, sqlite3 *db)> &&onRun) noexcept
{
    winrt::slim_lock_guard guard(m_lock);
    m_tasks.push_back(std::make_unique<DBTask>(errorManager, std::move(onRun)));
    if (!m_action) {
        m_action = RunTasks();
    }
}

// On a background thread, while the async task has not been canceled and
// there are more tasks to do, run the tasks. When there are either no more
// tasks or cancellation has been requested, set m_action to null to report
// that and complete the coroutine. N.B., it is important that detecting that
// m_tasks is empty and acknowledging completion is done atomically; otherwise
// there would be a race between the background task detecting m_tasks.empty()
// and AddTask checking the coroutine is running.
winrt::Windows::Foundation::IAsyncAction DBStorage::RunTasks() noexcept
{
    auto cancellationToken = co_await winrt::get_cancellation_token();
    co_await winrt::resume_background();
    for (;;) {
        decltype(m_tasks) tasks;
        sqlite3 *db{nullptr};
        {
            winrt::slim_lock_guard guard(m_lock);
            if (m_tasks.empty()) {
                m_action = nullptr;
                m_cv.notify_all();
                co_return;
            }
            std::swap(tasks, m_tasks);
            db = m_db.get();
        }

        for (auto &task : tasks) {
            if (!cancellationToken()) {
                task->Run(*this, db);
            } else {
                task->Cancel();
            }
        }
    }
}

// Add new Error to the error list.
// Return std::nullopt for convenience to other methods that use std::nullopt to indicate error
// result.
std::nullopt_t DBStorage::ErrorManager::AddError(std::string &&message) noexcept
{
    m_errors.push_back(Error{std::move(message)});
    return std::nullopt;
}

bool DBStorage::ErrorManager::HasErrors() const noexcept
{
    return !m_errors.empty();
}

const std::vector<DBStorage::Error> &DBStorage::ErrorManager::GetErrorList() const noexcept
{
    if (HasErrors()) {
        return m_errors;
    }
    static std::vector<DBStorage::Error> s_unknownError{Error{"Unknown error."}};
    return s_unknownError;
}

DBStorage::Error DBStorage::ErrorManager::GetCombinedError() const noexcept
{
    auto &errors = GetErrorList();
    if (errors.size() == 1) {
        return errors[0];
    }

    std::string combinedMessage;
    for (const auto &error : errors) {
        combinedMessage += error.Message + '\n';
    }
    return Error{std::move(combinedMessage)};
}

DBStorage::DBTask::DBTask(DBStorage::ErrorManager &errorManager,
                          std::function<void(DBTask &task, sqlite3 *db)> &&onRun) noexcept
    : m_errorManager(errorManager), m_onRun(std::move(onRun))
{
}

void DBStorage::DBTask::Run(DBStorage &storage, sqlite3 *db) noexcept
{
    if (!db) {
        // We initialize DB handler on demand to report errors in the task context.
        if (auto res = storage.InitializeStorage(m_errorManager)) {
            db = *res;
        }
    }
    if (db) {
        m_onRun(*this, db);
    }
}

void DBStorage::DBTask::Cancel() noexcept
{
    m_errorManager.AddError("Task is canceled.");
}

std::optional<std::vector<DBStorage::KeyValue>>
DBStorage::DBTask::MultiGet(sqlite3 *db, const std::vector<std::string> &keys) noexcept
{
    CHECK(!m_errorManager.HasErrors());
    CHECK(CheckArgs(db, m_errorManager, keys));

    auto argCount = static_cast<int>(keys.size());
    auto sql = MakeSQLiteParameterizedStatement(
        "SELECT key, value FROM AsyncLocalStorage WHERE key IN ", argCount);
    auto statement = StatementPtr{nullptr, &sqlite3_finalize};
    CHECK_SQL_OK(PrepareStatement(db, sql, &statement));
    for (int i = 0; i < argCount; i++) {
        CHECK_SQL_OK(BindString(statement, i + 1, keys[i]));
    }

    std::vector<DBStorage::KeyValue> result;
    for (;;) {
        auto stepResult = sqlite3_step(statement.get());
        if (stepResult == SQLITE_DONE) {
            break;
        }
        if (stepResult != SQLITE_ROW) {
            return m_errorManager.AddError(sqlite3_errmsg(db));
        }

        auto key = reinterpret_cast<const char *>(sqlite3_column_text(statement.get(), 0));
        if (!key) {
            return m_errorManager.AddError(sqlite3_errmsg(db));
        }
        auto value = reinterpret_cast<const char *>(sqlite3_column_text(statement.get(), 1));
        if (!value) {
            return m_errorManager.AddError(sqlite3_errmsg(db));
        }
        result.push_back(KeyValue{key, value});
    }
    return result;
}

std::optional<bool> DBStorage::DBTask::MultiSet(sqlite3 *db,
                                                const std::vector<KeyValue> &keyValues) noexcept
{
    CHECK(!m_errorManager.HasErrors());
    if (keyValues.empty()) {
        return true;  // nothing to do
    }

    Sqlite3Transaction transaction(db, m_errorManager);
    CHECK(transaction);
    auto statement = StatementPtr{nullptr, &sqlite3_finalize};
    CHECK_SQL_OK(
        PrepareStatement(db, "INSERT OR REPLACE INTO AsyncLocalStorage VALUES(?, ?)", &statement));
    for (const auto &keyValue : keyValues) {
        CHECK_SQL_OK(BindString(statement, 1, keyValue.Key));
        CHECK_SQL_OK(BindString(statement, 2, keyValue.Value));
        auto rc = sqlite3_step(statement.get());
        CHECK(rc == SQLITE_DONE || CheckSQLiteResult(db, m_errorManager, rc));
        CHECK_SQL_OK(sqlite3_reset(statement.get()));
    }
    CHECK(transaction.Commit());
    return true;
}

std::optional<bool> DBStorage::DBTask::MultiMerge(sqlite3 *db,
                                                  const std::vector<KeyValue> &keyValues) noexcept
{
    CHECK(!m_errorManager.HasErrors());

    std::vector<std::string> keys;
    std::unordered_map<std::string, std::string> newValues;
    keys.reserve(keyValues.size());
    for (const auto &keyValue : keyValues) {
        keys.push_back(keyValue.Key);
        newValues.try_emplace(keyValue.Key, keyValue.Value);
    }

    auto oldValues = MultiGet(db, keys);
    CHECK(oldValues);

    std::vector<KeyValue> mergedResults;
    for (size_t i = 0; i < oldValues->size(); i++) {
        auto &key = oldValues->at(i).Key;
        auto &oldValue = oldValues->at(i).Value;
        auto &newValue = newValues[key];

        winrt::JsonObject oldJson;
        winrt::JsonObject newJson;
        if (winrt::JsonObject::TryParse(winrt::to_hstring(oldValue), oldJson) &&
            winrt::JsonObject::TryParse(winrt::to_hstring(newValue), newJson)) {
            MergeJsonObjects(oldJson, newJson);
            mergedResults.push_back(KeyValue{key, winrt::to_string(oldJson.ToString())});
        } else {
            return m_errorManager.AddError("Values must be valid JSON object strings");
        }
    }

    return MultiSet(db, mergedResults);
}

std::optional<bool> DBStorage::DBTask::MultiRemove(sqlite3 *db,
                                                   const std::vector<std::string> &keys) noexcept
{
    CHECK(!m_errorManager.HasErrors());
    CHECK(CheckArgs(db, m_errorManager, keys));
    auto argCount = static_cast<int>(keys.size());
    auto sql =
        MakeSQLiteParameterizedStatement("DELETE FROM AsyncLocalStorage WHERE key IN ", argCount);
    auto statement = StatementPtr{nullptr, &sqlite3_finalize};
    CHECK_SQL_OK(PrepareStatement(db, sql, &statement));
    for (int i = 0; i < argCount; i++) {
        CHECK_SQL_OK(BindString(statement, i + 1, keys[i]));
    }
    for (;;) {
        auto stepResult = sqlite3_step(statement.get());
        if (stepResult == SQLITE_DONE) {
            break;
        }
        if (stepResult != SQLITE_ROW) {
            return m_errorManager.AddError(sqlite3_errmsg(db));
        }
    }
    return true;
}

std::optional<std::vector<std::string>> DBStorage::DBTask::GetAllKeys(sqlite3 *db) noexcept
{
    CHECK(!m_errorManager.HasErrors());
    std::vector<std::string> result;
    auto getAllKeysCallback = [&](int columnCount, char **columnTexts, char **) {
        if (columnCount > 0) {
            result.emplace_back(columnTexts[0]);
        }
        return SQLITE_OK;
    };

    CHECK(Exec(db, m_errorManager, "SELECT key FROM AsyncLocalStorage", getAllKeysCallback));
    return result;
}

std::optional<bool> DBStorage::DBTask::RemoveAll(sqlite3 *db) noexcept
{
    CHECK(!m_errorManager.HasErrors());
    CHECK(Exec(db, m_errorManager, "DELETE FROM AsyncLocalStorage"));
    return true;
}

// Read KeyValue from a JSON array.
void ReadValue(const winrt::IJSValueReader &reader,
               /*out*/ DBStorage::KeyValue &value) noexcept
{
    if (reader.ValueType() == winrt::JSValueType::Array) {
        int index = 0;
        while (reader.GetNextArrayItem()) {
            if (index == 0) {
                ReadValue(reader, value.Key);
            } else if (index == 1) {
                ReadValue(reader, value.Value);
            } else {
                // Read the array till the end to keep reader in a good state.
                winrt::SkipValue<winrt::JSValue>(reader);
            }
            ++index;
        }
    } else {
        // To keep reader in a good state.
        winrt::SkipValue<winrt::JSValue>(reader);
    }
}

// Write KeyValue to a JSON array.
void WriteValue(const winrt::Microsoft::ReactNative::IJSValueWriter &writer,
                const DBStorage::KeyValue &value) noexcept
{
    writer.WriteArrayBegin();
    WriteValue(writer, value.Key);
    WriteValue(writer, value.Value);
    writer.WriteArrayEnd();
}

// Write Error object to JSON.
void WriteValue(const winrt::IJSValueWriter &writer, const DBStorage::Error &value) noexcept
{
    writer.WriteObjectBegin();
    winrt::WriteProperty(writer, L"message", value.Message);
    writer.WriteObjectEnd();
}
