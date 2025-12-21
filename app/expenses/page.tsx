"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/category-icons"

const ALL_ACCOUNTS = "all"
type Range = "all" | "week" | "month" | "halfyear"

export default function TransactionsPage() {
    const { transactions, accounts, categories } = useStore()
    const [accountFilter, setAccountFilter] = useState<string>(ALL_ACCOUNTS)
    const [range, setRange] = useState<Range>("all")

    const accountMap = useMemo(
        () => Object.fromEntries(accounts.map(acc => [acc.id, acc.name])),
        [accounts]
    )
    const categoryMap = useMemo(
        () => Object.fromEntries(categories.map(cat => [cat.id, cat])),
        [categories]
    )

    const rangeFiltered = useMemo(() => {
        if (range === "all") return transactions
        const now = new Date()
        let start: Date
        if (range === "week") {
            start = addDays(now, -7)
        } else if (range === "month") {
            start = addDays(now, -30)
        } else {
            start = addDays(now, -180)
        }
        return transactions.filter(tx => {
            const d = new Date(tx.date)
            return (isAfter(d, startOfDay(start)) || +d === +startOfDay(start)) && (isBefore(d, now) || +d === +now)
        })
    }, [transactions, range])

    const filtered = useMemo(() => rangeFiltered
        .filter(tx => accountFilter === ALL_ACCOUNTS ? true : tx.accountId === accountFilter)
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [rangeFiltered, accountFilter])

    const totalIncome = filtered.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0)
    const totalExpense = filtered.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0)
    const totalBalance = totalIncome - totalExpense

    return (
        <main className="min-h-screen bg-background p-4 pb-24 space-y-4">
            <header className="flex items-center justify-between pt-8 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-sm text-muted-foreground">Filtered activity across your accounts (CAD)</p>
                </div>
                <Link href="/expenses/new">
                    <Button size="icon" className="rounded-full shadow-lg">+</Button>
                </Link>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="bg-secondary border-none">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total balance</p>
                        <p className={cn("text-2xl font-bold mt-1", totalBalance < 0 ? "text-destructive" : "text-foreground")}>
                            CA${totalBalance.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-primary text-primary-foreground border-none">
                    <CardContent className="p-4">
                        <p className="text-sm opacity-80">Income ({labelForRange(range)})</p>
                        <p className="text-2xl font-bold mt-1">CA${totalIncome.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-destructive text-destructive-foreground border-none">
                    <CardContent className="p-4">
                        <p className="text-sm opacity-80">Expense ({labelForRange(range)})</p>
                        <p className="text-2xl font-bold mt-1">CA${totalExpense.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </section>

            <div className="grid grid-cols-2 gap-2">
                <Link href="/expenses/all">
                    <Button variant="outline" className="w-full rounded-xl">All Expenses</Button>
                </Link>
                <Link href="/income">
                    <Button variant="outline" className="w-full rounded-xl">All Income</Button>
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-secondary px-2 py-1 rounded-full text-xs">
                    {(["all", "week", "month", "halfyear"] as Range[]).map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-3 py-1 rounded-full font-medium transition-colors",
                                range === r ? "bg-background shadow-sm" : "text-muted-foreground"
                            )}
                        >
                            {labelForRange(r)}
                        </button>
                    ))}
                </div>

                <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="h-11 rounded-full bg-secondary px-4 text-sm font-medium outline-none border border-border"
                >
                    <option value={ALL_ACCOUNTS}>All accounts</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>

                <Link href="/settings">
                    <Button variant="outline" size="sm">Settings</Button>
                </Link>
            </div>

            <section className="space-y-3">
                {filtered.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No transactions yet. Start by adding one.
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((tx) => {
                        const category = categoryMap[tx.categoryId]
                        return (
                            <Link key={tx.id} href={`/expenses/${tx.id}`}>
                                <Card className="hover:border-primary transition-colors">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold"
                                                style={{ backgroundColor: category?.color || '#999' }}
                                            >
                                                {(() => {
                                                    const Icon = getCategoryIcon(category?.icon)
                                                    return <Icon className="h-6 w-6" />
                                                })()}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">{category?.name || 'Uncategorized'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(tx.date), "MMM d, yyyy")} · {accountMap[tx.accountId] || 'Unknown account'}
                                                </p>
                                                {tx.note && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                                                        {tx.note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "text-lg font-semibold",
                                            tx.type === 'EXPENSE' ? "text-foreground" : "text-green-600"
                                        )}>
                                            {tx.type === 'EXPENSE' ? '-' : '+'}CA${tx.amount.toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })
                )}
            </section>
        </main>
    )
}

function labelForRange(range: Range) {
    switch (range) {
        case "week": return "Last 7 days"
        case "month": return "Last 30 days"
        case "halfyear": return "Last 6 months"
        default: return "Overall"
    }
}
