import { CodeEditorState } from "@/types";
import { LANGUAGE_CONFIG } from "@/app/(home)/_constants";
import { Monaco } from "@monaco-editor/react";
import { create } from "zustand";
import { version } from "os";

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
            const { language, getCode} = get();
            const code = getCode();

            if(!code) {
                set({error: "Please enter some code"})
                return
            }

            set({ isRunning: true, error: null, output: "" });

            try{
                const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
                const response = await fetch("https://emkc.org/api/v2/piston/execute", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        language: runtime.language,
                        version: runtime.version,
                        files: [{content: code}],
                    })
                })

                const data = await response.json();

                console.log("Data from Piston", data);

                // handle API-level errors
                if(data.message){
                    set({error: data.message, executionResult: { code, output: "", error: data.message }})
                    return;
                }

                // handle compilation errors
                if(data.compile && data.compile.code !== 0){
                    const error = data.compile.stderr || data.compile.output;
                    set({
                        error,
                        executionResult: {
                            code,
                            output: "",
                            error,
                        }
                    })

                    return;
                }

                // handle runtime errors
                if(data.run && data.run.code !==0) {
                    const error = data.run.stderr || data.run.output;
                    set({
                        error,
                        executionResult: {
                            code,
                            output: "",
                            error
                        }
                    })

                    return;
                }

                // no errors

                const output = data.run.output;

                set({
                    output: output.trim(),
                    error: null,
                    executionResult: {
                        code,
                        output,
                        error: null,
                    }
                })
            } catch (error) {
                console.log("Error running code", error);
                set({error: "Error running code", executionResult: {code, output: "", error: "Error running code"}});
            } finally {
                set({isRunning: false});
            }
        }
    }
})