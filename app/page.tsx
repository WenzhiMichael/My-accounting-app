"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { format } from "date-fns"
import { Wallet, CreditCard as CreditCardIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { accounts, transactions, categories } = useStore()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Guard rendering until the component has mounted to avoid hydration issues
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const totalAssets = accounts
    .filter(a => a.type !== 'CREDIT')
    .reduce((sum, a) => sum + a.balance, 0)

  const netWorth = totalAssets + accounts
    .filter(a => a.type === 'CREDIT')
    .reduce((sum, a) => sum + a.balance, 0)

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <main className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center pt-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>
        <Link href="/accounts">
          <Button variant="outline" size="icon" className="rounded-full">
            <Wallet className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* Net Worth Card */}
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-6">
              <p className="text-sm opacity-80">Net Worth</p>
              <h2 className="text-2xl font-bold mt-1">
                ¥{netWorth.toLocaleString()}
              </h2>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Monthly Exp.</p>
              <h2 className="text-2xl font-bold mt-1 text-foreground">
                ¥{transactions
                  .filter(t => t.type === 'EXPENSE' && new Date(t.date).getMonth() === new Date().getMonth())
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </h2>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Credit Cards Status */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Credit Cards</h3>
          <Link href="/accounts" className="text-sm text-primary">Manage</Link>
        </div>
        <div className="space-y-3">
          {accounts.filter(a => a.type === 'CREDIT').length === 0 ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <CreditCardIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No credit cards added</p>
                <Link href="/accounts">
                  <Button variant="link" size="sm">Add Card</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            accounts.filter(a => a.type === 'CREDIT').map(card => (
              <Card key={card.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: card.color }}
                      >
                        {card.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium">{card.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Bill Day: {card.billingDay || '-'} / Due: {card.dueDay || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={cn("font-bold", card.balance < 0 ? "text-destructive" : "text-primary")}>
                        {card.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar for Limit */}
                  {card.limit && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used: {Math.round((Math.abs(card.balance) / card.limit) * 100)}%</span>
                        <span>Limit: {card.limit.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min((Math.abs(card.balance) / card.limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            recentTransactions.map(tx => {
              const category = categories.find(c => c.id === tx.categoryId)
              return (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: category?.color || '#999' }}
                    >
                      {/* We would use Lucide icons here dynamically but for now just first letter */}
                      {category?.name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{category?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.date), "MMM d, h:mm a")}
                        {tx.note && ` • ${tx.note}`}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-medium",
                    tx.type === 'EXPENSE' ? "text-foreground" : "text-green-600"
                  )}>
                    {tx.type === 'EXPENSE' ? '-' : '+'}¥{tx.amount.toLocaleString()}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </main>
  )
}
