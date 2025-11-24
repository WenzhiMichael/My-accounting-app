"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, Plus, ListChecks, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    const links = [
        { href: "/", icon: LayoutDashboard, label: "Home" },
        { href: "/accounts", icon: CreditCard, label: "Accounts" },
        { href: "/expenses/new", icon: Plus, label: "Add", isFab: true },
        { href: "/expenses", icon: ListChecks, label: "Transactions" },
        { href: "/settings", icon: Settings, label: "Settings" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
            <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href

                    if (link.isFab) {
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex flex-col items-center justify-center -mt-8"
                            >
                                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                    <Icon className="h-6 w-6" />
                                </div>
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-16 space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
