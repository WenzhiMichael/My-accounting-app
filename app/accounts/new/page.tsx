"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore, AccountType } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#171717']

export default function NewAccountPage() {
    const router = useRouter()
    const { addAccount } = useStore()

    const [name, setName] = useState("")
    const [type, setType] = useState<AccountType>("BANK")
    const [balance, setBalance] = useState("")
    const [limit, setLimit] = useState("")
    const [billingDay, setBillingDay] = useState("")
    const [dueDay, setDueDay] = useState("")
    const [selectedColor, setSelectedColor] = useState(COLORS[5])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        addAccount({
            name,
            type,
            balance: parseFloat(balance) || 0,
            color: selectedColor,
            limit: type === 'CREDIT' ? parseFloat(limit) : undefined,
            billingDay: type === 'CREDIT' ? parseInt(billingDay) : undefined,
            dueDay: type === 'CREDIT' ? parseInt(dueDay) : undefined,
        })

        router.back()
    }

    return (
        <main className="min-h-screen bg-background p-4 pb-24">
            <header className="flex items-center gap-4 pt-8 pb-6">
                <Link href="/accounts">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Add Account</h1>
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
                            placeholder="e.g. Chase Sapphire"
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
                        <p className="text-xs text-muted-foreground">
                            {type === 'CREDIT' ? 'Negative for debt, positive for overpayment.' : 'Current money available.'}
                        </p>
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

                <Button type="submit" className="w-full text-lg h-14 rounded-2xl mt-8">
                    Save Account
                </Button>
            </form>
        </main>
    )
}
