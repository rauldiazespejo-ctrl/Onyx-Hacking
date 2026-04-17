import { useState, useRef, useEffect } from "react";
import { useOnyxStore } from "../../store/onyx";

export function TerminalPanel() {
  const { terminalOutput, addTerminalLine, clearTerminal, activeProject, addTarget } = useOnyxStore();
  const [input, setInput] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const handleCommand = (cmd: string) => {
    addTerminalLine(`\x1b[32monyx@pentest\x1b[0m:\x1b[34m~\x1b[0m$ ${cmd}`);

    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();

    switch (command) {
      case "help":
        addTerminalLine("");
        addTerminalLine("  \x1b[36mAvailable Commands:\x1b[0m");
        addTerminalLine("  \x1b[33mhelp\x1b[0m          Show this help message");
        addTerminalLine("  \x1b[33mclear\x1b[0m         Clear terminal");
        addTerminalLine("  \x1b[33mnew <name>\x1b[0m    Create new project");
        addTerminalLine("  \x1b[33mtarget <host>\x1b[0m  Add target to project");
        addTerminalLine("  \x1b[33mscan\x1b[0m          Start scan on active target");
        addTerminalLine("  \x1b[33mstatus\x1b[0m        Show current status");
        addTerminalLine("  \x1b[33mversion\x1b[0m       Show version info");
        addTerminalLine("");
        break;
      case "clear":
        clearTerminal();
        break;
      case "version":
        addTerminalLine("  \x1b[36mONYX Security Suite v0.1.0-alpha\x1b[0m");
        addTerminalLine("  \x1b[90mDesktop Edition — Rust + Tauri\x1b[0m");
        break;
      case "status":
        if (activeProject) {
          addTerminalLine(`  \x1b[32mProject:\x1b[0m ${activeProject.name}`);
          addTerminalLine(`  \x1b[32mTargets:\x1b[0m ${activeProject.targets.length}`);
          addTerminalLine(`  \x1b[32mStatus:\x1b[0m ${activeProject.status}`);
        } else {
          addTerminalLine("  \x1b[33mNo active project. Use 'new <name>' to create one.\x1b[0m");
        }
        break;
      case "new":
        if (parts[1]) {
          addTerminalLine(`  \x1b[90mCreating project "${parts[1]}"...\x1b[0m`);
          useOnyxStore.getState().createProject(parts.slice(1).join(" "));
        } else {
          addTerminalLine("  \x1b[31mUsage: new <project-name>\x1b[0m");
        }
        break;
      case "target":
        if (parts[1] && activeProject) {
          addTarget(activeProject.id, parts[1]);
        } else if (!activeProject) {
          addTerminalLine("  \x1b[31mNo active project. Create one first with 'new <name>'.\x1b[0m");
        } else {
          addTerminalLine("  \x1b[31mUsage: target <host>\x1b[0m");
        }
        break;
      case "scan":
        addTerminalLine("  \x1b[33mScan simulation would start here.\x1b[0m");
        addTerminalLine("  \x1b[90mUse the Recon module UI for interactive scanning.\x1b[0m");
        break;
      default:
        if (cmd.trim()) {
          addTerminalLine(`  \x1b[31mCommand not found: ${command}\x1b[0m`);
          addTerminalLine("  Type 'help' for available commands.");
        }
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      handleCommand(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0E] rounded-lg border border-border overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[11px] text-text-muted ml-2">Terminal</span>
        </div>
        <button
          onClick={clearTerminal}
          className="text-[10px] text-text-muted hover:text-text px-2 py-0.5 rounded hover:bg-surface-2"
        >
          Clear
        </button>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 terminal-text text-xs leading-5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalOutput.map((line, i) => (
          <TerminalLine key={i} line={line} />
        ))}
        <div className="flex items-center">
          <span className="text-[#00FFC8]">onyx@pentest</span>
          <span className="text-[#4A9EFF]">:</span>
          <span className="text-[#4A9EFF]">~</span>
          <span className="text-text-muted">$ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-text terminal-text text-xs ml-1"
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

function TerminalLine({ line }: { line: string }) {
  // Parse ANSI-like color codes
  const renderLine = () => {
    const parts: React.ReactNode[] = [];
    const regex = /\x1b\[([0-9;]+)m/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(line)) !== null) {
      // Text before this escape
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++} className="text-text">
            {line.slice(lastIndex, match.index)}
          </span>
        );
      }
      const code = match[1];
      const className = getAnsiClass(code);
      parts.push(
        <span key={key++} className={className}>
          {/* Content will be added after the closing sequence */}
        </span>
      );
      lastIndex = regex.lastIndex;

      // Find closing sequence
      const closeMatch = /\x1b\[0m/.exec(line.slice(lastIndex));
      if (closeMatch) {
        const text = line.slice(lastIndex, lastIndex + closeMatch.index);
        // Update last part with the text
        parts[parts.length - 1] = (
          <span key={key - 1} className={className}>
            {text}
          </span>
        );
        lastIndex += closeMatch.index + 4;
      }
    }

    if (lastIndex < line.length) {
      parts.push(
        <span key={key++} className="text-text">
          {line.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return <div className="whitespace-pre">{renderLine()}</div>;
}

function getAnsiClass(code: string): string {
  const map: Record<string, string> = {
    "32": "text-[#27C93F]",
    "31": "text-[#FF5F56]",
    "33": "text-[#FFBD2E]",
    "36": "text-[#00FFC8]",
    "34": "text-[#4A9EFF]",
    "90": "text-[#6C7A89]",
    "0": "text-text",
  };
  return map[code] || "text-text";
}
