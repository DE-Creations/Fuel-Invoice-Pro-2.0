/// <reference types="vite/client" />

declare global {
    function route(name: string, params?: Record<string, any>): string;
}

export {};
