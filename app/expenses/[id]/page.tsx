"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore, TransactionType } from "@/lib/store"
import { cn, dateInputToStartOfDayIso, toStartOfDayIso } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

export default function EditTransactionPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const { transactions, accounts, categories, updateTransaction, deleteTransaction } = useStore()
    const { t } = useTranslation()

    const transaction = transactions.find(t => t.id === params?.id)

    const [amount, setAmount] = useState("")
    const [type, setType] = useState<TransactionType>('EXPENSE')
    const [accountId, setAccountId] = useState<string>("")
    const [categoryId, setCategoryId] = useState<string>("")
    const [note, setNote] = useState("")
    const [date, setDate] = useState<string>("")

    useEffect(() => {
        if (transaction) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAmount(transaction.amount.toString())
            setType(transaction.type)
            setAccountId(transaction.accountId)
            setCategoryId(transaction.categoryId)
            setNote(transaction.note || "")
            setDate(transaction.date)
        }
    }, [transaction])

    const dateValue = useMemo(() => {
        if (!date) return ""
        return format(new Date(date), "yyyy-MM-dd")
    }, [date])

    const handleSave = () => {
        if (!transaction) return
        const parsedAmount = parseFloat(amount)
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return
        if (!accountId || !categoryId) return

        updateTransaction(transaction.id, {
            amount: parsedAmount,
            type,
            accountId,
            categoryId,
            note,
            date: date || toStartOfDayIso(new Date()),
        })

        router.push("/expenses")
    }

    const handleDelete = () => {
        if (!transaction) return
        deleteTransaction(transaction.id)
        router.push("/expenses")
    }

    if (!transaction) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 text-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 space-y-4">
                        <p className="font-semibold text-lg">{t('transaction_not_found')}</p>
                        <p className="text-muted-foreground text-sm">{t('transaction_deleted')}</p>
                        <Link href="/expenses">
                            <Button>{t('back_to_list')}</Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background p-4 pb-24 space-y-6">
            <header className="flex items-center justify-between pt-8">
                <Link href="/expenses">
                    <Button variant="ghost" size="sm">{t('back')}</Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={handleDelete}>{t('delete')}</Button>
            </header>

            <div className="space-y-6 max-w-xl mx-auto">
                <div className="flex items-center justify-center gap-2 bg-secondary rounded-full p-1 w-fit mx-auto">
                    {(['EXPENSE', 'INCOME'] as TransactionType[]).map((typeOption) => (
                        <button
                            key={typeOption}
                            onClick={() => setType(typeOption)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                type === typeOption ? "bg-background shadow-sm" : "text-muted-foreground"
                            )}
                            type="button"
                        >
                            {typeOption === 'EXPENSE' ? t('expense') : t('income')}
                        </button>
                    ))}
                </div>

                <Card>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('amount_cad')}</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('account')}</label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('category')}</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('date')}</label>
                            <input
                                type="date"
                                value={dateValue}
                                onChange={(e) => setDate(dateInputToStartOfDayIso(e.target.value))}
                                className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('note')}</label>
                            <input
                                type="text"
                                value={note}
                                placeholder={t('optional_details')}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>

                        <Button className="w-full h-12 rounded-xl" onClick={handleSave}>
                            {t('save_changes')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
