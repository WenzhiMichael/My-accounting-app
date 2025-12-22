"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore, ThemePreference } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"

export default function SettingsPage() {
    const { preferences, setTheme, setAppLockEnabled, setPasscode, setLanguage } = useStore()
    const { t } = useTranslation()
    const [passcode, setPasscodeInput] = useState(preferences.passcode || "")
    const [passcodeConfirm, setPasscodeConfirm] = useState(preferences.passcode || "")
    const [message, setMessage] = useState<string | null>(null)

    const themes: { label: string; value: ThemePreference }[] = [
        { label: t('theme_system'), value: "system" },
        { label: t('theme_light'), value: "light" },
        { label: t('theme_dark'), value: "dark" },
    ]

    const savePasscode = () => {
        setMessage(null)
        if (passcode !== passcodeConfirm) {
            setMessage(t('passcode_mismatch'))
            return
        }
        setPasscode(passcode || undefined)
        setMessage(passcode ? t('passcode_saved') : t('passcode_cleared'))
    }

    const handleExport = () => {
        const data = useStore.getState()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `my-accounting-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!confirm(t('import_confirm'))) {
            e.target.value = ""
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string)
                if (json.accounts && json.transactions) {
                    useStore.setState(json)
                    alert(t('import_success'))
                } else {
                    alert(t('import_invalid'))
                }
            } catch (err) {
                console.error(err)
                alert(t('import_error'))
            }
        }
        reader.readAsText(file)
        e.target.value = ""
    }

    return (
        <main className="min-h-screen bg-background p-4 pb-24 space-y-6">
            <header className="pt-8 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
                <p className="text-muted-foreground text-sm">{t('settings_subtitle')}</p>
            </header>

            <Card className="glass">
                <CardContent className="p-4 space-y-3">
                    <h2 className="font-semibold text-lg">{t('language')}</h2>
                    <p className="text-sm text-muted-foreground">{t('choose_language')}</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={preferences.language === 'zh' ? "default" : "outline"}
                            onClick={() => setLanguage('zh')}
                            className="w-full rounded-xl"
                        >
                            {t('language_zh')}
                        </Button>
                        <Button
                            variant={preferences.language === 'en' ? "default" : "outline"}
                            onClick={() => setLanguage('en')}
                            className="w-full rounded-xl"
                        >
                            {t('language_en')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="neumorphic-flat">
                <CardContent className="p-4 space-y-3">
                    <h2 className="font-semibold text-lg">{t('theme')}</h2>
                    <p className="text-sm text-muted-foreground">{t('choose_theme')}</p>
                    <div className="grid grid-cols-3 gap-2">
                        {themes.map((option) => (
                            <Button
                                key={option.value}
                                variant={preferences.theme === option.value ? "default" : "outline"}
                                onClick={() => setTheme(option.value)}
                                className="w-full rounded-xl"
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="neumorphic-flat">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-lg">{t('app_lock')}</h2>
                            <p className="text-sm text-muted-foreground">
                                {t('require_biometrics')}
                            </p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={preferences.appLockEnabled}
                                onChange={(e) => setAppLockEnabled(e.target.checked)}
                                className="h-4 w-4 accent-primary"
                            />
                            {t('enable')}
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('passcode')}</label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscodeInput(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none"
                                placeholder={t('passcode_placeholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('passcode_confirm')}</label>
                            <input
                                type="password"
                                value={passcodeConfirm}
                                onChange={(e) => setPasscodeConfirm(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none"
                                placeholder={t('passcode_repeat_placeholder')}
                            />
                        </div>
                    </div>
                    <Button className="w-full rounded-xl" onClick={savePasscode}>
                        {t('save')}
                    </Button>
                    {message && <p className="text-sm text-muted-foreground">{message}</p>}
                    <p className="text-xs text-muted-foreground">
                        {t('biometrics_note')}
                    </p>
                </CardContent>
            </Card>

            <Card className="neumorphic-flat">
                <CardContent className="p-4 space-y-4">
                    <div>
                        <h2 className="font-semibold text-lg">{t('data_management')}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t('backup_restore_description')}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full rounded-xl" onClick={handleExport}>
                            {t('export_data')}
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Button variant="outline" className="w-full rounded-xl pointer-events-none">
                                {t('import_data')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main >
    )
}
