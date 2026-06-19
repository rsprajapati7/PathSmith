import React from "react";

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="border border-danger/60 bg-danger/5 p-4 font-mono text-xs text-danger tracking-wide flex items-start gap-3 my-4">
      <span className="font-bold select-none text-sm leading-none">[!]</span>
      <div>
        <p className="font-bold uppercase tracking-wider mb-1">SYSTEM EXCEPTION ENCOUNTERED</p>
        <p className="opacity-90">{message.toUpperCase()}</p>
      </div>
    </div>
  );
}
