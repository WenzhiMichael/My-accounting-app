"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { format } from "date-fns"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const ALL = "all"

export default function AllIncomePage() {
    const { transactions, accounts, categories } = useStore()
    const [accountFilter, setAccountFilter] = useState<string>(ALL)
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const categoryMap = useMemo(
        () => Object.fromEntries(categories.map(cat => [cat.id, cat])),
        [categories]
    )
    const accountMap = useMemo(
        () => Object.fromEntries(accounts.map(acc => [acc.id, acc.name])),
        [accounts]
    )

    const filtered = useMemo(() => {
        return transactions
            .filter(tx => tx.type === 'INCOME')
            .filter(tx => accountFilter === ALL ? true : tx.accountId === accountFilter)
            .filter(tx => {
                if (!startDate && !endDate) return true
                const d = new Date(tx.date)
                if (startDate && d < new Date(startDate)) return false
                if (endDate) {
                    const end = new Date(endDate)
                    end.setHours(23, 59, 59, 999)
                    if (d > end) return false
                }
                return true
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [transactions, accountFilter, startDate, endDate])

    const total = filtered.reduce((sum, tx) => sum + tx.amount, 0)

    return (
        <main className="min-h-screen bg-background p-4 pb-24 space-y-4">
            <header className="flex items-center justify-between pt-8 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Income</h1>
                    <p className="text-sm text-muted-foreground">Filter by account or date range</p>
                </div>
                <Link href="/expenses/all">
                    <Button variant="outline" size="sm">All Expenses</Button>
                </Link>
            </header>

            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Filtered total</p>
                        <p className="text-2xl font-bold text-green-600">CA${total.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                            value={accountFilter}
                            onChange={(e) => setAccountFilter(e.target.value)}
                            className="w-full h-11 rounded-full bg-secondary px-4 text-sm font-medium outline-none border border-border"
                        >
                            <option value={ALL}>All accounts</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full h-11 rounded-full bg-secondary px-4 text-sm font-medium outline-none border border-border"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full h-11 rounded-full bg-secondary px-4 text-sm font-medium outline-none border border-border"
                        />
                    </div>
                </CardContent>
            </Card>

            <section className="space-y-3">
                {filtered.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No income records match your filters.
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((tx) => {
                        const category = categoryMap[tx.categoryId]
                        return (
                            <Card key={tx.id}>
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
                                    <div className={cn("text-lg font-semibold text-green-600")}>
                                        +CA${tx.amount.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </section>
        </main>
    )
}
