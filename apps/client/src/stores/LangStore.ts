import { create } from "zustand"
import { LanguageCode } from '../types/Language';

export interface LangStoreType {
    language: LanguageCode
    changeLang: () => void
}

export const useLangStore = create<LangStoreType>((set) => ({
    language: "pl",
    changeLang: () => set((state: any) => ({
        language: (state.language == "pl" ? "en" : "pl")
    }))
}))