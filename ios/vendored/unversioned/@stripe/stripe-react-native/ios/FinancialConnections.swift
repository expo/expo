//
//  FinancialConnections.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 7/12/22.
//

import Foundation
import StripeFinancialConnections
import Stripe

class FinancialConnections {

    internal static func present(
        withClientSecret: String,
        returnURL: String? = nil,
        resolve: @escaping RCTPromiseResolveBlock
    ) -> Void {
        DispatchQueue.main.async {
            FinancialConnectionsSheet(financialConnectionsSessionClientSecret: withClientSecret, returnURL: returnURL).present(
              from: findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController()),
              completion: { result in
                  switch result {
                  case .completed(session: let session):
                      resolve([ "session": mapFromSessionResult(session) ])
                  case .canceled:
                      resolve(Errors.createError(ErrorType.Canceled, "The flow has been canceled."))
                  case .failed(let error):
                      resolve(Errors.createError(ErrorType.Failed, error))
                  }
            })
        }
    }

    internal static func presentForToken(
        withClientSecret: String,
        returnURL: String? = nil,
        resolve: @escaping RCTPromiseResolveBlock
    ) -> Void {
        DispatchQueue.main.async {
            FinancialConnectionsSheet(financialConnectionsSessionClientSecret: withClientSecret, returnURL: returnURL).presentForToken(
              from: findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController()),
              completion: { result in
                  switch result {
                  case .completed(result: let result):
                      resolve(
                        [
                            "session": mapFromSessionResult(result.session),
                            "token"  : mapFromTokenResult(result.token)
                        ]
                      )
                  case .canceled:
                      resolve(Errors.createError(ErrorType.Canceled, "The flow has been canceled."))
                  case .failed(let error):
                      resolve(Errors.createError(ErrorType.Failed, error))
                  }
            })
        }
    }

    internal static func mapFromSessionResult(
        _ session: StripeAPI.FinancialConnectionsSession
    ) -> NSDictionary {
        return [
            "id": session.id,
            "clientSecret": session.clientSecret,
            "livemode": session.livemode,
            "accounts": mapFromAccountsList(accounts: session.accounts)
        ]
    }

    internal static func mapFromTokenResult(
        _ token: StripeAPI.BankAccountToken?
    ) -> NSDictionary {
        return [
            "bankAccount": mapFromBankAccount(bankAccount: token?.bankAccount) ?? NSNull(),
            "livemode": token?.livemode ?? false,
            "id": token?.id ?? NSNull(),
            "used": token?.used ?? false,
            "type": Mappers.mapFromTokenType(STPTokenType.bankAccount) ?? NSNull(),
            "created": NSNull(), // Doesn't exist on StripeAPI.BankAccountToken
        ]
    }

    internal static func mapFromBankAccount(
        bankAccount: StripeAPI.BankAccountToken.BankAccount?
    ) -> NSDictionary? {
        guard let bankAccount = bankAccount else {
            return nil
        }
        // return Mappers.mapFromBankAccount(bankAccount) Cannot use this since it expects an STPBankAccount
        return [
            "id": bankAccount.id,
            "bankName": bankAccount.bankName ?? NSNull(),
            "accountHolderName": bankAccount.accountHolderName ?? NSNull(),
            "accountHolderType": NSNull(), // Doesn't exist on StripeAPI.BankAccountToken
            "currency": bankAccount.currency,
            "country": bankAccount.country,
            "routingNumber": bankAccount.routingNumber ?? NSNull(),
            "fingerprint": bankAccount.fingerprint ?? NSNull(),
            "last4": bankAccount.last4,
            "status": bankAccount.status.prefix(1).uppercased() + bankAccount.status.lowercased().dropFirst(), // stripe-ios returns a string, not STPBankAccountStatus
        ]
    }

    internal static func mapFromAccountsList(
        accounts: StripeAPI.FinancialConnectionsSession.AccountList
    ) -> [[String: Any]] {
        var result = [[String: Any]]()

        for account in accounts.data {
            result.append([
                "id": account.id,
                "livemode": account.livemode,
                "displayName": account.displayName ?? NSNull(),
                "status": mapFromStatus(account.status),
                "institutionName": account.institutionName,
                "last4": account.last4 ?? NSNull(),
                "created": account.created * 1000,
                "balance": mapFromAccountBalance(balance: account.balance) ?? NSNull(),
                "balanceRefresh": mapFromAccountBalanceRefresh(balanceRefresh: account.balanceRefresh) ?? NSNull(),
                "category": mapFromCategory(account.category),
                "subcategory": mapFromSubcategory(account.subcategory),
                "permissions": account.permissions?.map { mapFromPermission($0) } ?? NSNull(),
                "supportedPaymentMethodTypes": account.supportedPaymentMethodTypes.map { mapFromSupportedPaymentMethodTypes($0) },
            ])
        }

        return result
    }

    internal static func mapFromAccountBalance(
        balance: StripeAPI.FinancialConnectionsAccount.Balance?
    ) -> NSDictionary? {
        guard let balance = balance else {
            return nil
        }

        return [
            "asOf": balance.asOf * 1000,
            "type": mapFromBalanceType(balance.type),
            "cash": ["available": balance.cash?.available],
            "credit": ["used": balance.credit?.used],
            "current": balance.current,
        ]
    }

    internal static func mapFromAccountBalanceRefresh(
        balanceRefresh: StripeAPI.FinancialConnectionsAccount.BalanceRefresh?
    ) -> NSDictionary? {
        guard let balanceRefresh = balanceRefresh else {
            return nil
        }

        return [
            "status": mapFromBalanceRefreshStatus(balanceRefresh.status),
            "lastAttemptedAt": balanceRefresh.lastAttemptedAt * 1000,
        ]
    }

    internal static func mapFromStatus( _ status: StripeAPI.FinancialConnectionsAccount.Status) -> String {
        switch status {
        case .active:
            return "active"
        case .inactive:
            return "inactive"
        case .disconnected:
            return "disconnected"
        case .unparsable:
            return "unparsable"
        }
    }

    internal static func mapFromCategory( _ category: StripeAPI.FinancialConnectionsAccount.Category) -> String {
        switch category {
        case .cash:
            return "cash"
        case .credit:
            return "credit"
        case .investment:
            return "investment"
        case .other:
            return "other"
        case .unparsable:
            return "unparsable"
        }
    }

    internal static func mapFromSubcategory( _ subcategory: StripeAPI.FinancialConnectionsAccount.Subcategory) -> String {
        switch subcategory {
        case .savings:
            return "savings"
        case .mortgage:
            return "mortgage"
        case .checking:
            return "checking"
        case .creditCard:
            return "creditCard"
        case .lineOfCredit:
            return "lineOfCredit"
        case .other:
            return "other"
        case .unparsable:
            return "unparsable"
        }
    }

    internal static func mapFromPermission( _ permission: StripeAPI.FinancialConnectionsAccount.Permissions) -> String {
        switch permission {
        case .transactions:
            return "transactions"
        case .ownership:
            return "ownership"
        case .paymentMethod:
            return "paymentMethod"
        case .accountNumbers:
            return "accountNumbers"
        case .balances:
            return "balances"
        case .unparsable:
            return "unparsable"
        }
    }

    internal static func mapFromSupportedPaymentMethodTypes( _ type: StripeAPI.FinancialConnectionsAccount.SupportedPaymentMethodTypes) -> String {
        switch type {
        case .usBankAccount:
            return "usBankAccount"
        case .link:
            return "link"
        case .unparsable:
            return "unparsable"
        }
    }

    internal static func mapFromBalanceType( _ type: StripeAPI.FinancialConnectionsAccount.Balance.ModelType) -> String {
        switch type {
        case .cash:
            return "cash"
        case .credit:
            return "credit"
        case .unparsable:
            return "unparsable"
        }
    }

    internal static func mapFromBalanceRefreshStatus( _ status: StripeAPI.FinancialConnectionsAccount.BalanceRefresh.Status) -> String {
        switch status {
        case .succeeded:
            return "succeeded"
        case .pending:
            return "pending"
        case .failed:
            return "failed"
        case .unparsable:
            return "unparsable"
        }
    }
}
