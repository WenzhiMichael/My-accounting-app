"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { format } from "date-fns"
import { Wallet, CreditCard as CreditCardIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { getCategoryIcon } from "@/lib/category-icons"
import {
  type DateRangeKey,
  getDateRange,
  isWithinDateRange,
} from "@/lib/date-range"
import { useTranslation } from "@/lib/i18n"

export default function Dashboard() {
  const { accounts, transactions, categories } = useStore()
  const { t } = useTranslation()
  const [isClient, setIsClient] = useState(false)
  const [dateRangeKey, setDateRangeKey] = useState<DateRangeKey>("month")

  useEffect(() => {
    // Guard rendering until the component has mounted to avoid hydration issues
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  const totalAssets = accounts
    .filter(a => a.type !== 'CREDIT')
    .reduce((sum, a) => sum + a.balance, 0)

  const netWorth = totalAssets + accounts
    .filter(a => a.type === 'CREDIT')
    .reduce((sum, a) => sum + a.balance, 0)

  const now = useMemo(() => new Date(), [])
  const dateRange = useMemo(
    () => getDateRange(dateRangeKey, now),
    [dateRangeKey, now],
  )
  const rangeLabel = dateRangeKey === "week" ? t('week').toLowerCase() : t('month').toLowerCase()

  const filteredTransactions = useMemo(
    () =>
      transactions.filter(tx =>
        isWithinDateRange(new Date(tx.date), dateRange),
      ),
    [transactions, dateRange],
  )

  const periodExpense = filteredTransactions
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const periodIncome = filteredTransactions
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const periodBalance = periodIncome - periodExpense

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const totalIncome = transactions
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalExpense = transactions
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const expenseByCategory = useMemo(() => categories
    .map(cat => {
      const value = filteredTransactions
        .filter(tx => tx.type === 'EXPENSE' && tx.categoryId === cat.id)
        .reduce((sum, tx) => sum + tx.amount, 0)
      return { name: cat.name, value, color: cat.color }
    })
    .filter(item => item.value > 0), [categories, filteredTransactions])

  const monthlyExpenseTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_value, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const value = transactions
        .filter(tx => {
          const txDate = new Date(tx.date)
          return tx.type === 'EXPENSE'
            && txDate.getMonth() === date.getMonth()
            && txDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum, tx) => sum + tx.amount, 0)
      return {
        name: format(date, "MMM"),
        value
      }
    })
    return months
  }, [transactions, now])

  const accountExpense = useMemo(() => accounts
    .map(acc => {
      const value = filteredTransactions
        .filter(tx => tx.type === 'EXPENSE' && tx.accountId === acc.id)
        .reduce((sum, tx) => sum + tx.amount, 0)
      return { name: acc.name, value, color: acc.color }
    })
    .filter(item => item.value > 0), [accounts, filteredTransactions])

  const recentTransactions = useMemo(() => filteredTransactions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5), [filteredTransactions])

  if (!isClient) return null

  return (
    <main className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 pt-8 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{t('overview')}</h1>
          <p className="text-muted-foreground mt-1">{t('period_in_cad', { period: rangeLabel })}</p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-full neumorphic-inset p-2">
          <button
            type="button"
            onClick={() => setDateRangeKey("week")}
            className={cn(
              "rounded-full px-6 py-2 text-sm font-bold transition-all duration-300",
              dateRangeKey === "week"
                ? "neumorphic-pressed text-primary"
                : "neumorphic-flat text-muted-foreground hover:text-foreground",
            )}
          >
            {t('week')}
          </button>
          <button
            type="button"
            onClick={() => setDateRangeKey("month")}
            className={cn(
              "rounded-full px-6 py-2 text-sm font-bold transition-all duration-300",
              dateRangeKey === "month"
                ? "neumorphic-pressed text-primary"
                : "neumorphic-flat text-muted-foreground hover:text-foreground",
            )}
          >
            {t('month')}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/expenses/new">
            <Button size="sm" className="rounded-full px-6 text-primary">{t('add')}</Button>
          </Link>
          <Link href="/accounts">
            <Button variant="outline" size="icon" className="rounded-full">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Overall summary */}
      <section>
        <Card className="neumorphic-flat border-none">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('total_balance')}</p>
              <h2
                className={cn(
                  "text-5xl font-black tracking-tight",
                  totalBalance < 0 ? "text-destructive" : "text-foreground"
                )}
              >
                CA${totalBalance.toLocaleString()}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="flex flex-col items-center p-4 rounded-2xl neumorphic-inset">
                <span className="text-xs font-medium text-emerald-600 mb-1">{t('income')}</span>
                <span className="font-bold text-lg text-emerald-600">
                  +CA${totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-2xl neumorphic-inset">
                <span className="text-xs font-medium text-destructive mb-1">{t('expense')}</span>
                <span className="font-bold text-lg text-destructive">
                  -CA${totalExpense.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Monthly summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="neumorphic-flat border-none text-foreground transform transition hover:scale-[1.02]">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full neumorphic-inset flex items-center justify-center mb-3 text-destructive">
              <CreditCardIcon className="h-5 w-5" />
            </div>
            <p className="text-sm opacity-90 font-medium text-muted-foreground">{t('spend_this_period', { period: rangeLabel })}</p>
            <h2 className="text-2xl font-bold mt-2 text-destructive">
              CA${periodExpense.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
        <Card className="neumorphic-flat border-none text-foreground transform transition hover:scale-[1.02]">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full neumorphic-inset flex items-center justify-center mb-3 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="text-sm opacity-90 font-medium text-muted-foreground">{t('income_this_period', { period: rangeLabel })}</p>
            <h2 className="text-2xl font-bold mt-2 text-emerald-600">
              CA${periodIncome.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
        <Card className="neumorphic-flat border-none text-foreground transform transition hover:scale-[1.02]">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full neumorphic-inset flex items-center justify-center mb-3 text-primary">
              <CreditCardIcon className="h-5 w-5" />
            </div>
            <p className="text-sm opacity-90 font-medium text-muted-foreground">{t('balance')}</p>
            <h2 className="text-2xl font-bold mt-2 text-primary">
              CA${periodBalance.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
      </section>

      {/* Monthly trend */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('spending_trend')}</h3>
          <span className="text-sm text-muted-foreground">{t('last_6_months')}</span>
        </div>
        {monthlyExpenseTrend.every(item => item.value === 0) ? (
          <Card className="neumorphic-inset border-none">
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('add_expenses_trend')}
            </CardContent>
          </Card>
        ) : (
          <Card className="neumorphic-flat border-none">
            <CardContent className="p-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyExpenseTrend} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `CA$${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`CA$${value.toLocaleString()}`, t('expense')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/expenses/all">
          <Button variant="outline" className="w-full rounded-xl">{t('all_expenses')}</Button>
        </Link>
        <Link href="/income">
          <Button variant="outline" className="w-full rounded-xl">{t('all_income')}</Button>
        </Link>
      </div>

      {/* Category breakdown */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('category_breakdown')}</h3>
          <span className="text-sm text-muted-foreground">{t('expenses_only')}</span>
        </div>
        {expenseByCategory.length === 0 ? (
          <Card className="neumorphic-inset border-none">
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('add_expense_chart')}
            </CardContent>
          </Card>
        ) : (
          <Card className="neumorphic-flat border-none">
            <CardContent className="p-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={expenseByCategory}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {expenseByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props) => [`CA$${value.toLocaleString()}`, props?.payload?.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">{t('recent_transactions')}</h3>
        {recentTransactions.length === 0 ? (
          <Card className="neumorphic-inset border-none">
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('no_transactions')}
            </CardContent>
          </Card>
        ) : (
          <Card className="neumorphic-flat border-none divide-y divide-border/0">
            <CardContent className="p-0">
              {recentTransactions.map(tx => {
                const category = categories.find(c => c.id === tx.categoryId)
                const row = (
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white neumorphic-inset"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: category?.color || '#999' }}>
                          {(() => {
                            const Icon = getCategoryIcon(category?.icon)
                            return <Icon className="h-4 w-4" />
                          })()}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{category?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-medium",
                      tx.type === 'EXPENSE' ? "text-foreground" : "text-green-600"
                    )}>
                      {tx.type === 'EXPENSE' ? '-' : '+'}CA${tx.amount.toLocaleString()}
                    </span>
                  </div>
                )

                if (tx.type === 'EXPENSE') {
                  return (
                    <Link
                      key={tx.id}
                      href={`/expenses/${tx.id}`}
                      className="block hover:bg-black/5 transition-colors rounded-xl"
                    >
                      {row}
                    </Link>
                  )
                }

                return (
                  <div key={tx.id}>
                    {row}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Account spend */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('accounts_this_period', { period: rangeLabel })}</h3>
          <p className="text-sm text-muted-foreground">{t('net_worth')}: CA${netWorth.toLocaleString()}</p>
        </div>
        {accountExpense.length === 0 ? (
          <Card className="neumorphic-inset border-none">
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('no_spending', { period: rangeLabel })}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {accountExpense.map(acc => (
              <Card key={acc.name} className="overflow-hidden neumorphic-flat border-none">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full neumorphic-inset flex items-center justify-center">
                      <div
                        className="h-8 w-8 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{t('spend_this_period', { period: rangeLabel })}</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-destructive">-CA${acc.value.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Credit Cards Status */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('credit_cards')}</h3>
          <Link href="/accounts" className="text-sm text-primary">{t('manage')}</Link>
        </div>
        <div className="space-y-4">
          {accounts.filter(a => a.type === 'CREDIT').length === 0 ? (
            <Card className="neumorphic-inset border-none">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <CreditCardIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('no_credit_cards')}</p>
                <Link href="/accounts">
                  <Button variant="link" size="sm" className="text-primary">{t('add_card')}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            accounts.filter(a => a.type === 'CREDIT').map(card => (
              <Card key={card.id} className="overflow-hidden neumorphic-flat border-none">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full neumorphic-inset flex items-center justify-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: card.color }}
                        >
                          {card.name.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">{card.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {t('bill_day')}: {card.billingDay || '-'} / {t('due_day')}: {card.dueDay || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('balance')}</p>
                      <p className={cn("font-bold", card.balance < 0 ? "text-destructive" : "text-primary")}>
                        {card.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar for Limit */}
                  {card.limit && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('used')}: {Math.round((Math.abs(card.balance) / card.limit) * 100)}%</span>
                        <span>{t('limit')}: {card.limit.toLocaleString()}</span>
                      </div>
                      <div className="h-3 w-full neumorphic-inset rounded-full overflow-hidden p-[2px]">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min((Math.abs(card.balance) / card.limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Recent Transactions */}
    </main >
  )
}
