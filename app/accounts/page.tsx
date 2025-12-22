"use client"

import { useStore } from "@/lib/store"
import { useTranslation, type TxKey } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, CreditCard, Wallet, Banknote } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AccountsPage() {
    const { accounts } = useStore()
    const { t } = useTranslation()

    const getIcon = (type: string) => {
        switch (type) {
            case 'CREDIT': return CreditCard
            case 'CASH': return Banknote
            default: return Wallet
        }
    }

    return (
        <main className="min-h-screen bg-background p-4 pb-24 space-y-6">
            <header className="flex justify-between items-center pt-8 pb-4">
                <h1 className="text-3xl font-bold tracking-tight">{t('accounts')}</h1>
                <Link href="/accounts/new">
                    <Button size="icon" className="rounded-full shadow-lg">
                        <Plus className="h-6 w-6" />
                    </Button>
                </Link>
            </header>

            <div className="space-y-4">
                {accounts.map((account) => {
                    const Icon = getIcon(account.type)
                    return (
                        <Link key={account.id} href={`/accounts/${account.id}`}>
                            <Card className="overflow-hidden transition-all active:scale-[0.98] hover:border-primary">
                                <CardContent className="p-0">
                                    <div
                                        className="h-2 w-full"
                                        style={{ backgroundColor: account.color }}
                                    />
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                                                <Icon className="h-6 w-6 text-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{account.name}</h3>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {t(`account_type_${account.type}` as TxKey)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">{t('balance')}</p>
                                            <p className={cn(
                                                "text-xl font-bold",
                                                account.balance < 0 ? "text-destructive" : "text-primary"
                                            )}>
                                                CA${account.balance.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {account.type === 'CREDIT' && (
                                        <div className="px-5 pb-5 pt-0 flex gap-4 text-xs text-muted-foreground">
                                            <div className="bg-secondary/50 px-3 py-1 rounded-full">
                                                {t('bill_day')}: {account.billingDay || '-'}
                                            </div>
                                            <div className="bg-secondary/50 px-3 py-1 rounded-full">
                                                {t('due_day')}: {account.dueDay || '-'}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}

                {accounts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-secondary h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">{t('no_accounts')}</h3>
                        <p className="text-muted-foreground mb-6">{t('add_first_account')}</p>
                        <Link href="/accounts/new">
                            <Button>{t('add_account')}</Button>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    )
}
