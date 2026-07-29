"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Checkbox,
  IconButton,
  Toggle,
} from "./aperture-ui";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
}

const defaultCommands: CommandItem[] = [
  { id: "import", label: "Import RAW files", category: "File", shortcut: "⌘ I" },
  { id: "develop", label: "Develop selected asset", category: "Process", shortcut: "↵" },
  { id: "mono", label: "Apply monochrome profile", category: "Profile", shortcut: "M" },
  { id: "contact", label: "Open contact sheet", category: "View", shortcut: "G" },
  { id: "export", label: "Export selection", category: "File", shortcut: "⌘ E" },
  { id: "metadata", label: "Inspect metadata", category: "View", shortcut: "I" },
];

export function CommandTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="command-trigger" onClick={onOpen} type="button">
      <SearchIcon />
      <span>Search commands, assets, metadata…</span>
      <kbd>⌘ K</kbd>
    </button>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  onCommand,
  commands = defaultCommands,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommand: (command: CommandItem) => void;
  commands?: CommandItem[];
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const titleId = useId();
  const listId = useId();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.category}`.toLowerCase().includes(term),
    );
  }, [commands, query]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing =
        target?.matches("input, textarea, select, [contenteditable='true']");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !editing) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open]);

  const runCommand = (command: CommandItem) => {
    onCommand(command);
    onOpenChange(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!filtered.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      runCommand(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
    }
  };

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div
      className="command-palette-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false);
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="command-palette"
        onKeyDown={trapFocus}
        ref={dialogRef}
        role="dialog"
      >
        <div className="command-palette__topline">
          <span>Command index</span>
          <span>01—{String(commands.length).padStart(2, "0")}</span>
        </div>
        <div className="command-palette__header">
          <h3 id={titleId}>Command palette</h3>
          <IconButton label="Close command palette" onClick={() => onOpenChange(false)}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="command-palette__search">
          <SearchIcon />
          <input
            aria-activedescendant={
              filtered.length ? `command-${filtered[activeIndex].id}` : undefined
            }
            aria-controls={listId}
            aria-expanded="true"
            aria-label="Search commands"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command…"
            ref={inputRef}
            role="combobox"
            value={query}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-palette__list" id={listId} role="listbox">
          {filtered.map((command, index) => (
            <button
              aria-selected={index === activeIndex}
              className="command-palette__option"
              id={`command-${command.id}`}
              key={command.id}
              onClick={() => runCommand(command)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              type="button"
            >
              <span className="command-palette__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{command.label}</strong>
                <small>{command.category}</small>
              </span>
              <kbd>{command.shortcut ?? "↵"}</kbd>
            </button>
          ))}
          {!filtered.length && (
            <div className="command-palette__empty">No matching commands</div>
          )}
        </div>
      </div>
    </div>
  );
}

const viewModes = ["Grid", "List", "Contact sheet"];

export function ViewMenu({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const handleItemKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const items =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]',
      );
    if (!items) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      rootRef.current?.querySelector<HTMLButtonElement>(".view-menu__trigger")?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    items[next]?.focus();
  };

  return (
    <div className="view-menu" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        className="view-menu__trigger"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() =>
              rootRef.current
                ?.querySelector<HTMLButtonElement>('[role="menuitemradio"]')
                ?.focus(),
            );
          }
        }}
        type="button"
      >
        <ListIcon />
        <span>View</span>
        <ChevronIcon />
      </button>
      {open && (
        <div className="view-menu__panel" id={menuId} role="menu">
          {viewModes.map((mode, index) => (
            <button
              aria-checked={mode === value}
              key={mode}
              onClick={() => {
                onValueChange(mode);
                setOpen(false);
              }}
              onKeyDown={(event) => handleItemKey(event, index)}
              role="menuitemradio"
              type="button"
            >
              <span>{mode}</span>
              {mode === value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TooltipButton({
  label,
  children,
  onClick,
  active,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const tooltipId = useId();
  return (
    <span className="tooltip-control">
      <button
        aria-describedby={tooltipId}
        aria-pressed={active}
        className={cx("workflow-icon-button", active && "is-active")}
        onClick={onClick}
        type="button"
      >
        {children}
        <span>{label}</span>
      </button>
      <span className="tooltip-control__bubble" id={tooltipId} role="tooltip">
        {label}
      </span>
    </span>
  );
}

export function WorkflowToolbar({
  viewMode,
  onViewModeChange,
  onOpenCommands,
}: {
  viewMode: string;
  onViewModeChange: (value: string) => void;
  onOpenCommands: () => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [sortActive, setSortActive] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [exposure, setExposure] = useState(0.3);
  const [contrast, setContrast] = useState(10);
  const [highlights, setHighlights] = useState(-25);
  const popoverId = useId();

  return (
    <div className="workflow-toolbar">
      <CommandTrigger onOpen={onOpenCommands} />
      <div className="workflow-toolbar__tools" aria-label="Asset tools">
        <ViewMenu onValueChange={onViewModeChange} value={viewMode} />
        <TooltipButton
          active={sortActive}
          label="Sort"
          onClick={() => setSortActive((value) => !value)}
        >
          <SortIcon />
        </TooltipButton>
        <TooltipButton
          active={filterActive}
          label="Filter"
          onClick={() => setFilterActive((value) => !value)}
        >
          <FilterIcon />
        </TooltipButton>
        <TooltipButton label="Zoom">
          <ZoomIcon />
        </TooltipButton>
        <TooltipButton label="Settings">
          <SettingsIcon />
        </TooltipButton>
      </div>
      <div className="quick-settings">
        <button
          aria-controls={popoverId}
          aria-expanded={quickOpen}
          className={cx("quick-settings__trigger", quickOpen && "is-active")}
          onClick={() => setQuickOpen((value) => !value)}
          type="button"
        >
          <ExposureIcon />
          <span>Quick settings</span>
        </button>
        {quickOpen && (
          <div className="quick-settings__panel" id={popoverId}>
            <div className="quick-settings__topline">
              <strong>Quick settings</strong>
              <button onClick={() => setQuickOpen(false)} type="button">
                <span className="sr-only">Close quick settings</span>
                <CloseIcon />
              </button>
            </div>
            <MiniSlider
              label="Exposure"
              max={1}
              min={-1}
              onChange={setExposure}
              step={0.1}
              suffix={exposure > 0 ? `+${exposure.toFixed(1)}` : exposure.toFixed(1)}
              value={exposure}
            />
            <MiniSlider
              label="Contrast"
              max={50}
              min={-50}
              onChange={setContrast}
              suffix={contrast > 0 ? `+${contrast}` : String(contrast)}
              value={contrast}
            />
            <MiniSlider
              label="Highlights"
              max={50}
              min={-50}
              onChange={setHighlights}
              suffix={String(highlights)}
              value={highlights}
            />
            <button
              className="quick-settings__reset"
              onClick={() => {
                setExposure(0);
                setContrast(0);
                setHighlights(0);
              }}
              type="button"
            >
              Reset all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniSlider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mini-slider">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <output>{suffix}</output>
    </label>
  );
}

const histogramBars = [
  2, 4, 7, 10, 14, 25, 48, 72, 58, 42, 36, 30, 28, 34, 45, 58, 76, 92,
  84, 67, 52, 37, 26, 19, 15, 12, 10, 8, 7, 12, 23, 39,
];

export function HistogramPanel() {
  const [channel, setChannel] = useState("Luma");
  return (
    <div className="histogram-panel">
      <div className="instrument-title-row">
        <span>Histogram</span>
        <div aria-label="Histogram channel">
          {["Luma", "R", "G", "B"].map((item) => (
            <button
              aria-pressed={item === channel}
              key={item}
              onClick={() => setChannel(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="histogram-panel__plot">
        <span className="histogram-panel__grid" />
        <div aria-hidden="true" className="histogram-panel__bars">
          {histogramBars.map((height, index) => (
            <i
              className={index > 29 ? "is-clipped" : undefined}
              key={`${height}-${index}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
      <p className="sr-only">
        {channel} histogram: most tones are in the midtones, with a small
        highlight clipping region.
      </p>
      <div className="histogram-panel__labels" aria-hidden="true">
        <span>Shadows</span>
        <span>Midtones</span>
        <span>Highlights</span>
      </div>
    </div>
  );
}

export function LightMeterScale({ value }: { value: number }) {
  const percentage = ((value + 3) / 6) * 100;
  return (
    <div className="light-meter">
      <span className="instrument-title">Exposure</span>
      <div className="light-meter__labels" aria-hidden="true">
        {[-3, -2, -1, 0, 1, 2, 3].map((tick) => (
          <span key={tick}>{tick > 0 ? `+${tick}` : tick}</span>
        ))}
      </div>
      <div
        aria-label="Exposure meter"
        aria-valuemax={3}
        aria-valuemin={-3}
        aria-valuenow={value}
        className="light-meter__rail"
        role="meter"
      >
        <i className="light-meter__ticks" />
        <i
          className="light-meter__needle"
          style={{ left: `${percentage}%` }}
        />
      </div>
      <output>{value > 0 ? "+" : ""}{value.toFixed(1)} EV</output>
    </div>
  );
}

const isoValues = [100, 200, 400, 800, 1600];

export function IsoDial({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  const index = Math.max(0, isoValues.indexOf(value));
  const changeIndex = (next: number) =>
    onValueChange(isoValues[Math.max(0, Math.min(isoValues.length - 1, next))]);
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowRight", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      changeIndex(index + 1);
    } else if (["ArrowLeft", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      changeIndex(index - 1);
    } else if (event.key === "PageUp") {
      event.preventDefault();
      changeIndex(index + 2);
    } else if (event.key === "PageDown") {
      event.preventDefault();
      changeIndex(index - 2);
    } else if (event.key === "Home") {
      event.preventDefault();
      changeIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      changeIndex(isoValues.length - 1);
    }
  };

  return (
    <div className="iso-control">
      <span className="instrument-title">ISO</span>
      <div className="iso-control__scale" aria-hidden="true">
        {isoValues.map((iso) => (
          <span className={iso === value ? "is-active" : undefined} key={iso}>
            {iso}
          </span>
        ))}
      </div>
      <div className="iso-control__hardware">
        <button
          aria-label="Decrease ISO"
          className="iso-control__step"
          disabled={index === 0}
          onClick={() => changeIndex(index - 1)}
          type="button"
        >
          −
        </button>
        <button
          aria-label={`ISO ${value}`}
          aria-valuemax={isoValues.length - 1}
          aria-valuemin={0}
          aria-valuenow={index}
          aria-valuetext={`ISO ${value}`}
          className="iso-control__dial"
          onKeyDown={handleKeyDown}
          role="slider"
          style={{ "--dial-turn": `${-58 + index * 29}deg` } as React.CSSProperties}
          type="button"
        >
          <span>{value}</span>
        </button>
        <button
          aria-label="Increase ISO"
          className="iso-control__step"
          disabled={index === isoValues.length - 1}
          onClick={() => changeIndex(index + 1)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function GrainControl({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <label className="grain-control">
      <span>Grain</span>
      <input
        aria-valuetext={`${value} percent grain`}
        max={100}
        min={0}
        onChange={(event) => onValueChange(Number(event.target.value))}
        type="range"
        value={value}
      />
      <output>{value}</output>
    </label>
  );
}

export function CaptureMetadata({
  iso,
  aperture,
  exposure,
  captureCount,
}: {
  iso: number;
  aperture: string;
  exposure: number;
  captureCount: number;
}) {
  return (
    <div className="capture-metadata">
      <span className="instrument-title">Capture</span>
      <dl>
        <div><dt>Frame</dt><dd>{String(captureCount + 1).padStart(3, "0")}</dd></div>
        <div><dt>Lens</dt><dd>35 mm</dd></div>
        <div><dt>Aperture</dt><dd>f/{aperture}</dd></div>
        <div><dt>Shutter</dt><dd>1/125 s</dd></div>
        <div><dt>ISO</dt><dd>{iso}</dd></div>
        <div>
          <dt>Meter</dt>
          <dd className={Math.abs(exposure) > 1.5 ? "is-warning" : undefined}>
            {exposure > 0 ? "+" : ""}{exposure.toFixed(1)} EV
          </dd>
        </div>
      </dl>
      <div className="capture-metadata__states">
        <StatusBadge label="Ready" tone="neutral" />
        <StatusBadge label="Synced" tone="active" />
        <StatusBadge label="RAW" tone="neutral" />
      </div>
    </div>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "active" | "warning";
}) {
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}

export function SelectionStates() {
  const [live, setLive] = useState(true);
  const [zebras, setZebras] = useState(true);
  const [metering, setMetering] = useState("Center");
  return (
    <div className="selection-states">
      <div>
        <span className="spec-label">Switch</span>
        <Toggle checked={live} label="Live view" onCheckedChange={setLive} />
      </div>
      <div>
        <span className="spec-label">Checkbox</span>
        <Checkbox
          checked={zebras}
          label="Highlight warning"
          onChange={(event) => setZebras(event.target.checked)}
        />
      </div>
      <fieldset>
        <legend className="spec-label">Metering</legend>
        {["Center", "Spot"].map((mode) => (
          <label className="radio-control" key={mode}>
            <input
              checked={metering === mode}
              name="metering-mode"
              onChange={() => setMetering(mode)}
              type="radio"
            />
            <span aria-hidden="true" />
            {mode}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export function FileDropzone({
  onFiles,
}: {
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const messageId = useId();
  const inputId = useId();

  const acceptFiles = (files: File[]) => {
    const valid = files.filter((file) =>
      /\.(dng|raw|nef|arw)$/i.test(file.name),
    );
    if (!valid.length) {
      setError("Choose a RAW file: DNG, RAW, NEF or ARW.");
      return;
    }
    setError("");
    onFiles(valid);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div
      className={cx("file-dropzone", dragging && "is-dragging", error && "has-error")}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <FrameUploadIcon />
      <strong>Drop RAW files</strong>
      <span>or</span>
      <label className="file-dropzone__chooser" htmlFor={inputId}>
        Choose files
      </label>
      <input
        accept=".dng,.raw,.nef,.arw"
        aria-describedby={messageId}
        className="sr-only"
        id={inputId}
        multiple
        onChange={onChange}
        ref={inputRef}
        type="file"
      />
      <small id={messageId}>
        {error || "DNG, RAW, NEF or ARW · up to 2 GB each"}
      </small>
    </div>
  );
}

export interface QueueItem {
  id: string;
  name: string;
  progress: number;
  status: "Queued" | "Developing" | "Complete";
}

export function ProcessingQueue({
  items,
  onAdvance,
}: {
  items: QueueItem[];
  onAdvance: () => void;
}) {
  return (
    <div className="processing-queue">
      <div className="processing-queue__header">
        <span>File</span>
        <span>Status</span>
        <span>Progress</span>
      </div>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <strong className={`is-${item.status.toLowerCase()}`}>{item.status}</strong>
            <div>
              <progress
                aria-label={`${item.name} progress`}
                max={100}
                value={item.progress}
              />
              <span>{item.progress}%</span>
            </div>
          </li>
        ))}
      </ol>
      <button className="processing-queue__advance" onClick={onAdvance} type="button">
        Advance queue
      </button>
    </div>
  );
}

export function TonalRangeControl({
  blackPoint,
  whitePoint,
  onChange,
}: {
  blackPoint: number;
  whitePoint: number;
  onChange: (blackPoint: number, whitePoint: number) => void;
}) {
  return (
    <fieldset className="tonal-range">
      <legend>Tonal range</legend>
      <div className="tonal-range__values">
        <label>
          Black point
          <input
            max={whitePoint - 1}
            min={0}
            onChange={(event) => onChange(Number(event.target.value), whitePoint)}
            type="number"
            value={blackPoint}
          />
        </label>
        <label>
          White point
          <input
            max={100}
            min={blackPoint + 1}
            onChange={(event) => onChange(blackPoint, Number(event.target.value))}
            type="number"
            value={whitePoint}
          />
        </label>
      </div>
      <div
        className="tonal-range__rail"
        style={{
          "--black-point": `${blackPoint}%`,
          "--white-point": `${whitePoint}%`,
        } as React.CSSProperties}
      >
        <input
          aria-label="Black point"
          max={whitePoint - 1}
          min={0}
          onChange={(event) => onChange(Number(event.target.value), whitePoint)}
          type="range"
          value={blackPoint}
        />
        <input
          aria-label="White point"
          max={100}
          min={blackPoint + 1}
          onChange={(event) => onChange(blackPoint, Number(event.target.value))}
          type="range"
          value={whitePoint}
        />
      </div>
    </fieldset>
  );
}

export function SkeletonSpecimen() {
  return (
    <div aria-label="Loading asset preview" aria-live="polite" className="skeleton-specimen">
      <span className="skeleton-specimen__image" />
      <span className="skeleton-specimen__lines">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function EmptyState({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="empty-state">
      <EmptyImageIcon />
      <div>
        <strong>No selection</strong>
        <p>Choose an asset to inspect metadata.</p>
        <button onClick={onSelect} type="button">Select first asset</button>
      </div>
    </div>
  );
}

export function WorkflowToast({
  message,
  open,
  onDismiss,
}: {
  message: string;
  open: boolean;
  onDismiss: () => void;
}) {
  if (!open) return <div aria-live="polite" className="toast-region" />;
  return (
    <div aria-live="polite" className="toast-region">
      <div className="workflow-toast" role="status">
        <CheckCircleIcon />
        <span>
          <strong>{message}</strong>
          <small>Workflow state updated</small>
        </span>
        <IconButton label="Dismiss notification" onClick={onDismiss}>
          <CloseIcon />
        </IconButton>
      </div>
    </div>
  );
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>;
}

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" /></svg>;
}

function ListIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></svg>;
}

function ChevronIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m8 10 4 4 4-4" /></svg>;
}

function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>;
}

function SortIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4" /></svg>;
}

function FilterIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 5h18l-7 8v5l-4 2v-7Z" /></svg>;
}

function ZoomIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M10.5 7v7M7 10.5h7" /></svg>;
}

function SettingsIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></svg>;
}

function ExposureIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>;
}

function FrameUploadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 48 48"><path d="M8 18V8h10M30 8h10v10M40 30v10H30M18 40H8V30" /><path d="M24 32V14M17 21l7-7 7 7" /></svg>;
}

function EmptyImageIcon() {
  return <svg aria-hidden="true" viewBox="0 0 56 56"><rect x="3" y="3" width="50" height="50" /><circle cx="18" cy="18" r="5" /><path d="m7 45 14-14 9 9 8-8 14 13" /></svg>;
}

function CheckCircleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m7 12 3 3 7-7" /></svg>;
}
