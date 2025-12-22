"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"

interface Props {
    children: React.ReactNode
}

export function AppShell({ children }: Props) {
    return (
        <ThemeController>
            <AppLockGate>
                {children}
            </AppLockGate>
        </ThemeController>
    )
}

function ThemeController({ children }: Props) {
    const { preferences, setTheme } = useStore()
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        const mql = window.matchMedia("(prefers-color-scheme: dark)")
        const update = () => setSystemTheme(mql.matches ? 'dark' : 'light')
        update()
        mql.addEventListener("change", update)
        return () => mql.removeEventListener("change", update)
    }, [])

    const activeTheme = useMemo(() => {
        if (preferences.theme === 'system') {
            return systemTheme
        }
        return preferences.theme
    }, [preferences.theme, systemTheme])

    useEffect(() => {
        const root = document.documentElement
        if (preferences.theme === 'system') {
            root.removeAttribute("data-theme")
        } else {
            root.setAttribute("data-theme", preferences.theme)
        }
        root.style.colorScheme = activeTheme
    }, [preferences.theme, activeTheme])

    // Ensure legacy persisted states without preferences have defaults
    useEffect(() => {
        if (!preferences.theme) {
            setTheme('system')
        }
    }, [preferences.theme, setTheme])

    return <>{children}</>
}

function AppLockGate({ children }: Props) {
    const { preferences, setAppLockEnabled } = useStore()
    const { t } = useTranslation()
    const [locked, setLocked] = useState(preferences.appLockEnabled)
    const [passcodeInput, setPasscodeInput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const passcode = preferences.passcode
    const hasWebAuthn = typeof PublicKeyCredential !== "undefined" && "credentials" in navigator

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocked(preferences.appLockEnabled)
        setError(null)
        setPasscodeInput("")
    }, [preferences.appLockEnabled])

    if (!locked) {
        return <>{children}</>
    }

    const tryBiometric = async () => {
        setError(null)
        if (!('credentials' in navigator) || typeof PublicKeyCredential === 'undefined') {
            setError(t('biometric_not_available'))
            return
        }

        try {
            const challenge = new Uint8Array(32)
            window.crypto.getRandomValues(challenge)
            await navigator.credentials.get({
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: "required",
                }
            })
            setLocked(false)
        } catch {
            setError(t('auth_failed'))
        }
    }

    const tryPasscode = () => {
        setError(null)
        if (!passcode) {
            setError(t('no_passcode_set'))
            return
        }
        if (passcodeInput === passcode) {
            setLocked(false)
        } else {
            setError(t('incorrect_passcode'))
        }
    }

    return (
        <div className="relative">
            {children}
            <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-4 bg-card border border-border rounded-3xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-center">{t('unlock_to_continue')}</h2>
                    <p className="text-sm text-muted-foreground text-center">
                        {t('app_lock_enabled_message')}
                    </p>

                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); tryPasscode() }}>
                        <div className="flex gap-3 justify-center">
                            {hasWebAuthn && (
                                <Button type="button" onClick={tryBiometric}>{t('unlock_with_device')}</Button>
                            )}
                            {passcode && (
                                <Button type="submit" variant="outline">{t('use_passcode')}</Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('passcode_if_set')}</label>
                            <input
                                type="password"
                                value={passcodeInput}
                                onChange={(e) => setPasscodeInput(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none"
                                placeholder={t('enter_passcode')}
                            />
                        </div>

                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAppLockEnabled(false)}
                                className="text-sm"
                            >
                                {t('disable_app_lock')}
                            </Button>
                        </div>
                    </form>

                    {error && <p className="text-sm text-destructive text-center">{error}</p>}

                    {!passcode && (
                        <p className="text-xs text-muted-foreground text-center">
                            {t('app_lock_tip')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
