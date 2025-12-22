"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, Plus, ListChecks, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

export function BottomNav() {
    const pathname = usePathname()
    const { t } = useTranslation()

    const links = [
        { href: "/", icon: LayoutDashboard, label: t('home') },
        { href: "/accounts", icon: CreditCard, label: t('accounts') },
        { href: "/expenses/new", icon: Plus, label: t('add'), isFab: true },
        { href: "/expenses", icon: ListChecks, label: t('transactions') },
        { href: "/settings", icon: Settings, label: t('settings') },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 neumorphic-flat pb-safe rounded-t-[2rem]">
            <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href

                    if (link.isFab) {
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex flex-col items-center justify-center -mt-12"
                            >
                                <div className="h-16 w-16 rounded-full neumorphic-flat flex items-center justify-center text-primary transition-transform hover:scale-105 active:neumorphic-pressed">
                                    <Icon className="h-8 w-8" />
                                </div>
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-16 space-y-1 transition-all duration-300 rounded-xl py-2",
                                isActive ? "neumorphic-pressed text-primary" : "text-muted-foreground hover:text-primary"
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
