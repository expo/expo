package abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import abi48_0_0.com.facebook.react.bridge.*
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.*
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createMissingActivityError
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapFromToken
import com.stripe.android.financialconnections.FinancialConnectionsSheet
import com.stripe.android.financialconnections.FinancialConnectionsSheetForTokenResult
import com.stripe.android.financialconnections.FinancialConnectionsSheetResult
import com.stripe.android.financialconnections.model.*

class FinancialConnectionsSheetFragment : Fragment() {
  enum class Mode {
    ForToken, ForSession
  }

  private lateinit var promise: Promise
  private lateinit var context: ReactApplicationContext
  private lateinit var configuration: FinancialConnectionsSheet.Configuration
  private lateinit var mode: Mode

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View {
    return FrameLayout(requireActivity()).also {
      it.visibility = View.GONE
    }
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    when (mode) {
      Mode.ForToken -> {
        FinancialConnectionsSheet.createForBankAccountToken(
          this,
          ::onFinancialConnectionsSheetForTokenResult
        ).present(
          configuration = configuration
        )
      }
      Mode.ForSession -> {
        FinancialConnectionsSheet.create(
          this,
          ::onFinancialConnectionsSheetForDataResult
        ).present(
          configuration = configuration
        )
      }
    }
  }

  private fun onFinancialConnectionsSheetForTokenResult(result: FinancialConnectionsSheetForTokenResult) {
    when (result) {
      is FinancialConnectionsSheetForTokenResult.Canceled -> {
        promise.resolve(
          createError(ErrorType.Canceled.toString(), "The flow has been canceled")
        )
      }
      is FinancialConnectionsSheetForTokenResult.Failed -> {
        promise.resolve(
          createError(ErrorType.Failed.toString(), result.error)
        )
      }
      is FinancialConnectionsSheetForTokenResult.Completed -> {
        promise.resolve(createTokenResult(result))
        (context.currentActivity as? FragmentActivity)?.supportFragmentManager?.beginTransaction()?.remove(this)?.commitAllowingStateLoss()
      }
    }
  }

  private fun onFinancialConnectionsSheetForDataResult(result: FinancialConnectionsSheetResult) {
    when (result) {
      is FinancialConnectionsSheetResult.Canceled -> {
        promise.resolve(
          createError(ErrorType.Canceled.toString(), "The flow has been canceled")
        )
      }
      is FinancialConnectionsSheetResult.Failed -> {
        promise.resolve(
          createError(ErrorType.Failed.toString(), result.error)
        )
      }
      is FinancialConnectionsSheetResult.Completed -> {
        promise.resolve(
          WritableNativeMap().also {
            it.putMap("session", mapFromSession(result.financialConnectionsSession))
          }
        )
        (context.currentActivity as? FragmentActivity)?.supportFragmentManager?.beginTransaction()?.remove(this)?.commitAllowingStateLoss()
      }
    }
  }

  fun presentFinancialConnectionsSheet(clientSecret: String, mode: Mode, publishableKey: String, stripeAccountId: String?, promise: Promise, context: ReactApplicationContext) {
    this.promise = promise
    this.context = context
    this.mode = mode
    this.configuration = FinancialConnectionsSheet.Configuration(
      financialConnectionsSessionClientSecret = clientSecret,
      publishableKey = publishableKey,
      stripeAccountId = stripeAccountId,
    )

    (context.currentActivity as? FragmentActivity)?.let {
      attemptToCleanupPreviousFragment(it)
      commitFragmentAndStartFlow(it)
    } ?: run {
      promise.resolve(createMissingActivityError())
      return
    }
  }

  private fun attemptToCleanupPreviousFragment(currentActivity: FragmentActivity) {
    currentActivity.supportFragmentManager.beginTransaction()
      .remove(this)
      .commitAllowingStateLoss()
  }

  private fun commitFragmentAndStartFlow(currentActivity: FragmentActivity) {
    try {
      currentActivity.supportFragmentManager.beginTransaction()
        .add(this, TAG)
        .commit()
    } catch (error: IllegalStateException) {
      promise.resolve(createError(ErrorType.Failed.toString(), error.message))
    }
  }

  companion object {
    internal const val TAG = "financial_connections_sheet_launch_fragment"

    private fun createTokenResult(result: FinancialConnectionsSheetForTokenResult.Completed): WritableMap {
      return WritableNativeMap().also {
        it.putMap("session", mapFromSession(result.financialConnectionsSession))
        it.putMap("token", mapFromToken(result.token))
      }
    }

    private fun mapFromSession(financialConnectionsSession: FinancialConnectionsSession): WritableMap {
      val session = WritableNativeMap()
      session.putString("id", financialConnectionsSession.id)
      session.putString("clientSecret", financialConnectionsSession.clientSecret)
      session.putBoolean("livemode", financialConnectionsSession.livemode)
      session.putArray("accounts", mapFromAccountsList(financialConnectionsSession.accounts))
      return session
    }

    private fun mapFromAccountsList(accounts: FinancialConnectionsAccountList): ReadableArray {
      val results: WritableArray = Arguments.createArray()
      for (account in accounts.data) {
        val map = WritableNativeMap()
        map.putString("id", account.id)
        map.putBoolean("livemode", account.livemode)
        map.putString("displayName", account.displayName)
        map.putString("status", mapFromStatus(account.status))
        map.putString("institutionName", account.institutionName)
        map.putString("last4", account.last4)
        map.putDouble("created", account.created * 1000.0)
        map.putMap("balance", mapFromAccountBalance(account.balance))
        map.putMap("balanceRefresh", mapFromAccountBalanceRefresh(account.balanceRefresh))
        map.putString("category", mapFromCategory(account.category))
        map.putString("subcategory", mapFromSubcategory(account.subcategory))
        map.putArray("permissions", (account.permissions?.map { permission -> mapFromPermission(permission) })?.toReadableArray())
        map.putArray("supportedPaymentMethodTypes", (account.supportedPaymentMethodTypes.map { type -> mapFromSupportedPaymentMethodTypes(type) }).toReadableArray())
        results.pushMap(map)
      }
      return results
    }

    private fun mapFromAccountBalance(balance: Balance?): WritableMap? {
      if (balance == null) {
        return null
      }
      val map = WritableNativeMap()
      map.putDouble("asOf", balance.asOf * 1000.0)
      map.putString("type", mapFromBalanceType(balance.type))
      map.putMap("current", balance.current as ReadableMap)
      WritableNativeMap().also {
        it.putMap("available", balance.cash?.available as ReadableMap)
        map.putMap("cash", it)
      }
      WritableNativeMap().also {
        it.putMap("used", balance.credit?.used as ReadableMap)
        map.putMap("credit", it)
      }
      return map
    }

    private fun mapFromAccountBalanceRefresh(balanceRefresh: BalanceRefresh?): WritableMap? {
      if (balanceRefresh == null) {
        return null
      }
      val map = WritableNativeMap()
      map.putString("status", mapFromBalanceRefreshStatus(balanceRefresh.status))
      map.putDouble("lastAttemptedAt", balanceRefresh.lastAttemptedAt * 1000.0)
      return map
    }

    private fun mapFromStatus(status: FinancialConnectionsAccount.Status): String {
      return when (status) {
        FinancialConnectionsAccount.Status.ACTIVE -> "active"
        FinancialConnectionsAccount.Status.DISCONNECTED -> "disconnected"
        FinancialConnectionsAccount.Status.INACTIVE -> "inactive"
        FinancialConnectionsAccount.Status.UNKNOWN -> "unparsable"
      }
    }

    private fun mapFromCategory(category: FinancialConnectionsAccount.Category): String {
      return when (category) {
        FinancialConnectionsAccount.Category.CASH -> "cash"
        FinancialConnectionsAccount.Category.CREDIT -> "credit"
        FinancialConnectionsAccount.Category.INVESTMENT -> "investment"
        FinancialConnectionsAccount.Category.OTHER -> "other"
        FinancialConnectionsAccount.Category.UNKNOWN -> "unparsable"
      }
    }

    private fun mapFromSubcategory(subcategory: FinancialConnectionsAccount.Subcategory): String {
      return when (subcategory) {
        FinancialConnectionsAccount.Subcategory.CHECKING -> "checking"
        FinancialConnectionsAccount.Subcategory.CREDIT_CARD -> "creditCard"
        FinancialConnectionsAccount.Subcategory.LINE_OF_CREDIT -> "lineOfCredit"
        FinancialConnectionsAccount.Subcategory.MORTGAGE -> "mortgage"
        FinancialConnectionsAccount.Subcategory.OTHER -> "other"
        FinancialConnectionsAccount.Subcategory.SAVINGS -> "savings"
        FinancialConnectionsAccount.Subcategory.UNKNOWN -> "unparsable"
      }
    }

    private fun mapFromPermission(permission: FinancialConnectionsAccount.Permissions): String {
      return when (permission) {
        FinancialConnectionsAccount.Permissions.PAYMENT_METHOD -> "paymentMethod"
        FinancialConnectionsAccount.Permissions.BALANCES -> "balances"
        FinancialConnectionsAccount.Permissions.OWNERSHIP -> "ownership"
        FinancialConnectionsAccount.Permissions.TRANSACTIONS -> "transactions"
        FinancialConnectionsAccount.Permissions.ACCOUNT_NUMBERS -> "accountNumbers"
        FinancialConnectionsAccount.Permissions.UNKNOWN -> "unparsable"
        FinancialConnectionsAccount.Permissions.ACCOUNT_NUMBERS -> "accountNumbers"
      }
    }

    private fun mapFromSupportedPaymentMethodTypes(type: FinancialConnectionsAccount.SupportedPaymentMethodTypes): String {
      return when (type) {
        FinancialConnectionsAccount.SupportedPaymentMethodTypes.US_BANK_ACCOUNT -> "usBankAccount"
        FinancialConnectionsAccount.SupportedPaymentMethodTypes.LINK -> "link"
        FinancialConnectionsAccount.SupportedPaymentMethodTypes.UNKNOWN -> "unparsable"
      }
    }

    private fun mapFromBalanceType(type: Balance.Type): String {
      return when (type) {
        Balance.Type.CASH -> "cash"
        Balance.Type.CREDIT -> "credit"
        Balance.Type.UNKNOWN -> "unparsable"
      }
    }

    private fun mapFromBalanceRefreshStatus(status: BalanceRefresh.BalanceRefreshStatus?): String {
      return when (status) {
        BalanceRefresh.BalanceRefreshStatus.SUCCEEDED -> "succeeded"
        BalanceRefresh.BalanceRefreshStatus.FAILED -> "failed"
        BalanceRefresh.BalanceRefreshStatus.PENDING -> "pending"
        BalanceRefresh.BalanceRefreshStatus.UNKNOWN -> "unparsable"
        null -> "null"
      }
    }
  }
}

fun List<String>.toReadableArray(): ReadableArray {
  val results: WritableArray = Arguments.createArray()
  for (s in this) {
    results.pushString(s)
  }
  return results
}
