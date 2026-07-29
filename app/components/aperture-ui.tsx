"use client";

import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
  useEffect,
  useId,
  useRef,
} from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface PrecisionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function PrecisionButton({
  variant = "primary",
  className,
  children,
  ...props
}: PrecisionButtonProps) {
  return (
    <button
      className={cx("precision-button", `precision-button--${variant}`, className)}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cx("icon-button", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <label className={cx("field", className)} htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <input
        aria-describedby={hint || error ? messageId : undefined}
        aria-invalid={Boolean(error)}
        className="field__control"
        id={inputId}
        {...props}
      />
      {(hint || error) && (
        <span className={cx("field__message", error && "field__message--error")} id={messageId}>
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

export interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ label: string; value: string }>;
}

export function SelectField({
  label,
  options,
  id,
  className,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <label className={cx("field", className)} htmlFor={selectId}>
      <span className="field__label">{label}</span>
      <span className="select-shell">
        <select className="field__control field__control--select" id={selectId} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon />
      </span>
    </label>
  );
}

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cx("check-control", className)}>
      <input className="check-control__input" type="checkbox" {...props} />
      <span aria-hidden="true" className="check-control__box">
        <CheckIcon />
      </span>
      <span>{label}</span>
    </label>
  );
}

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

export function Toggle({
  checked,
  label,
  onCheckedChange,
  className,
  ...props
}: ToggleProps) {
  return (
    <button
      aria-checked={checked}
      className={cx("toggle-control", className)}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
      {...props}
    >
      <span aria-hidden="true" className="toggle-control__track">
        <span className="toggle-control__thumb" />
      </span>
      <span>{label}</span>
    </button>
  );
}

export interface SegmentedControlProps {
  label: string;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
}

export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
}: SegmentedControlProps) {
  const moveSelection = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const horizontalKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!horizontalKeys.includes(event.key)) return;
    event.preventDefault();

    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }

    onValueChange(options[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [nextIndex]?.focus();
  };

  return (
    <div aria-label={label} className="segmented-control" role="radiogroup">
      {options.map((option, index) => (
        <button
          aria-checked={option === value}
          className="segmented-control__option"
          key={option}
          onKeyDown={(event) => moveSelection(event, index)}
          onClick={() => onValueChange(option)}
          role="radio"
          tabIndex={option === value ? 0 : -1}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="theme-control" aria-label="Theme">
      <span>Theme</span>
      <IconButton
        aria-pressed={!dark}
        className={!dark ? "is-active" : undefined}
        label="Use light theme"
        onClick={() => dark && onToggle()}
      >
        <SunIcon />
      </IconButton>
      <IconButton
        aria-pressed={dark}
        className={dark ? "is-active" : undefined}
        label="Use dark theme"
        onClick={() => !dark && onToggle()}
      >
        <MoonIcon />
      </IconButton>
    </div>
  );
}

export function FrameCorners({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cx("frame-corners", className)}>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export interface TabsProps {
  label: string;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
}

export function Tabs({ label, options, value, onValueChange }: TabsProps) {
  const moveTab = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }
    onValueChange(options[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  };

  return (
    <div aria-label={label} className="tabs" role="tablist">
      {options.map((option, index) => (
        <button
          aria-controls={option === value ? "asset-panel" : undefined}
          aria-selected={option === value}
          className="tabs__tab"
          id={`tab-${option.toLowerCase()}`}
          key={option}
          onClick={() => onValueChange(option)}
          onKeyDown={(event) => moveTab(event, index)}
          role="tab"
          tabIndex={option === value ? 0 : -1}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  pageCount,
  onPageChange,
}: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="pagination">
      <IconButton
        disabled={currentPage === 1}
        label="Previous page"
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeftIcon />
      </IconButton>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
        <button
          aria-current={page === currentPage ? "page" : undefined}
          className="pagination__page"
          key={page}
          onClick={() => onPageChange(page)}
          type="button"
        >
          {page}
        </button>
      ))}
      <IconButton
        disabled={currentPage === pageCount}
        label="Next page"
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRightIcon />
      </IconButton>
    </nav>
  );
}

export interface AssetRow {
  asset: string;
  kind: "image" | "collection" | "video";
  profile: string;
  modified: string;
  status: "Active" | "Archived";
}

export function AssetTable({
  rows,
  onAction,
}: {
  rows: AssetRow[];
  onAction?: (asset: string, action: string) => void;
}) {
  return (
    <div
      aria-label="Asset table, horizontally scrollable on small screens"
      className="table-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="asset-table">
        <caption className="sr-only">Assets and their processing status</caption>
        <thead>
          <tr>
            <th scope="col">Asset</th>
            <th scope="col">Profile</th>
            <th scope="col">Modified</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.asset}>
              <td>
                <span className="asset-name">
                  <AssetIcon kind={row.kind} />
                  {row.asset}
                </span>
              </td>
              <td>{row.profile}</td>
              <td><time>{row.modified}</time></td>
              <td>
                <span className={`status status--${row.status.toLowerCase()}`}>
                  <i aria-hidden="true" />
                  {row.status}
                </span>
              </td>
              <td>
                <details className="asset-action-menu">
                  <summary aria-label={`Actions for ${row.asset}`} role="button">
                    <MoreIcon />
                  </summary>
                  <div>
                    {["Inspect", "Duplicate", "Archive"].map((action) => (
                      <button
                        key={action}
                        onClick={(event) => {
                          onAction?.(row.asset, action);
                          event.currentTarget.closest("details")?.removeAttribute("open");
                        }}
                        type="button"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface ApertureSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const apertureValues = ["1.4", "2", "2.8", "4", "5.6", "8", "11"];

export function ApertureSelector({
  value,
  onValueChange,
}: ApertureSelectorProps) {
  const moveAperture = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      nextIndex = Math.min(apertureValues.length - 1, currentIndex + 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = apertureValues.length - 1;
    }
    onValueChange(apertureValues[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [nextIndex]?.focus();
  };

  return (
    <div aria-label="Aperture" className="aperture-selector" role="radiogroup">
      {apertureValues.map((aperture, index) => (
        <button
          aria-checked={aperture === value}
          aria-label={`f ${aperture.replace(".", " point ")}`}
          className="aperture-selector__value"
          key={aperture}
          onClick={() => onValueChange(aperture)}
          onKeyDown={(event) => moveAperture(event, index)}
          role="radio"
          tabIndex={aperture === value ? 0 : -1}
          type="button"
        >
          <span>{aperture}</span>
          <i aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export interface ExposureControlProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function ExposureControl({
  value,
  onValueChange,
}: ExposureControlProps) {
  const percentage = ((value + 3) / 6) * 100;
  const valueText = value === 0 ? "zero EV" : `${value > 0 ? "plus" : "minus"} ${Math.abs(value)} EV`;

  return (
    <div className="exposure-control">
      <div aria-hidden="true" className="exposure-control__labels">
        {[-3, -2, -1, 0, 1, 2, 3].map((tick) => (
          <span key={tick}>{tick > 0 ? `+${tick}` : tick}</span>
        ))}
      </div>
      <div className="exposure-control__rail">
        <span aria-hidden="true" className="exposure-control__ticks" />
        <span
          aria-hidden="true"
          className="exposure-control__indicator"
          style={{ left: `${percentage}%` }}
        />
        <input
          aria-label="Exposure compensation"
          aria-valuetext={valueText}
          max={3}
          min={-3}
          onChange={(event) => onValueChange(Number(event.target.value))}
          step={1}
          type="range"
          value={value}
        />
      </div>
    </div>
  );
}

export function ShutterButton({
  onClick,
  captureCount,
}: {
  onClick: () => void;
  captureCount: number;
}) {
  return (
    <div className="shutter-control">
      <button
        aria-label="Capture"
        className="shutter-button"
        onClick={onClick}
        type="button"
      >
        <span />
      </button>
      <span aria-live="polite" className="shutter-control__status">
        {captureCount === 0 ? "Ready" : `Captured · ${captureCount}`}
      </span>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      ref={dialogRef}
    >
      <div className="confirm-dialog__header">
        <h3 id={titleId}>Apply profile?</h3>
        <IconButton label="Close dialog" onClick={() => onOpenChange(false)}>
          <CloseIcon />
        </IconButton>
      </div>
      <p id={descriptionId}>
        This will update the selected asset with the “Monochrome” profile.
      </p>
      <div className="confirm-dialog__actions">
        <button
          className="precision-button precision-button--secondary"
          onClick={() => onOpenChange(false)}
          ref={cancelRef}
          type="button"
        >
          <span>Cancel</span>
        </button>
        <PrecisionButton
          onClick={() => {
            onApply();
            onOpenChange(false);
          }}
        >
          Apply
        </PrecisionButton>
      </div>
    </dialog>
  );
}

export function SunIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93 6.7 6.7m10.6 10.6 1.77 1.77M19.07 4.93 17.3 6.7M6.7 17.3l-1.77 1.77" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M20 15.7A8.5 8.5 0 0 1 8.3 4 8.5 8.5 0 1 0 20 15.7Z" />
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M20.8 4.9a5.4 5.4 0 0 0-7.7 0L12 6l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.4a5.4 5.4 0 0 0 0-7.7Z" />
    </svg>
  );
}

export function LockIcon({ locked = false }: { locked?: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="10" width="14" x="5" y="10" />
      {locked ? (
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      ) : (
        <path d="M8 10V7a4 4 0 0 1 7.7-1.5" />
      )}
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="select-shell__icon" fill="none" viewBox="0 0 24 24">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="m3 8 3 3 7-7" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" stroke="none" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function AssetIcon({ kind }: { kind: AssetRow["kind"] }) {
  if (kind === "video") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="m8 5 11 7-11 7V5Z" />
      </svg>
    );
  }
  if (kind === "collection") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <rect height="5" width="5" x="4" y="4" />
        <rect height="5" width="5" x="15" y="4" />
        <rect height="5" width="5" x="4" y="15" />
        <rect height="5" width="5" x="15" y="15" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
