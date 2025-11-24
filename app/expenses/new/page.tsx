"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Delete, Repeat, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useStore, TransactionType } from "@/lib/store"

type RecurringType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

export default function AddExpensePage() {
    const router = useRouter()
    const { accounts, categories, transactions, addTransaction, preferences, setLastAccountId } = useStore()

    const [amount, setAmount] = useState("0")
    const [note, setNote] = useState("")
    const [date, setDate] = useState(new Date().toISOString())
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(categories[0]?.id)
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
        preferences.lastAccountId || accounts[0]?.id
    )
    const [type, setType] = useState<TransactionType>('EXPENSE')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [recurringType, setRecurringType] = useState<RecurringType>('NONE')
    const [recurringInterval, setRecurringInterval] = useState(1)
    const [toast, setToast] = useState<string | null>(null)
    const [shakeCategory, setShakeCategory] = useState(false)

    useEffect(() => {
        if (!selectedAccountId && accounts.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedAccountId(preferences.lastAccountId || accounts[0].id)
        }
    }, [accounts, selectedAccountId, preferences.lastAccountId])

    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedCategoryId(categories[0].id)
        }
    }, [categories, selectedCategoryId])

    const suggestions = useMemo(() => {
        const q = note.trim().toLowerCase()
        if (!q) return []
        const seen = new Set<string>()
        return transactions
            .filter(tx => tx.note?.toLowerCase().includes(q))
            .filter(tx => type ? tx.type === type : true)
            .filter(tx => {
                if (selectedCategoryId) return tx.categoryId === selectedCategoryId
                return true
            })
            .filter(tx => {
                if (seen.has(tx.note!)) return false
                seen.add(tx.note!)
                return true
            })
            .slice(0, 6)
    }, [note, transactions, selectedCategoryId, type])

    const dateLabel = format(new Date(date), "MMM d, h:mm a")

    const handleDigit = (digit: string) => {
        setToast(null)
        setAmount(prev => {
            if (prev === "0" && digit !== ".") return digit
            if (digit === "." && prev.includes(".")) return prev
            return prev + digit
        })
    }

    const handleBackspace = () => {
        setToast(null)
        setAmount(prev => {
            if (prev.length === 1) return "0"
            return prev.slice(0, -1)
        })
    }

    const triggerToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 1800)
    }

    const handleSubmit = () => {
        const finalAmount = Number.parseFloat(amount)
        if (Number.isNaN(finalAmount) || finalAmount <= 0) {
            triggerToast("Missing amount")
            return
        }
        if (!selectedCategoryId) {
            triggerToast("Choose a category")
            setShakeCategory(true)
            setTimeout(() => setShakeCategory(false), 500)
            return
        }
        if (!selectedAccountId) {
            triggerToast("Select an account")
            return
        }

        addTransaction({
            amount: finalAmount,
            type,
            accountId: selectedAccountId,
            categoryId: selectedCategoryId,
            date,
            note,
            recurringType: recurringType === 'NONE' ? undefined : recurringType,
            recurringInterval: recurringType === 'NONE' ? undefined : recurringInterval,
        })

        setLastAccountId(selectedAccountId)
        router.back()
    }

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
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg text-sm font-semibold">
                    {toast}
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between p-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <X className="h-6 w-6" />
                </Button>
                <div className="relative flex bg-secondary rounded-full p-1">
                    <div
                        className={cn(
                            "absolute top-1 bottom-1 w-1/2 rounded-full bg-background shadow-sm transition-transform",
                            type === 'INCOME' ? "translate-x-full" : "translate-x-0"
                        )}
                    />
                    <button
                        onClick={() => { setType('EXPENSE'); setSelectedCategoryId(categories[0]?.id) }}
                        className={cn("relative z-10 px-4 py-1 rounded-full text-sm font-medium transition-all",
                            type === 'EXPENSE' ? "text-foreground" : "text-muted-foreground")}
                    >
                        Expense
                    </button>
                    <button
                        onClick={() => { setType('INCOME'); setSelectedCategoryId(categories[0]?.id) }}
                        className={cn("relative z-10 px-4 py-1 rounded-full text-sm font-medium transition-all",
                            type === 'INCOME' ? "text-foreground" : "text-muted-foreground")}
                    >
                        Income
                    </button>
                </div>
                <div className="w-10" />
            </header>

            {/* Category Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-4 gap-4">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={cn(
                                "flex flex-col items-center gap-2 transition-all",
                                shakeCategory ? "animate-pulse" : ""
                            )}
                        >
                            <div
                                className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                                    selectedCategoryId === cat.id ? "scale-110 ring-2 ring-offset-2 ring-primary" : "bg-secondary"
                                )}
                                style={{ backgroundColor: selectedCategoryId === cat.id ? cat.color : undefined }}
                            >
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
                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: categories.find(c => c.id === selectedCategoryId)?.color }}
                            />
                        </div>
                        <span className="font-medium">{categories.find(c => c.id === selectedCategoryId)?.name || "Choose category"}</span>
                    </div>
                    <div className="text-4xl font-bold tracking-tight">
                        CA${amount}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide items-center">
                    <button
                        onClick={() => setShowDatePicker(true)}
                        className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm whitespace-nowrap"
                    >
                        <Calendar className="h-4 w-4" />
        <span>{dateLabel}</span>
                    </button>
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
                        className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-full text-sm shadow-sm outline-none min-w-[120px]"
                    />
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-2 rounded-full text-sm shadow-sm">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={recurringType}
                            onChange={(e) => setRecurringType(e.target.value as RecurringType)}
                            className="bg-transparent outline-none"
                        >
                            <option value="NONE">One-time</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                        </select>
                        {recurringType !== 'NONE' && (
                            <input
                                type="number"
                                min={1}
                                value={recurringInterval}
                                onChange={(e) => setRecurringInterval(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                                className="w-14 bg-transparent outline-none text-right"
                            />
                        )}
                    </div>
                </div>

                {suggestions.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                        {suggestions.map((tx) => (
                            <button
                                key={tx.id}
                                onClick={() => {
                                    setNote(tx.note || "")
                                    if (amount === "0") setAmount(tx.amount.toString())
                                    if (!selectedCategoryId) setSelectedCategoryId(tx.categoryId)
                                }}
                                className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-2 rounded-full text-sm shadow-sm whitespace-nowrap"
                            >
                                <span className="font-semibold">{tx.note}</span>
                                <span className="text-muted-foreground">CA${tx.amount.toLocaleString()}</span>
                            </button>
                        ))}
                    </div>
                )}

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
                        disabled={Number.parseFloat(amount) <= 0 || !selectedCategoryId || !selectedAccountId}
                        className="flex items-center justify-center h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform font-bold text-lg disabled:opacity-50"
                    >
                        OK
                    </button>
                </div>
            </div>

            {showDatePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card text-card-foreground rounded-2xl shadow-lg p-4 w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Choose date & time</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowDatePicker(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <input
                            type="datetime-local"
                            value={format(new Date(date), "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => setDate(e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
                            className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none"
                        />
                        <Button className="w-full" onClick={() => setShowDatePicker(false)}>Done</Button>
                    </div>
                </div>
            )}
        </main>
    )
}

function Key({ val, onClick }: Readonly<{ val: string, onClick: (v: string) => void }>) {
    return (
        <button
            onClick={() => onClick(val)}
            className="flex items-center justify-center h-14 rounded-2xl bg-white dark:bg-zinc-800 text-2xl font-medium shadow-sm active:scale-95 transition-transform"
        >
            {val}
        </button>
    )
}
