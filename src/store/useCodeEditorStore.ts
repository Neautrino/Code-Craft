import { CodeEditorState } from "@/types";
import { LANGUAGE_CONFIG } from "@/app/(home)/_constants";
import { Monaco } from "@monaco-editor/react";
import { create } from "zustand";

const getInitialState = () => {

    // if we're on the server, return default values
    if( typeof window === 'undefined') {
        return {
            language: 'javascript',
            fontSize: 16,
            theme: 'vs-dark',
        }
    }

    // if we're on the client, get values from local storage
    const savedLanguage = localStorage.getItem('editor-language') || 'javascript';
    const savedFontSize = localStorage.getItem('editor-font-size') || '16';
    const savedTheme = localStorage.getItem('editor-theme') || 'vs-dark';

    return {
        language: savedLanguage,
        fontSize: Number(savedFontSize),
        theme: savedTheme,
    }
}

export const useCodeEditorStore = create<CodeEditorState>((set, get) => {

    const initialState = getInitialState();

    return {
        ...initialState,
        output: "",
        isRunning: false,
        error: null,
        editor: null,
        executionResult: null,

        getCode: () => get().editor?.getValue() || "",

        setEditor: (editor: Monaco) => {
            const savedCode = localStorage.getItem(`editor-code-${get().language}`);
            if(savedCode) editor.setValue(savedCode);

            set({ editor });
        },

        setTheme: (theme: string) => {
            localStorage.setItem('editor-theme', theme);
            set({ theme });
        },

        setFontSize: (fontSize: number) => {
            localStorage.setItem('editor-font-size', fontSize.toString());
            set({ fontSize });
        },

        setLanguage: (language: string) => {
            const currentCOde = get().editor?.getValue() || "";
            if(currentCOde){
                localStorage.setItem(`editor-code-${get().language}`, currentCOde);
            }

            localStorage.setItem('editor-language', language);

            set({
                language,
                output: "",
                error: null,
            })
        },

        runCode: async() => {
            //TODO: Implement code execution
        }
    }
})