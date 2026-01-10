"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
    content: string;
}

export default function CopyButton({ content }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium transition-colors"
        >
            {copied ? (
                <>
                    <Check size={14} />
                    Copied!
                </>
            ) : (
                <>
                    <Copy size={14} />
                    Copy
                </>
            )}
        </button>
    );
}
