"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore, ThemePreference } from "@/lib/store"
import { useTranslation, Language } from "@/lib/i18n"

const themes: { label: string; value: ThemePreference }[] = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
]

export default function SettingsPage() {
    const { preferences, setTheme, setAppLockEnabled, setPasscode, setLanguage } = useStore()
    const { t } = useTranslation()
    const [passcode, setPasscodeInput] = useState(preferences.passcode || "")
    const [passcodeConfirm, setPasscodeConfirm] = useState(preferences.passcode || "")
    const [message, setMessage] = useState<string | null>(null)

    const savePasscode = () => {
        setMessage(null)
        if (passcode !== passcodeConfirm) {
            setMessage("Passcodes do not match.")
            return
        }
        setPasscode(passcode || undefined)
        setMessage(passcode ? "Passcode saved." : "Passcode cleared.")
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

        if (!confirm("Importig data will overwrite your current data. Continue?")) {
            e.target.value = ""
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string)
                if (json.accounts && json.transactions) {
                    useStore.setState(json)
                    alert("Data imported successfully!")
                } else {
                    alert("Invalid data file: missing accounts or transactions.")
                }
            } catch (err) {
                console.error(err)
                alert("Error parsing JSON file.")
            }
        }
        reader.readAsText(file)
        e.target.value = ""
    }

    return (
        <main className="min-h-screen bg-background p-4 pb-24 space-y-6">
            <header className="pt-8 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
                <p className="text-muted-foreground text-sm">Appearance, language and security</p>
            </header>

            <Card>
                <CardContent className="p-4 space-y-3">
                    <h2 className="font-semibold text-lg">{t('language')}</h2>
                    <p className="text-sm text-muted-foreground">Choose your preferred language.</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={preferences.language === 'zh' ? "default" : "outline"}
                            onClick={() => setLanguage('zh')}
                            className="w-full rounded-xl"
                        >
                            中文 (Chinese)
                        </Button>
                        <Button
                            variant={preferences.language === 'en' ? "default" : "outline"}
                            onClick={() => setLanguage('en')}
                            className="w-full rounded-xl"
                        >
                            English
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 space-y-3">
                    <h2 className="font-semibold text-lg">{t('theme')}</h2>
                    <p className="text-sm text-muted-foreground">Choose light, dark, or follow system.</p>
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

            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-lg">{t('app_lock')}</h2>
                            <p className="text-sm text-muted-foreground">
                                Require biometrics or passcode on launch.
                            </p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={preferences.appLockEnabled}
                                onChange={(e) => setAppLockEnabled(e.target.checked)}
                                className="h-4 w-4 accent-primary"
                            />
                            Enable
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
                                placeholder="Set a fallback passcode"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Passcode</label>
                            <input
                                type="password"
                                value={passcodeConfirm}
                                onChange={(e) => setPasscodeConfirm(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Repeat passcode"
                            />
                        </div>
                    </div>
                    <Button className="w-full rounded-xl" onClick={savePasscode}>
                        {t('save')}
                    </Button>
                    {message && <p className="text-sm text-muted-foreground">{message}</p>}
                    <p className="text-xs text-muted-foreground">
                        Your device biometrics will be used when available. Passcode acts as a fallback.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <h2 className="font-semibold text-lg">{t('data_management')}</h2>
                        <p className="text-sm text-muted-foreground">
                            Backup or restore your data locally.
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
