"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore, TransactionType } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Calendar, Delete, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function AddExpensePage() {
    const router = useRouter()
    const { accounts, categories, addTransaction, preferences, setLastAccountId } = useStore()

    const [amount, setAmount] = useState("0")
    const [note, setNote] = useState("")
    const [date] = useState(new Date().toISOString())
    const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id)
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
        preferences.lastAccountId || accounts[0]?.id
    )
    const [type, setType] = useState<TransactionType>('EXPENSE')

    // Calculator logic
    const handleDigit = (digit: string) => {
        if (amount === "0" && digit !== ".") {
            setAmount(digit)
        } else {
            if (digit === "." && amount.includes(".")) return
            setAmount(prev => prev + digit)
        }
    }

    const handleBackspace = () => {
        setAmount(prev => {
            if (prev.length === 1) return "0"
            return prev.slice(0, -1)
        })
    }

    const handleSubmit = () => {
        const finalAmount = parseFloat(amount)
        if (finalAmount === 0 || Number.isNaN(finalAmount) || !selectedAccountId || !selectedCategoryId) return

        addTransaction({
            amount: finalAmount,
            type,
            accountId: selectedAccountId,
            categoryId: selectedCategoryId,
            date,
            note
        })

        setLastAccountId(selectedAccountId)
        router.back()
    }

    // Ensure we have a valid account selected
    useEffect(() => {
        if (!selectedAccountId && accounts.length > 0) {
            // Ensure an account is selected once data is available
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedAccountId(preferences.lastAccountId || accounts[0].id)
        }
    }, [accounts, selectedAccountId, preferences.lastAccountId])

    // Ensure we have a valid category selected
    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedCategoryId(categories[0].id)
        }
    }, [categories, selectedCategoryId])

    const canSubmit = Boolean(
        selectedAccountId &&
        selectedCategoryId &&
        !Number.isNaN(parseFloat(amount)) &&
        parseFloat(amount) > 0
    )

    if (accounts.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
                <p>You need an account to track expenses.</p>
                <Link href="/accounts/new">
                    <Button>Create Account</Button>
                </Link>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <X className="h-6 w-6" />
                </Button>
                <div className="flex bg-secondary rounded-full p-1">
                    <button
                        onClick={() => setType('EXPENSE')}
                        className={cn("px-4 py-1 rounded-full text-sm font-medium transition-all", type === 'EXPENSE' ? "bg-background shadow-sm" : "text-muted-foreground")}
                    >
                        Expense
                    </button>
                    <button
                        onClick={() => setType('INCOME')}
                        className={cn("px-4 py-1 rounded-full text-sm font-medium transition-all", type === 'INCOME' ? "bg-background shadow-sm" : "text-muted-foreground")}
                    >
                        Income
                    </button>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            {/* Category Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-4 gap-4">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className="flex flex-col items-center gap-2"
                        >
                            <div
                                className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                                    selectedCategoryId === cat.id ? "scale-110 ring-2 ring-offset-2 ring-primary" : "bg-secondary"
                                )}
                                style={{ backgroundColor: selectedCategoryId === cat.id ? cat.color : undefined }}
                            >
                                {/* Placeholder for icon */}
                                <span className={cn("text-xl font-bold", selectedCategoryId === cat.id ? "text-white" : "text-foreground")}>
                                    {cat.name[0]}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-secondary/30 rounded-t-[2rem] p-6 pb-8 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)]">
                {/* Display */}
                <div className="flex items-end justify-between mb-6 px-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-sm">
                            {/* Selected Category Icon */}
                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: categories.find(c => c.id === selectedCategoryId)?.color }}
                            />
                        </div>
                        <span className="font-medium">{categories.find(c => c.id === selectedCategoryId)?.name}</span>
                    </div>
                    <div className="text-4xl font-bold tracking-tight">
                        CA${amount}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm whitespace-nowrap">
                        <Calendar className="h-4 w-4" />
                        <input
                            type="datetime-local"
                            value={format(new Date(date), "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => setDate(e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
                            className="bg-transparent outline-none"
                        />
                    </div>
                    <select
                        value={selectedAccountId}
                        onChange={(e) => {
                            setSelectedAccountId(e.target.value)
                            setLastAccountId(e.target.value)
                        }}
                        className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm outline-none appearance-none"
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Add note..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-full text-sm shadow-sm outline-none min-w-[100px]"
                    />
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-4 gap-3">
                    {['7', '8', '9'].map(k => (
                        <Key key={k} val={k} onClick={handleDigit} />
                    ))}
                    <div />
                    {['4', '5', '6'].map(k => (
                        <Key key={k} val={k} onClick={handleDigit} />
                    ))}
                    <div />
                    {['1', '2', '3'].map(k => (
                        <Key key={k} val={k} onClick={handleDigit} />
                    ))}
                    <div />
                    <Key val="." onClick={handleDigit} />
                    <Key val="0" onClick={handleDigit} />
                    <button onClick={handleBackspace} className="flex items-center justify-center h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm active:scale-95 transition-transform">
                        <Delete className="h-6 w-6" />
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex items-center justify-center h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform font-bold text-lg"
                    >
                        OK
                    </button>
                </div>
            </div>
        </main>
    )
}

function Key({ val, onClick }: { val: string, onClick: (v: string) => void }) {
    return (
        <button
            onClick={() => onClick(val)}
            className="flex items-center justify-center h-14 rounded-2xl bg-white dark:bg-zinc-800 text-2xl font-medium shadow-sm active:scale-95 transition-transform"
        >
            {val}
        </button>
    )
}
