# My Accounting App 💰

A modern, mobile-first personal finance tracker built with the latest web technologies. Features a responsive design that adapts seamlessly between mobile touch interfaces and desktop workflows, robust distinct account tracking, and localized content.

## 🚀 Tech Stack

 Built with the bleeding edge of the React ecosystem:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Core**: [React 19](https://react.dev/)
- **State Management**: [Zustand 5](https://zustand-demo.pmnd.rs/) (Persisted local storage)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Utilities**: `date-fns`, `uuid`

## ✨ Key Features

### 📱 Responsive User Interface
- **Mobile-First Experience**: Touch-optimized layouts with bottom sheets, custom numeric keypads, and horizontal scrolling tabs.
- **Desktop Enhanced**: Expands into floating modal cards, sidebar navigation, and keyboard-driven workflows on larger screens.
- **Theming**: Fully supported **Light**, **Dark**, and **System** modes with polished Neumorphic aesthetic details.

### 💸 Transaction Management
- **Add Expense/Income**:
  - **Quick Entry**: Custom keypad with large tap targets.
  - **Smart Categorization**: Horizontal tabs (mobile) or Sidebar (desktop) for rapid category selection.
  - **Inputs**: Integrated date picker, calculator-like logic, notes, and recurring transaction settings.
- **Filtering**: View transactions by timeframe (7 Days, 30 Days, 6 Months, All Time) or by specific Account.
- **Recurring Engine**: Support for Daily, Weekly, and Monthly recurring transactions.

### 📊 Dashboard & Analytics
- **Financial Overview**: At-a-glance cards for Total Balance, Monthly Income, and Monthly Expenses.
- **Visualizations**: Interactive pie charts breaking down expenses by category.
- **Account Summary**: Quick list of all accounts and their current standings.

### 🛡️ Security & Settings
- **App Lock**: Privacy protection via Passcode or Biometric (if supported) authentication.
- **Internationalization (i18n)**: Full support for **English** and **Chinese** (Simplified), including category names.
- **Data Privacy**: All data is stored locally in the browser (`localStorage`). No external servers or tracking.

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd My-accounting-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Mobile Testing (Local LAN)

To test the app on your phone while developing:

1. **Find your LAN IP**:
   - Windows: `ipconfig` (Look for IPv4 Address, e.g., `192.168.1.5`)
   - Mac/Linux: `ifconfig`

2. **Run Next.js with Host access**:
   ```bash
   npm run dev -- --hostname 0.0.0.0 --port 3000
   ```

3. **Connect**:
   Open your phone's browser and go to `http://<YOUR_LAN_IP>:3000`.

## 📂 Project Structure

```bash
├── app/
│   ├── accounts/       # Account management pages
│   ├── expenses/       # Transaction listing & "Add New" page
│   ├── settings/       # Settings & Appearance
│   ├── globals.css     # Tailwind v4 & Theme Variables
│   ├── layout.tsx      # Root layout & App Shell
│   └── page.tsx        # Main Dashboard
├── components/
│   ├── ui/             # Reusable UI components (Buttons, Cards)
│   └── ...
├── lib/
│   ├── i18n.ts         # Translation dictionaries & logic
│   ├── store.ts        # Zustand Store (State & Logic)
│   └── utils.ts        # CN helper & Date formatters
└── public/             # Static assets
```

## ⚙️ Configuration

### Customizing Categories
Categories are defined in `lib/store.ts`. You can add or modify the `DEFAULT_CATEGORIES` array. Ensure you also add corresponding translation keys in `lib/i18n.ts` if adding new default categories.

### Theming
Theme variables (colors, shadows) are defined in `app/globals.css`. We use CSS variables for fine-grained control over Light and Dark modes.

---

*Built with ❤️ for personal financial freedom.*
