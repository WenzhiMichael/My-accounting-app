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

export default function Dashboard() {
  const { accounts, transactions, categories } = useStore()
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
  const rangeLabel = dateRangeKey === "week" ? "week" : "month"

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
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">This {rangeLabel} in CAD</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setDateRangeKey("week")}
            className={cn(
              "rounded-full px-4 py-1 text-sm font-medium transition",
              dateRangeKey === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setDateRangeKey("month")}
            className={cn(
              "rounded-full px-4 py-1 text-sm font-medium transition",
              dateRangeKey === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Month
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/expenses/new">
            <Button size="sm" className="rounded-full">Add</Button>
          </Link>
          <Link href="/accounts">
            <Button variant="outline" size="icon" className="rounded-full">
              <Wallet className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Overall summary */}
      <section>
        <Card className="bg-muted/40 border-none">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <h2
                className={cn(
                  "text-4xl font-bold tracking-tight",
                  totalBalance < 0 ? "text-destructive" : "text-foreground"
                )}
              >
                CA${totalBalance.toLocaleString()}
              </h2>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Income</span>
                <span className="font-semibold text-emerald-600">
                  +CA${totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground">Expense</span>
                <span className="font-semibold text-destructive">
                  -CA${totalExpense.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Monthly summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-destructive text-destructive-foreground border-none">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">This {rangeLabel} spent</p>
            <h2 className="text-3xl font-bold mt-1">
              CA${periodExpense.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500 text-white border-none">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">This {rangeLabel} income</p>
            <h2 className="text-3xl font-bold mt-1">
              CA${periodIncome.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">Balance</p>
            <h2 className="text-3xl font-bold mt-1">
              CA${periodBalance.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
      </section>

      {/* Monthly trend */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Spending trend</h3>
          <span className="text-sm text-muted-foreground">Last 6 months</span>
        </div>
        {monthlyExpenseTrend.every(item => item.value === 0) ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              Add expenses to see your trend.
            </CardContent>
          </Card>
        ) : (
          <Card>
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
                    formatter={(value: number) => [`CA$${value.toLocaleString()}`, "Expenses"]}
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
          <Button variant="outline" className="w-full rounded-xl">All Expenses</Button>
        </Link>
        <Link href="/income">
          <Button variant="outline" className="w-full rounded-xl">All Income</Button>
        </Link>
      </div>

      {/* Category breakdown */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Category breakdown</h3>
          <span className="text-sm text-muted-foreground">Expenses only</span>
        </div>
        {expenseByCategory.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              Add an expense to see your chart.
            </CardContent>
          </Card>
        ) : (
          <Card>
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

      {/* Account spend */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Accounts this {rangeLabel}</h3>
          <p className="text-sm text-muted-foreground">Net worth: CA${netWorth.toLocaleString()}</p>
        </div>
        {accountExpense.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              No spending tracked this {rangeLabel}.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accountExpense.map(acc => (
              <Card key={acc.name} className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full"
                      style={{ backgroundColor: acc.color }}
                    />
                    <div>
                      <p className="font-semibold">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">Spend this {rangeLabel}</p>
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
          <h3 className="text-lg font-semibold">Credit Cards</h3>
          <Link href="/accounts" className="text-sm text-primary">Manage</Link>
        </div>
        <div className="space-y-3">
          {accounts.filter(a => a.type === 'CREDIT').length === 0 ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <CreditCardIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No credit cards added</p>
                <Link href="/accounts">
                  <Button variant="link" size="sm">Add Card</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            accounts.filter(a => a.type === 'CREDIT').map(card => (
              <Card key={card.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: card.color }}
                      >
                        {card.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium">{card.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Bill Day: {card.billingDay || '-'} / Due: {card.dueDay || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={cn("font-bold", card.balance < 0 ? "text-destructive" : "text-primary")}>
                        {card.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar for Limit */}
                  {card.limit && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used: {Math.round((Math.abs(card.balance) / card.limit) * 100)}%</span>
                        <span>Limit: {card.limit.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
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
      <section>
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            recentTransactions.map(tx => {
              const category = categories.find(c => c.id === tx.categoryId)
              return (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: category?.color || '#999' }}
                    >
                      {(() => {
                        const Icon = getCategoryIcon(category?.icon)
                        return <Icon className="h-5 w-5" />
                      })()}
                    </div>
                    <div>
                      <p className="font-medium">{category?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.date), "MMM d, yyyy")}
                        {tx.note && ` • ${tx.note}`}
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
            })
          )}
        </div>
      </section>
    </main>
  )
}
