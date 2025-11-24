"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AccountType, useStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#171717']

export default function EditAccountPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const { accounts, transactions, updateAccount, deleteAccount } = useStore()

    const account = accounts.find(a => a.id === params?.id)

    const [name, setName] = useState("")
    const [type, setType] = useState<AccountType>("BANK")
    const [balance, setBalance] = useState("")
    const [limit, setLimit] = useState("")
    const [billingDay, setBillingDay] = useState("")
    const [dueDay, setDueDay] = useState("")
    const [selectedColor, setSelectedColor] = useState(COLORS[5])

    useEffect(() => {
        if (account) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName(account.name)
            setType(account.type)
            setBalance(account.balance.toString())
            setSelectedColor(account.color)
            setLimit(account.limit?.toString() || "")
            setBillingDay(account.billingDay?.toString() || "")
            setDueDay(account.dueDay?.toString() || "")
        }
    }, [account])

    const linkedTransactions = useMemo(() => {
        if (!account) return 0
        return transactions.filter(t =>
            t.accountId === account.id || t.targetAccountId === account.id
        ).length
    }, [transactions, account])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!account) return

        updateAccount(account.id, {
            name,
            type,
            balance: parseFloat(balance) || 0,
            color: selectedColor,
            limit: type === 'CREDIT' ? (limit ? parseFloat(limit) : undefined) : undefined,
            billingDay: type === 'CREDIT' ? (billingDay ? parseInt(billingDay) : undefined) : undefined,
            dueDay: type === 'CREDIT' ? (dueDay ? parseInt(dueDay) : undefined) : undefined,
        })

        router.push("/accounts")
    }

    const handleDelete = () => {
        if (!account) return
        if (linkedTransactions > 0) {
            alert("This account has transactions. Move them to another account before deleting.")
            return
        }
        deleteAccount(account.id)
        router.push("/accounts")
    }

    if (!account) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 text-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 space-y-4">
                        <p className="font-semibold text-lg">Account not found</p>
                        <Link href="/accounts">
                            <Button>Back to accounts</Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background p-4 pb-24">
            <header className="flex items-center justify-between gap-4 pt-8 pb-6">
                <Link href="/accounts">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                        {linkedTransactions} transaction{linkedTransactions === 1 ? "" : "s"}
                    </p>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full"
                        onClick={handleDelete}
                        title="Delete account"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Account Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['BANK', 'CREDIT', 'CASH'] as AccountType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={cn(
                                        "py-3 rounded-xl text-sm font-medium transition-all border",
                                        type === t
                                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                                            : "bg-card text-card-foreground border-transparent hover:bg-secondary"
                                    )}
                                >
                                    {t === 'BANK' ? 'Debit Card' : t === 'CREDIT' ? 'Credit Card' : 'Cash'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Account Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. TD Chequing"
                            className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Current Balance</label>
                        <input
                            type="number"
                            step="0.01"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none font-mono"
                        />
                    </div>

                    {type === 'CREDIT' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Credit Limit</label>
                                <input
                                    type="number"
                                    value={limit}
                                    onChange={(e) => setLimit(e.target.value)}
                                    placeholder="e.g. 50000"
                                    className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Billing Day</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={billingDay}
                                        onChange={(e) => setBillingDay(e.target.value)}
                                        placeholder="Day (1-31)"
                                        className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Due Day</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={dueDay}
                                        onChange={(e) => setDueDay(e.target.value)}
                                        placeholder="Day (1-31)"
                                        className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Color</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-transform",
                                        selectedColor === color ? "scale-125 ring-2 ring-offset-2 ring-primary" : "hover:scale-110"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full text-lg h-14 rounded-2xl mt-2">
                    Save Changes
                </Button>
            </form>
        </main>
    )
}
