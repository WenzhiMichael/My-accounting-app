import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export type AccountType = 'BANK' | 'CREDIT' | 'CASH'

export interface Account {
    id: string
    name: string
    type: AccountType
    balance: number
    // Credit Card specific
    limit?: number
    billingDay?: number // 1-31
    dueDay?: number // 1-31
    color: string
}

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

export interface Transaction {
    id: string
    amount: number
    type: TransactionType
    accountId: string
    targetAccountId?: string // For transfers
    categoryId: string
    date: string // ISO date string
    note?: string
}

export interface Category {
    id: string
    name: string
    icon: string
    color: string
}

export type ThemePreference = 'system' | 'light' | 'dark'

export interface Preferences {
    theme: ThemePreference
    appLockEnabled: boolean
    lastAccountId?: string
    passcode?: string
}

interface AppState {
    accounts: Account[]
    transactions: Transaction[]
    categories: Category[]
    preferences: Preferences

    addAccount: (account: Omit<Account, 'id'>) => void
    updateAccount: (id: string, updates: Partial<Account>) => void
    deleteAccount: (id: string) => void

    addTransaction: (transaction: Omit<Transaction, 'id'>) => void
    updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void
    deleteTransaction: (id: string) => void

    setTheme: (theme: ThemePreference) => void
    setAppLockEnabled: (enabled: boolean) => void
    setLastAccountId: (accountId?: string) => void
    setPasscode: (passcode?: string) => void

    // Computed helpers
    getAccountBalance: (accountId: string) => number
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Food', icon: 'Utensils', color: '#ef4444' },
    { id: '2', name: 'Transport', icon: 'Car', color: '#3b82f6' },
    { id: '3', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
    { id: '4', name: 'Entertainment', icon: 'Film', color: '#8b5cf6' },
    { id: '5', name: 'Bills', icon: 'Receipt', color: '#f59e0b' },
    { id: '6', name: 'Health', icon: 'Heart', color: '#10b981' },
]

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            accounts: [],
            transactions: [],
            categories: DEFAULT_CATEGORIES,
            preferences: {
                theme: 'system',
                appLockEnabled: false,
                lastAccountId: undefined,
                passcode: undefined,
            },

            addAccount: (account) => set((state) => ({
                accounts: [...state.accounts, { ...account, id: uuidv4() }]
            })),

            updateAccount: (id, updates) => set((state) => ({
                accounts: state.accounts.map((acc) =>
                    acc.id === id ? { ...acc, ...updates } : acc
                )
            })),

            deleteAccount: (id) => set((state) => ({
                accounts: state.accounts.filter((acc) => acc.id !== id)
            })),

            addTransaction: (transaction) => set((state) => {
                const newTransaction = { ...transaction, id: uuidv4() }

                // Update account balances
                const accounts = state.accounts.map(acc => ({ ...acc }))
                const accountIndex = accounts.findIndex(a => a.id === transaction.accountId)

                if (accountIndex >= 0) {
                    const account = accounts[accountIndex]
                    if (transaction.type === 'EXPENSE') {
                        account.balance -= transaction.amount
                    } else if (transaction.type === 'INCOME') {
                        account.balance += transaction.amount
                    } else if (transaction.type === 'TRANSFER' && transaction.targetAccountId) {
                        account.balance -= transaction.amount
                        const targetIndex = accounts.findIndex(a => a.id === transaction.targetAccountId)
                        if (targetIndex >= 0) {
                            accounts[targetIndex].balance += transaction.amount
                        }
                    }
                }

                return {
                    transactions: [newTransaction, ...state.transactions],
                    accounts,
                    preferences: {
                        ...state.preferences,
                        lastAccountId: transaction.accountId,
                    }
                }
            }),

            updateTransaction: (id, updates) => set((state) => {
                const existingIndex = state.transactions.findIndex(t => t.id === id)
                if (existingIndex === -1) return {}

                const current = state.transactions[existingIndex]
                const nextTx = {
                    ...current,
                    ...updates,
                    targetAccountId: updates.type === 'TRANSFER' || current.type === 'TRANSFER'
                        ? updates.targetAccountId ?? current.targetAccountId
                        : undefined,
                }

                const accounts = state.accounts.map(acc => ({ ...acc }))

                const applyBalances = (tx: Transaction, multiplier: 1 | -1) => {
                    const sourceIndex = accounts.findIndex(a => a.id === tx.accountId)
                    if (sourceIndex >= 0) {
                        const source = accounts[sourceIndex]
                        if (tx.type === 'EXPENSE') {
                            source.balance -= multiplier * tx.amount
                        } else if (tx.type === 'INCOME') {
                            source.balance += multiplier * tx.amount
                        } else if (tx.type === 'TRANSFER' && tx.targetAccountId) {
                            source.balance -= multiplier * tx.amount
                            const targetIndex = accounts.findIndex(a => a.id === tx.targetAccountId)
                            if (targetIndex >= 0) {
                                accounts[targetIndex].balance += multiplier * tx.amount
                            }
                        }
                    }
                }

                applyBalances(current, -1)
                applyBalances(nextTx as Transaction, 1)

                const transactions = [...state.transactions]
                transactions[existingIndex] = nextTx as Transaction

                return { transactions, accounts }
            }),

            deleteTransaction: (id) => set((state) => {
                const tx = state.transactions.find(t => t.id === id)
                if (!tx) return {}

                // Revert balance changes
                const accounts = state.accounts.map(acc => ({ ...acc }))
                const accountIndex = accounts.findIndex(a => a.id === tx.accountId)

                if (accountIndex >= 0) {
                    const account = accounts[accountIndex]
                    if (tx.type === 'EXPENSE') {
                        account.balance += tx.amount
                    } else if (tx.type === 'INCOME') {
                        account.balance -= tx.amount
                    } else if (tx.type === 'TRANSFER' && tx.targetAccountId) {
                        account.balance += tx.amount
                        const targetIndex = accounts.findIndex(a => a.id === tx.targetAccountId)
                        if (targetIndex >= 0) {
                            accounts[targetIndex].balance -= tx.amount
                        }
                    }
                }

                return {
                    transactions: state.transactions.filter(t => t.id !== id),
                    accounts
                }
            }),

            setTheme: (theme) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    theme,
                }
            })),

            setAppLockEnabled: (enabled) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    appLockEnabled: enabled,
                }
            })),

            setLastAccountId: (accountId) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    lastAccountId: accountId,
                }
            })),

            setPasscode: (passcode) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    passcode,
                }
            })),

            getAccountBalance: (accountId) => {
                return get().accounts.find(a => a.id === accountId)?.balance || 0
            }
        }),
        {
            name: 'expense-tracker-storage',
        }
    )
)
