'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export interface ReceiptData {
    amount?: number;
    date?: string; // ISO format YYYY-MM-DD
    merchant?: string;
    categoryId?: string; // STRICT MATCH from provided list
    currency?: string;
}

export async function scanReceipt(formData: FormData): Promise<{ success: boolean; data?: ReceiptData; error?: string }> {
    try {
        const file = formData.get("file") as File
        if (!file) {
            return { success: false, error: "No file provided" }
        }

        const apiKey = process.env.GOOGLE_API_KEY
        if (!apiKey) {
            return { success: false, error: "API Key not configured" }
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString("base64")

        // Models to try in order of preference (Highest -> Lowest)
        // 1. gemini-2.5-flash (Best Quality)
        // 2. gemini-2.5-flash-lite (Higher Limits / Fallback)
        // 3. gemini-1.5-flash (Legacy Fallback)
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"]

        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                // Initialize current model
                const model = genAI.getGenerativeModel({ model: modelName })

                // Strictly defined categories for the AI to choose from
                const CATEGORIES_CONTEXT = `
                EXPENSE CATEGORIES:
                - 1: Dining (餐饮美食)
                - 2: Meals (早餐/午餐/晚餐)
                - 3: Drinks/Fruits (饮料水果)
                - 4: Snacks/Alcohol (零食烟酒)
                - 5: Groceries (买菜食材)
                - 6: Takeout (外卖)
                - 7: Public Transport (公共交通)
                - 8: Taxi/Rideshare (打车/网约车)
                - 9: Private Car/Fuel (私家车)
                - 12: Clothing/Shoes (服饰鞋包)
                - 13: Beauty/Cosmetics (护肤美妆)
                - 14: Daily Supplies (日用百货)
                - 15: Electronics (数码家电)
                - 18: Rent/Mortgage (房租/房贷)
                - 28: Medical/Meds (药品医疗)
                - 38: Pets (宠物费用)
                - 40: Fees (手续费)
                
                Use ID "38" for Pets. Use ID "12" for Clothes. Default to best guess.
                If uncertain, omit categoryId.
                `

                // Prompt
                const prompt = `
                    Analyze this receipt image and extract the following information in JSON format:
                    1. amount: Total amount (number).
                    2. date: formatted YYYY-MM-DD.
                    3. merchant: Store name.
                    4. categoryId: The ID string from the provided list that best matches the items.
                    
                    ${CATEGORIES_CONTEXT}
        
                    Return ONLY raw JSON.
                `

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: file.type
                        }
                    }
                ])

                const response = await result.response
                const text = response.text()
                console.log(`Gemini Raw Response (${modelName}):`, text) // Debugging

                // Robust JSON extraction
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error("No JSON found in response")
                }

                const cleanedText = jsonMatch[0]
                const data = JSON.parse(cleanedText) as ReceiptData

                return { success: true, data }

            } catch (error) {
                console.warn(`Model ${modelName} failed, trying next... Error:`, error)
                lastError = error;
                // Continue loop to try next model
            }
        }

        // If we get here, all models failed
        console.error("All Gemini models failed. Last error:", lastError)
        return { success: false, error: "Failed to process receipt with all available models." }

    } catch (error) {
        console.error("Gemini Scan Error:", error)
        return { success: false, error: "System error during scanning." }
    }
}
