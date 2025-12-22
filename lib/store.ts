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
    recurringType?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    recurringInterval?: number
}

export interface Category {
    id: string
    name: string
    icon: string
    color: string
    type?: TransactionType
    group?: string
}

export type ThemePreference = 'system' | 'light' | 'dark'

export interface Preferences {
    theme: ThemePreference
    appLockEnabled: boolean
    lastAccountId?: string
    passcode?: string
    language: 'zh' | 'en'
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
    setLanguage: (lang: 'zh' | 'en') => void

    // Computed helpers
    getAccountBalance: (accountId: string) => number
}

const DEFAULT_CATEGORIES: Category[] = [
    // 餐饮美食
    { id: '1', name: '餐饮美食', icon: 'utensils', color: '#ef4444', group: '餐饮美食', type: 'EXPENSE' },
    { id: '2', name: '早餐/午餐/晚餐', icon: 'sandwich', color: '#f97316', group: '餐饮美食', type: 'EXPENSE' },
    { id: '3', name: '饮料水果', icon: 'cup-soda', color: '#f59e0b', group: '餐饮美食', type: 'EXPENSE' },
    { id: '4', name: '零食烟酒', icon: 'wine', color: '#e11d48', group: '餐饮美食', type: 'EXPENSE' },
    { id: '5', name: '买菜食材', icon: 'shopping-basket', color: '#22c55e', group: '餐饮美食', type: 'EXPENSE' },
    { id: '6', name: '外卖', icon: 'bike', color: '#ef4444', group: '餐饮美食', type: 'EXPENSE' },

    // 交通出行
    { id: '7', name: '公共交通', icon: 'tram-front', color: '#3b82f6', group: '交通出行', type: 'EXPENSE' },
    { id: '8', name: '打车/网约车', icon: 'car', color: '#2563eb', group: '交通出行', type: 'EXPENSE' },
    { id: '9', name: '私家车', icon: 'fuel', color: '#1d4ed8', group: '交通出行', type: 'EXPENSE' },
    { id: '10', name: '共享单车', icon: 'bike', color: '#38bdf8', group: '交通出行', type: 'EXPENSE' },
    { id: '11', name: '长途出行', icon: 'plane', color: '#0ea5e9', group: '交通出行', type: 'EXPENSE' },

    // 购物消费
    { id: '12', name: '服饰鞋包', icon: 'shirt', color: '#ec4899', group: '购物消费', type: 'EXPENSE' },
    { id: '13', name: '护肤美妆', icon: 'sparkles', color: '#f472b6', group: '购物消费', type: 'EXPENSE' },
    { id: '14', name: '日用百货', icon: 'shopping-bag', color: '#8b5cf6', group: '购物消费', type: 'EXPENSE' },
    { id: '15', name: '数码家电', icon: 'cpu', color: '#a855f7', group: '购物消费', type: 'EXPENSE' },
    { id: '16', name: '家居家纺', icon: 'lamp', color: '#f97316', group: '购物消费', type: 'EXPENSE' },
    { id: '17', name: '虚拟商品', icon: 'gamepad-2', color: '#22d3ee', group: '购物消费', type: 'EXPENSE' },

    // 居住缴费
    { id: '18', name: '房租/房贷', icon: 'home', color: '#f59e0b', group: '居住缴费', type: 'EXPENSE' },
    { id: '19', name: '水电燃气', icon: 'flame', color: '#f97316', group: '居住缴费', type: 'EXPENSE' },
    { id: '20', name: '物业费', icon: 'building-2', color: '#d97706', group: '居住缴费', type: 'EXPENSE' },
    { id: '21', name: '通讯网费', icon: 'wifi', color: '#0ea5e9', group: '居住缴费', type: 'EXPENSE' },
    { id: '22', name: '维修家政', icon: 'wrench', color: '#6b7280', group: '居住缴费', type: 'EXPENSE' },

    // 休闲娱乐
    { id: '23', name: '聚会请客', icon: 'glass-water', color: '#a855f7', group: '休闲娱乐', type: 'EXPENSE' },
    { id: '24', name: '电影演出', icon: 'clapperboard', color: '#6366f1', group: '休闲娱乐', type: 'EXPENSE' },
    { id: '25', name: '运动健身', icon: 'dumbbell', color: '#22c55e', group: '休闲娱乐', type: 'EXPENSE' },
    { id: '26', name: '休闲玩乐', icon: 'gamepad-2', color: '#0ea5e9', group: '休闲娱乐', type: 'EXPENSE' },
    { id: '27', name: '旅游度假', icon: 'luggage', color: '#10b981', group: '休闲娱乐', type: 'EXPENSE' },

    // 医疗教育
    { id: '28', name: '药品医疗', icon: 'stethoscope', color: '#14b8a6', group: '医疗教育', type: 'EXPENSE' },
    { id: '29', name: '商业保险', icon: 'shield-check', color: '#0f172a', group: '医疗教育', type: 'EXPENSE' },
    { id: '30', name: '书籍资料', icon: 'book-open', color: '#f97316', group: '医疗教育', type: 'EXPENSE' },
    { id: '31', name: '课程培训', icon: 'graduation-cap', color: '#2563eb', group: '医疗教育', type: 'EXPENSE' },
    { id: '32', name: '学费', icon: 'school', color: '#38bdf8', group: '医疗教育', type: 'EXPENSE' },

    // 人情往来 / 其他
    { id: '33', name: '送礼请客', icon: 'gift', color: '#ec4899', group: '人情往来', type: 'EXPENSE' },
    { id: '34', name: '红包/份子', icon: 'party-popper', color: '#fb7185', group: '人情往来', type: 'EXPENSE' },
    { id: '35', name: '孝敬长辈', icon: 'hand-heart', color: '#f472b6', group: '人情往来', type: 'EXPENSE' },
    { id: '36', name: '借出', icon: 'hand-coins', color: '#f59e0b', group: '人情往来', type: 'EXPENSE' },
    { id: '37', name: '慈善捐款', icon: 'hand-heart', color: '#ef4444', group: '人情往来', type: 'EXPENSE' },
    { id: '38', name: '宠物费用', icon: 'paw-print', color: '#f59e0b', group: '其他', type: 'EXPENSE' },
    { id: '39', name: '意外丢失', icon: 'alert-circle', color: '#f87171', group: '其他', type: 'EXPENSE' },
    { id: '40', name: '手续费', icon: 'receipt', color: '#6b7280', group: '其他', type: 'EXPENSE' },
    { id: '41', name: '坏账/遗忘', icon: 'help-circle', color: '#9ca3af', group: '其他', type: 'EXPENSE' },

    // 收入
    { id: '42', name: '工资收入', icon: 'badge-dollar-sign', color: '#22c55e', group: '收入', type: 'INCOME' },
    { id: '43', name: '奖金补贴', icon: 'medal', color: '#84cc16', group: '收入', type: 'INCOME' },
    { id: '44', name: '兼职副业', icon: 'briefcase', color: '#0ea5e9', group: '收入', type: 'INCOME' },
    { id: '45', name: '理财收益', icon: 'piggy-bank', color: '#10b981', group: '收入', type: 'INCOME' },
    { id: '46', name: '礼金收入', icon: 'party-popper', color: '#ec4899', group: '收入', type: 'INCOME' },
    { id: '47', name: '退款报销', icon: 'rotate-ccw', color: '#f97316', group: '收入', type: 'INCOME' },
    { id: '48', name: '借入', icon: 'wallet', color: '#06b6d4', group: '收入', type: 'INCOME' },
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
                language: 'zh',
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

            setLanguage: (language) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    language,
                }
            })),

            getAccountBalance: (accountId) => {
                return get().accounts.find(a => a.id === accountId)?.balance || 0
            }
        }),
        {
            name: 'expense-tracker-storage',
            version: 1,
            migrate: (persistedState) => {
                const state = persistedState as AppState
                if (!state?.categories) return state

                const defaultsById = new Map(DEFAULT_CATEGORIES.map((cat) => [cat.id, cat]))
                const categories = state.categories.map((cat) => {
                    const defaults = defaultsById.get(cat.id)
                    if (!defaults) return cat
                    return {
                        ...cat,
                        name: defaults.name,
                        group: defaults.group,
                        type: defaults.type ?? cat.type,
                    }
                })

                return { ...state, categories }
            },
        }
    )
)

