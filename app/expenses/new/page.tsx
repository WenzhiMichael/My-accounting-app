"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Delete, Repeat, X, Pen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, dateInputToStartOfDayIso, toStartOfDayIso } from "@/lib/utils"
import { useStore, TransactionType } from "@/lib/store"
import { categoryIconMap, defaultCategoryIcon, getCategoryIcon } from "@/lib/category-icons"
import { useTranslation } from "@/lib/i18n"

type RecurringType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

export default function AddExpensePage() {
    const router = useRouter()
    const { accounts, categories, transactions, addTransaction, preferences, setLastAccountId } = useStore()
    const { t } = useTranslation()

    // --- State ---
    const [amount, setAmount] = useState("0")
    const [note, setNote] = useState("")
    const [date, setDate] = useState(() => toStartOfDayIso(new Date()))

    // Type & Selection
    const [type, setType] = useState<TransactionType>('EXPENSE')
    const firstExpenseId = useMemo(() => categories.find(c => c.type === 'EXPENSE')?.id, [categories])
    const firstIncomeId = useMemo(() => categories.find(c => c.type === 'INCOME')?.id, [categories])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(firstExpenseId)
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
        preferences.lastAccountId || accounts[0]?.id
    )

    // Category Grouping State
    const [activeGroupKey, setActiveGroupKey] = useState<string>('group_food')

    // UI State
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [recurringType, setRecurringType] = useState<RecurringType>('NONE')
    const [recurringInterval, setRecurringInterval] = useState(1)
    const [toast, setToast] = useState<string | null>(null)
    const [shakeCategory, setShakeCategory] = useState(false)
    const [isAmountFocused, setIsAmountFocused] = useState(false)

    // --- Logic ---

    // Filter Categories by Type
    const filteredCategories = useMemo(
        () => categories.filter(cat => {
            const targetType = type === 'INCOME' ? 'INCOME' : 'EXPENSE'
            return !cat.type || cat.type === targetType
        }),
        [categories, type]
    )

    // Grouping Logic
    const groupedCategories = useMemo(() => {
        const GROUP_MAP: Record<string, string> = {
            '餐饮美食': 'group_food',
            '交通出行': 'group_transport',
            '购物消费': 'group_shopping',
            '居住缴费': 'group_housing',
            '休闲娱乐': 'group_entertainment',
            '医疗教育': 'group_medical',
            '人情往来': 'group_social',
            '其他': 'group_others',
            '收入': 'group_income'
        }

        // Manual order for consistent display
        const ORDERED_KEYS = [
            'group_food', 'group_transport', 'group_shopping',
            'group_housing', 'group_entertainment', 'group_medical',
            'group_social', 'group_others', 'group_income', 'qt'
        ]

        const groups: Record<string, typeof categories> = {}
        const groupLabels: Record<string, string> = {}

        filteredCategories.forEach(cat => {
            const rawGroup = cat.group || 'qt'
            const key = cat.groupKey || GROUP_MAP[rawGroup] || rawGroup

            if (!groups[key]) {
                groups[key] = []
                // Determine label
                if (key.startsWith('group_')) {
                    groupLabels[key] = key // Will translate later
                } else {
                    groupLabels[key] = rawGroup
                }
            }
            groups[key].push(cat)
        })

        // Sort groups based on predefined order, then append unknown groups
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const idxA = ORDERED_KEYS.indexOf(a)
            const idxB = ORDERED_KEYS.indexOf(b)
            if (idxA !== -1 && idxB !== -1) return idxA - idxB
            if (idxA !== -1) return -1
            if (idxB !== -1) return 1
            return 0
        })

        return sortedKeys.map(key => ({
            key,
            label: groupLabels[key],
            items: groups[key]
        }))
    }, [filteredCategories])

    // Set default active group when type changes
    useEffect(() => {
        if (groupedCategories.length > 0) {
            // Try to keep current group if it exists in new type, else reset
            const exists = groupedCategories.find(g => g.key === activeGroupKey)
            if (!exists) {
                setActiveGroupKey(groupedCategories[0].key)
            }
        }
    }, [groupedCategories, activeGroupKey, type])

    // Selected Category Helpers
    const selectedCategory = useMemo(
        () => filteredCategories.find(c => c.id === selectedCategoryId),
        [filteredCategories, selectedCategoryId]
    )
    const SelectedCategoryIcon = useMemo(() => {
        const key = selectedCategory?.icon?.toLowerCase() || ""
        return categoryIconMap[key] || defaultCategoryIcon
    }, [selectedCategory])

    // Current Grid Items
    const currentGroupItems = useMemo(() => {
        return groupedCategories.find(g => g.key === activeGroupKey)?.items || []
    }, [groupedCategories, activeGroupKey])

    // Date Label
    const dateLabel = format(new Date(date), "MMM d, yyyy")
    const formattedAmount = useMemo(() => {
        const parsed = Number.parseFloat(amount)
        if (Number.isNaN(parsed)) {
            return "0.00"
        }
        return parsed.toFixed(2)
    }, [amount])

    const sanitizeAmountInput = (value: string) => {
        const cleaned = value.replace(/[^\d.]/g, "")
        if (!cleaned) return ""
        const [intPart, ...decimalParts] = cleaned.split(".")
        const integer = intPart.replace(/^0+(?=\d)/, "")
        if (decimalParts.length === 0) {
            return integer || "0"
        }
        const decimals = decimalParts.join("").slice(0, 2)
        return `${integer || "0"}.${decimals}`
    }

    // --- Handlers ---

    const handleDigit = (digit: string) => {
        setToast(null)
        setAmount(prev => {
            if (prev === "0" && digit !== ".") return digit
            if (digit === "." && prev.includes(".")) return prev
            if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev // Max 2 decimals
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
        const finalAmount = Number.parseFloat(formattedAmount)
        if (Number.isNaN(finalAmount) || finalAmount <= 0) {
            triggerToast(t('missing_amount'))
            return
        }
        if (!selectedCategoryId) {
            triggerToast(t('choose_category'))
            setShakeCategory(true)
            setTimeout(() => setShakeCategory(false), 500)
            return
        }
        if (!selectedAccountId) {
            triggerToast(t('select_account'))
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
                <p>{t('add_first_account')}</p>
                <Link href="/accounts/new">
                    <Button>{t('add_account')}</Button>
                </Link>
            </div>
        )
    }

    // --- Render Components ---

    const CategoryGridMobile = ({ items, cols = 4 }: { items: typeof categories, cols?: number }) => (
        <div className={cn("grid gap-4 p-4",
            cols === 4 ? "grid-cols-4" : "grid-cols-5"
        )}>
            {items.map(cat => {
                const Icon = getCategoryIcon(cat.icon)
                const isSelected = selectedCategoryId === cat.id
                const catName = cat.translationKey ? t(cat.translationKey as any) : cat.name

                return (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={cn(
                            "flex flex-col items-center gap-2 transition-all min-h-[5rem]",
                            shakeCategory && isSelected ? "animate-pulse" : ""
                        )}
                    >
                        <div
                            className={cn(
                                "w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all shadow-sm",
                                isSelected ? "scale-110 ring-2 ring-offset-2 ring-primary" : "bg-[var(--bg-subtle)] hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                            style={{ backgroundColor: isSelected ? cat.color : undefined }}
                        >
                            <Icon className={cn("h-6 w-6 transition-colors",
                                isSelected ? "text-white" : "text-muted-foreground"
                            )} />
                        </div>
                        <span className={cn(
                            "text-[10px] text-center leading-tight w-full px-1 break-words whitespace-normal line-clamp-2",
                            isSelected ? "font-medium text-foreground" : "text-muted-foreground"
                        )}>
                            {catName}
                        </span>
                    </button>
                )
            })}
        </div>
    )

    return (
        <>
            {/* Toast Overlay */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-destructive text-destructive-foreground px-6 py-2.5 rounded-full shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-4">
                    {toast}
                </div>
            )}

            {/* Date Picker Overlay */}
            {showDatePicker && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card text-card-foreground rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">{t('choose_date')}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowDatePicker(false)} className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <input
                            type="date"
                            value={format(new Date(date), "yyyy-MM-dd")}
                            onChange={(e) => setDate(dateInputToStartOfDayIso(e.target.value))}
                            className="w-full h-14 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none text-lg"
                        />
                        <Button className="w-full h-12 rounded-xl text-md font-semibold" onClick={() => setShowDatePicker(false)}>
                            {t('done')}
                        </Button>
                    </div>
                </div>
            )}

            {/* --- MOBILE LAYOUT (<md) --- */}
            <main className="md:hidden flex flex-col h-[100dvh] bg-background text-foreground">

                {/* 1. Header */}
                <header className="h-14 px-4 flex items-center justify-between shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                        <X className="h-6 w-6" />
                    </Button>

                    <div className="flex bg-secondary p-1 rounded-full relative">
                        <div
                            className={cn(
                                "absolute top-1 bottom-1 w-1/2 bg-background rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                type === 'INCOME' ? "translate-x-full" : "translate-x-0"
                            )}
                        />
                        <button
                            onClick={() => { setType('EXPENSE'); setActiveGroupKey('group_food') }}
                            className={cn("relative z-10 px-4 py-1 text-sm font-medium transition-colors duration-300",
                                type === 'EXPENSE' ? "text-foreground" : "text-muted-foreground")}
                        >
                            {t('expense')}
                        </button>
                        <button
                            onClick={() => { setType('INCOME'); setActiveGroupKey('group_income') }}
                            className={cn("relative z-10 px-4 py-1 text-sm font-medium transition-colors duration-300",
                                type === 'INCOME' ? "text-foreground" : "text-muted-foreground")}
                        >
                            {t('income')}
                        </button>
                    </div>

                    <div className="w-10 flex justify-end">
                        {/* Placeholder for settings or other actions */}
                    </div>
                </header>

                {/* 2. Amount Display */}
                <div className="shrink-0 py-2 flex flex-col items-center justify-center relative">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full flex items-center gap-2 cursor-pointer hover:bg-secondary transition-colors"
                            onClick={() => setShowDatePicker(true)}
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(date), "MMM d")}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-center text-6xl font-black tracking-tight relative px-8">
                        <span className="text-3xl text-muted-foreground absolute left-0 top-2 font-medium">$</span>
                        <span>{formattedAmount}</span>
                        {/* Blinking Cursor */}
                        <div className="w-1 h-12 bg-primary ml-1 animate-[blink_1s_step-end_infinite]" />
                    </div>
                </div>

                {/* 3. Category & Note (Flexible) */}
                <div className="flex-1 flex flex-col min-h-0 bg-secondary/10 rounded-t-[2rem] overflow-hidden mt-2 relative border-t border-border/50">
                    {/* Horizontal Tabs */}
                    <div className="flex overflow-x-auto gap-2 p-4 pb-2 scrollbar-hide shrink-0 snap-x">
                        {groupedCategories.map(group => {
                            const isActive = activeGroupKey === group.key
                            const label = group.key.startsWith('group_') ? t(group.key as any) : group.label;
                            return (
                                <button
                                    key={group.key}
                                    onClick={() => setActiveGroupKey(group.key)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm snap-start",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-primary/20"
                                            : "bg-[var(--bg-surface-white)] text-muted-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Category Grid area */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <CategoryGridMobile items={currentGroupItems} cols={4} />
                    </div>

                    {/* Note Input */}
                    <div className="mx-4 mb-3 mt-2 shrink-0 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Pen className="h-4 w-4" />
                        </div>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={t('note')}
                            className="w-full bg-[var(--bg-surface-white)] h-10 pl-10 pr-4 rounded-xl text-sm shadow-sm border-none outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 text-foreground"
                        />
                    </div>
                </div>

                {/* 4. Custom Keypad (Bottom Fixed) */}
                <div className="h-[38vh] bg-background border-t border-border/50 px-4 pb-4 pt-2">
                    <div className="grid grid-cols-4 grid-rows-4 gap-3 h-full">
                        {/* Num Pad (3 cols) */}
                        {['7', '8', '9'].map(k => (
                            <Key key={k} val={k} onClick={handleDigit} />
                        ))}
                        <button onClick={handleBackspace} className="flex items-center justify-center rounded-2xl bg-secondary/50 text-foreground text-xl font-medium active:scale-95 transition-all hover:bg-secondary">
                            <Delete className="h-6 w-6" />
                        </button>

                        {['4', '5', '6'].map(k => (
                            <Key key={k} val={k} onClick={handleDigit} />
                        ))}
                        <button onClick={() => setDate(toStartOfDayIso(new Date()))} className="flex flex-col items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all hover:bg-secondary">
                            <span>Today</span>
                        </button>

                        {['1', '2', '3'].map(k => (
                            <Key key={k} val={k} onClick={handleDigit} />
                        ))}
                        {/* OK Button - Spans 2 rows visually or we keep strictly grid? Spec says Bottom Right Largest.
                             If we use Grid Row Span on the last col... */}
                        <button
                            onClick={handleSubmit}
                            disabled={Number.parseFloat(amount) <= 0 || !selectedCategoryId || !selectedAccountId}
                            className="row-span-2 rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
                        >
                            {t('ok')}
                        </button>

                        <Key val="." onClick={handleDigit} />
                        <Key val="0" onClick={handleDigit} />
                        <button className="flex items-center justify-center rounded-2xl bg-transparent" />
                    </div>
                </div>
            </main>

            {/* --- DESKTOP LAYOUT (>=md) --- */}
            <main className="hidden md:block min-h-screen bg-background p-4 pb-24 space-y-6">
                <header className="flex items-center gap-4 pt-8 pb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => router.back()}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t('add')} {type === 'INCOME' ? t('income') : t('expense')}
                    </h1>
                </header>

                <section className="neumorphic-flat border-none rounded-[2rem] p-6">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                        {/* Left Panel: Inputs */}
                        <div className="bg-[var(--surface-muted)] rounded-3xl p-6 flex flex-col gap-6 border border-border/20">
                            {/* Segmented Control */}
                            <div className="flex rounded-full p-1 neu-raised">
                                <div
                                    className={cn(
                                        "w-1/2 bg-background rounded-full shadow-sm transition-all duration-300 absolute h-full top-0 left-0",
                                        // Need manual width/transform logic here or just simple styling for now.
                                        // Actually, let's use the simple conditional styling logic for desktop to save complexity
                                        "hidden"
                                    )}
                                />
                                <button
                                    onClick={() => { setType('EXPENSE'); setActiveGroupKey('group_food') }}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out z-10",
                                        type === 'EXPENSE' ? "neu-inset text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    {t('expense')}
                                </button>
                                <button
                                    onClick={() => { setType('INCOME'); setActiveGroupKey('group_income') }}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out z-10",
                                        type === 'INCOME' ? "neu-inset text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    {t('income')}
                                </button>
                            </div>

                            {/* Amount Input (Editable) */}
                            <div className="flex flex-col justify-center">
                                <label className="text-sm font-medium text-muted-foreground mb-4 block">{t('amount')}</label>
                                <div className="relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl text-muted-foreground font-light">$</span>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={isAmountFocused ? amount : formattedAmount}
                                        onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                                        onFocus={() => setIsAmountFocused(true)}
                                        onBlur={() => {
                                            setIsAmountFocused(false)
                                            setAmount(formattedAmount)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSubmit()
                                            if (e.key === 'Escape') router.back()
                                        }}
                                        className="w-full bg-transparent text-6xl font-bold outline-none pl-10 placeholder:text-muted-foreground/20 text-foreground"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">{t('date')}</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={format(new Date(date), "yyyy-MM-dd")}
                                            onChange={(e) => setDate(dateInputToStartOfDayIso(e.target.value))}
                                            className="w-full bg-[var(--surface)] h-12 pl-10 pr-4 rounded-xl text-sm border border-border/40 outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">{t('note')}</label>
                                    <div className="relative">
                                        <Pen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                            placeholder={t('note')}
                                            className="w-full bg-[var(--surface)] h-12 pl-10 pr-4 rounded-xl text-sm border border-border/40 outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">{t('select_account')}</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => {
                                            setSelectedAccountId(e.target.value)
                                            setLastAccountId(e.target.value)
                                        }}
                                        className="w-full bg-[var(--surface)] h-12 px-4 rounded-xl text-sm border border-border/40 outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-no-repeat"
                                        style={{ backgroundImage: 'none' }}
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-2">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => router.back()}>
                                    {t('cancel')}
                                </Button>
                                <Button
                                    className="flex-1 h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/25"
                                    onClick={handleSubmit}
                                    disabled={Number.parseFloat(amount) <= 0 || !selectedCategoryId}
                                >
                                    {t('ok')}
                                </Button>
                            </div>
                        </div>

                        {/* Right Panel: Categories */}
                        <div className="flex flex-col gap-4 min-w-0">
                            <h3 className="text-2xl font-bold tracking-tight">{t('choose_category')}</h3>

                            {/* Desktop Category Selector (Split or Grid) */}
                            <div className="flex flex-col gap-4 md:flex-row">
                                {/* Group List (Sidebar) */}
                                <div className="w-full md:w-48 flex flex-col gap-2 pr-2 shrink-0">
                                    {groupedCategories.map(group => {
                                        const isActive = activeGroupKey === group.key
                                        const label = group.key.startsWith('group_') ? t(group.key as any) : group.label;
                                        return (
                                            <button
                                                key={group.key}
                                                onClick={() => setActiveGroupKey(group.key)}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 ease-in-out",
                                                    isActive ? "neu-inset text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Category Grid */}
                                <div className="flex-1 bg-[var(--surface-muted)] rounded-3xl p-6 pb-8 min-w-0 shadow-inner">
                                    {/* Reduced grid density: cols-3 on md, cols-4 on xl */}
                                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                                        {currentGroupItems.map(cat => {
                                            const Icon = getCategoryIcon(cat.icon)
                                            const isSelected = selectedCategoryId === cat.id
                                            const catName = cat.translationKey ? t(cat.translationKey as any) : cat.name

                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setSelectedCategoryId(cat.id)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-3 transition-all duration-200 ease-in-out p-3 rounded-2xl hover:bg-[var(--surface)] min-w-0 h-auto",
                                                        isSelected ? "bg-[var(--surface)] ring-2 ring-primary/60 shadow-sm scale-105" : ""
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-16 h-16 shrink-0 rounded-full flex items-center justify-center transition-all",
                                                            isSelected ? "bg-primary text-white shadow-primary/30" : "bg-[var(--surface)] text-muted-foreground shadow-sm"
                                                        )}
                                                        style={{ backgroundColor: isSelected && cat.color ? cat.color : undefined }}
                                                    >
                                                        <Icon className={cn("h-8 w-8", isSelected ? "text-white" : "")} />
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-medium text-center w-full break-words whitespace-normal leading-tight",
                                                        isSelected ? "text-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {catName}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

function Key({ val, onClick }: Readonly<{ val: string, onClick: (v: string) => void }>) {
    return (
        <button
            onClick={() => onClick(val)}
            className="flex items-center justify-center rounded-2xl bg-[var(--bg-surface-white)] text-foreground border border-border/30 text-2xl font-semibold shadow-sm active:scale-95 transition-all hover:bg-secondary/50"
        >
            {val}
        </button>
    )
}
