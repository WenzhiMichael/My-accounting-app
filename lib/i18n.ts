
import { useStore } from './store'

export type Language = 'zh' | 'en'

export const translations = {
    en: {
        // Navigation & Common
        overview: 'Overview',
        transactions: 'Transactions',
        accounts: 'Accounts',
        settings: 'Settings',
        add: 'Add',
        back: 'Back',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',

        // Dashboard
        week: 'Week',
        month: 'Month',
        total_balance: 'Total Balance',
        income: 'Income',
        expense: 'Expense',
        spending_trend: 'Spending trend',
        last_6_months: 'Last 6 months',
        add_expenses_trend: 'Add expenses to see your trend.',
        all_expenses: 'All Expenses',
        all_income: 'All Income',
        category_breakdown: 'Category breakdown',
        expenses_only: 'Expenses only',
        add_expense_chart: 'Add an expense to see your chart.',
        recent_transactions: 'Recent Transactions',
        no_transactions: 'No transactions yet',
        accounts_this_period: 'Accounts this {{period}}',
        net_worth: 'Net worth',
        no_spending: 'No spending tracked this {{period}}.',
        spend_this_period: 'Spend this {{period}}',

        // Credit Cards
        credit_cards: 'Credit Cards',
        manage: 'Manage',
        no_credit_cards: 'No credit cards added',
        add_card: 'Add Card',
        bill_day: 'Bill Day',
        due_day: 'Due',
        balance: 'Balance',
        used: 'Used',
        limit: 'Limit',

        // Settings
        language: 'Language',
        theme: 'Theme',
        security: 'Security',
        app_lock: 'App Lock',
        passcode: 'Passcode',
        data_management: 'Data Management',
        export_data: 'Export Data',
        import_data: 'Import Data',

        // Accounts
        no_accounts: 'No accounts yet',
        add_account: 'Add Account',
        add_first_account: 'Add your first bank card or cash account.',
        account_type_CREDIT: 'Credit Card',
        account_type_CASH: 'Cash',
        account_type_BANK: 'Bank Account',

        // Validation
        missing_amount: 'Missing amount',
        choose_category: 'Choose a category',
        select_account: 'Select an account',
        ok: 'OK',

        // Forms
        amount: 'Amount',
        category: 'Category',
        date: 'Date',
        note: 'Note',
        account: 'Account',
        type: 'Type',
        transfer: 'Transfer',

        // List Views
        filter_by_account_date: 'Filter by account or date range',
        filtered_total: 'Filtered total',
        all_accounts: 'All accounts',
        no_expenses_match: 'No expenses match your filters.',
        no_income_match: 'No income records match your filters.',
        uncategorized: 'Uncategorized',
        unknown_account: 'Unknown account',
    },
    zh: {
        // Navigation & Common
        overview: '概览',
        transactions: '交易明细',
        accounts: '账户资产',
        settings: '设置',
        add: '记一笔',
        back: '返回',
        save: '保存',
        cancel: '取消',
        delete: '删除',
        edit: '编辑',

        // Dashboard
        week: '本周',
        month: '本月',
        total_balance: '总资产',
        income: '收入',
        expense: '支出',
        spending_trend: '支出趋势',
        last_6_months: '近6个月',
        add_expenses_trend: '记账后可查看趋势图',
        all_expenses: '全部支出',
        all_income: '全部收入',
        category_breakdown: '分类统计',
        expenses_only: '仅支出',
        add_expense_chart: '记账后可查看统计图',
        recent_transactions: '近期交易',
        no_transactions: '暂无交易记录',
        accounts_this_period: '本{{period}}账户变动',
        net_worth: '净资产',
        no_spending: '本{{period}}无支出',
        spend_this_period: '本{{period}}支出',

        // Credit Cards
        credit_cards: '信用卡',
        manage: '管理',
        no_credit_cards: '未添加信用卡',
        add_card: '添加信用卡',
        bill_day: '账单日',
        due_day: '还款日',
        balance: '当前欠款',
        used: '已用',
        limit: '额度',

        // Settings
        language: '语言设置',
        theme: '外观主题',
        security: '安全保护',
        app_lock: '应用锁',
        passcode: '密码',
        data_management: '数据管理',
        export_data: '导出数据',
        import_data: '导入数据',

        // Accounts
        no_accounts: '暂无账户',
        add_account: '添加账户',
        add_first_account: '添加您的第一个银行卡或现金账户。',
        account_type_CREDIT: '信用卡',
        account_type_CASH: '现金',
        account_type_BANK: '银行账户',

        // Validation
        missing_amount: '请输入金额',
        choose_category: '请选择分类',
        select_account: '请选择账户',
        ok: '确定',

        // Forms
        amount: '金额',
        category: '分类',
        date: '日期',
        note: '备注',
        account: '账户',
        type: '类型',
        transfer: '转账',

        // List Views
        filter_by_account_date: '按账户或日期筛选',
        filtered_total: '筛选总计',
        all_accounts: '所有账户',
        no_expenses_match: '没有匹配的支出记录。',
        no_income_match: '没有匹配的收入记录。',
        uncategorized: '未分类',
        unknown_account: '未知账户',
    }
} as const

export type TxKey = keyof typeof translations.en

export function useTranslation() {
    const { preferences } = useStore()
    const lang = preferences.language || 'zh' // Default to Chinese if not set

    function t(key: TxKey, params?: Record<string, string>) {
        let text: string = translations[lang][key] || translations['en'][key] || key

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{{${k}}}`, v)
            })
        }

        return text
    }

    return { t, lang }
}
