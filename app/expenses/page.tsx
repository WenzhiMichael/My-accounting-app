"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { format } from "date-fns"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const ALL_ACCOUNTS = "all"

export default function TransactionsPage() {
    const { transactions, accounts, categories } = useStore()
    const [accountFilter, setAccountFilter] = useState<string>(ALL_ACCOUNTS)

    const accountMap = useMemo(
        () => Object.fromEntries(accounts.map(acc => [acc.id, acc.name])),
        [accounts]
    )
    const categoryMap = useMemo(
        () => Object.fromEntries(categories.map(cat => [cat.id, cat])),
        [categories]
    )

    const now = new Date()
    const monthly = transactions.filter(tx => {
        const d = new Date(tx.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const monthExpense = monthly
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + tx.amount, 0)
    const monthIncome = monthly
        .filter(tx => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + tx.amount, 0)

    const filtered = transactions
        .filter(tx => accountFilter === ALL_ACCOUNTS ? true : tx.accountId === accountFilter)
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <main className="min-h-screen bg-background p-4 pb-24 space-y-4">
            <header className="flex items-center justify-between pt-8 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-sm text-muted-foreground">Recent activity across your accounts (CAD)</p>
                </div>
                <Link href="/expenses/new">
                    <Button size="icon" className="rounded-full shadow-lg">+</Button>
                </Link>
            </header>

            <section className="grid grid-cols-2 gap-3">
                <Card className="bg-primary text-primary-foreground border-none">
                    <CardContent className="p-4">
                        <p className="text-sm opacity-80">This month spent</p>
                        <p className="text-2xl font-bold mt-1">CA${monthExpense.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-secondary border-none">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">This month income</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">CA${monthIncome.toLocaleString()}</p>
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

            <div className="flex items-center gap-3">
                <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="w-full h-11 rounded-full bg-secondary px-4 text-sm font-medium outline-none border border-border"
                >
                    <option value={ALL_ACCOUNTS}>All accounts</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
                <Link href="/accounts/new">
                    <Button variant="outline" size="sm">Add account</Button>
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
                                                {category?.name?.[0] || '?'}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">{category?.name || 'Uncategorized'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(tx.date), "MMM d, h:mm a")} · {accountMap[tx.accountId] || 'Unknown account'}
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
