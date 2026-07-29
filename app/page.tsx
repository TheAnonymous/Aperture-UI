// Internal workspace sites can read the authenticated OpenAI user from the
// forwarded request headers:
//
// import { headers } from "next/headers";
//
// export default async function Home() {
//   const requestHeaders = await headers();
//   const email = requestHeaders.get("oai-authenticated-user-email");
//   const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
//   const fullName =
//     encodedFullName &&
//     requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
//       "percent-encoded-utf-8"
//       ? decodeURIComponent(encodedFullName)
//       : null;
//   const displayName = fullName ?? email;
//   // ...
// }

"use client";

import { useEffect, useState } from "react";
import {
  ApertureSelector,
  AssetTable,
  Checkbox,
  ConfirmDialog,
  ExposureControl,
  FrameCorners,
  HeartIcon,
  IconButton,
  LockIcon,
  Pagination,
  PrecisionButton,
  SegmentedControl,
  SelectField,
  ShutterButton,
  Tabs,
  TextField,
  ThemeToggle,
  Toggle,
} from "./components/aperture-ui";
import {
  CaptureMetadata,
  CommandItem,
  CommandPalette,
  EmptyState,
  FileDropzone,
  GrainControl,
  HistogramPanel,
  IsoDial,
  LightMeterScale,
  ProcessingQueue,
  QueueItem,
  SelectionStates,
  SkeletonSpecimen,
  StatusBadge,
  TonalRangeControl,
  WorkflowToast,
  WorkflowToolbar,
} from "./components/aperture-workflow";

const colors = [
  { name: "Black", value: "#0D0D0D" },
  { name: "White", value: "#FFFFFF" },
  { name: "Signal Red", value: "#E30613" },
  { name: "Silver", value: "#D1D3D6" },
  { name: "Graphite", value: "#4A4D50" },
];

const assets = [
  {
    asset: "Street Series 01.dng",
    kind: "image" as const,
    profile: "Monochrome",
    modified: "May 12, 2026 · 14:32",
    status: "Active" as const,
  },
  {
    asset: "Portrait 03.dng",
    kind: "collection" as const,
    profile: "Natural Color",
    modified: "May 10, 2026 · 09:15",
    status: "Archived" as const,
  },
  {
    asset: "Motion Study.mp4",
    kind: "video" as const,
    profile: "Cine Neutral",
    modified: "May 08, 2026 · 18:47",
    status: "Archived" as const,
  },
];

const initialQueue: QueueItem[] = [
  {
    id: "img-2471",
    name: "IMG_2471.DNG",
    progress: 72,
    status: "Developing",
  },
  {
    id: "img-2472",
    name: "IMG_2472.DNG",
    progress: 0,
    status: "Queued",
  },
  {
    id: "img-2473",
    name: "IMG_2473.DNG",
    progress: 100,
    status: "Complete",
  },
];

export default function Home() {
  const [dark, setDark] = useState(false);
  const [frameLines, setFrameLines] = useState(true);
  const [livePreview, setLivePreview] = useState(true);
  const [mode, setMode] = useState("MANUAL");
  const [projectName, setProjectName] = useState("");
  const [profile, setProfile] = useState("monochrome");
  const [activeTab, setActiveTab] = useState("Overview");
  const [currentPage, setCurrentPage] = useState(2);
  const [aperture, setAperture] = useState("2.8");
  const [exposure, setExposure] = useState(0);
  const [captureCount, setCaptureCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyStatus, setApplyStatus] = useState("No changes applied");
  const [activeSection, setActiveSection] = useState("foundations");
  const [commandOpen, setCommandOpen] = useState(false);
  const [viewMode, setViewMode] = useState("List");
  const [iso, setIso] = useState(400);
  const [grain, setGrain] = useState(18);
  const [blackPoint, setBlackPoint] = useState(12);
  const [whitePoint, setWhitePoint] = useState(88);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const headerOffset = window.innerWidth <= 760 ? 122 : 58;
        const sections = ["foundations", "components", "patterns", "workflow"]
          .map((id) => document.getElementById(id))
          .filter((section): section is HTMLElement => Boolean(section));
        const visible = sections
          .map((section) => {
            const rect = section.getBoundingClientRect();
            const pixels = Math.max(
              0,
              Math.min(rect.bottom, window.innerHeight) -
                Math.max(rect.top, headerOffset),
            );
            return { id: section.id, pixels };
          })
          .sort((a, b) => b.pixels - a.pixels)[0];
        if (visible?.pixels) setActiveSection(visible.id);
      });
    };
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const notify = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  const handleCommand = (command: CommandItem) => {
    notify(`${command.label} selected`);
  };

  const addFiles = (files: File[]) => {
    setQueue((items) => [
      ...files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        progress: 0,
        status: "Queued" as const,
      })),
      ...items,
    ]);
    notify(`${files.length} RAW ${files.length === 1 ? "file" : "files"} added`);
  };

  const advanceQueue = () => {
    let advanced = false;
    setQueue((items) =>
      items.map((item) => {
        if (advanced || item.status === "Complete") return item;
        advanced = true;
        if (item.status === "Queued") {
          return { ...item, progress: 12, status: "Developing" as const };
        }
        const progress = Math.min(100, item.progress + 14);
        return {
          ...item,
          progress,
          status: progress === 100 ? "Complete" as const : "Developing" as const,
        };
      }),
    );
    notify("Processing queue advanced");
  };

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Aperture UI home">
          Aperture UI
        </a>
        <nav aria-label="Primary navigation">
          <a className={activeSection === "foundations" ? "is-active" : undefined} href="#foundations">Foundations</a>
          <a className={activeSection === "components" ? "is-active" : undefined} href="#components">Components</a>
          <a className={activeSection === "patterns" ? "is-active" : undefined} href="#patterns">Patterns</a>
          <a className={activeSection === "workflow" ? "is-active" : undefined} href="#workflow">Workflow</a>
        </nav>
        <ThemeToggle dark={dark} onToggle={() => setDark((value) => !value)} />
      </header>

      <div className="page-shell" id="top">
        <section className="hero-foundations" id="foundations">
          <FrameCorners />
          <div className="hero">
            <h1>Precision,<br />made interactive.</h1>
            <p>A restrained interface system for tools that deserve focus.</p>
            <div className="hero__actions">
              <PrecisionButton onClick={() => document.querySelector("#components")?.scrollIntoView({ behavior: "smooth" })}>
                Explore components
              </PrecisionButton>
              <PrecisionButton
                onClick={() => document.querySelector("#tokens")?.scrollIntoView({ behavior: "smooth" })}
                variant="secondary"
              >
                View tokens
              </PrecisionButton>
            </div>
          </div>

          <div className="foundations" id="tokens">
            <div className="section-heading">
              <span>01</span>
              <h2>Foundations</h2>
            </div>
            <div className="foundations__content">
              <div>
                <p className="spec-label">Colors</p>
                <div className="swatches">
                  {colors.map((color) => (
                    <div className="swatch" key={color.name}>
                      <span
                        className="swatch__color"
                        style={{ backgroundColor: color.value }}
                      />
                      <strong>{color.name}</strong>
                      <code>{color.value}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div className="type-specimen">
                <p className="spec-label">Typography</p>
                <div className="type-specimen__row">
                  <span>H1</span>
                  <strong>48/56</strong>
                  <em>Bold</em>
                </div>
                <div className="type-specimen__row">
                  <span>H2</span>
                  <strong>32/40</strong>
                  <em>Bold</em>
                </div>
                <div className="type-specimen__row type-specimen__row--mono">
                  <span>0123456789</span>
                  <strong>14/20</strong>
                  <em>Regular</em>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="component-section" id="components">
          <div className="section-heading">
            <span>02</span>
            <h2>Controls</h2>
          </div>

          <div className="control-grid">
            <div className="control-group">
              <p className="spec-label">Buttons</p>
              <div className="button-showcase">
                <div>
                  <span>Primary</span>
                  <PrecisionButton>Default</PrecisionButton>
                </div>
                <div>
                  <span>Secondary</span>
                  <PrecisionButton variant="secondary">Default</PrecisionButton>
                </div>
                <div>
                  <span>Ghost</span>
                  <PrecisionButton variant="ghost">Default</PrecisionButton>
                </div>
                <div>
                  <span>Icon</span>
                  <IconButton label="Add to favorites"><HeartIcon /></IconButton>
                </div>
              </div>
              <PrecisionButton disabled>Disabled</PrecisionButton>
            </div>

            <div className="control-group">
              <p className="spec-label">Inputs</p>
              <div className="input-pair">
                <TextField
                  label="Project name"
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Project name"
                  value={projectName}
                />
                <SelectField
                  label="Profile"
                  onChange={(event) => setProfile(event.target.value)}
                  options={[
                    { label: "Monochrome", value: "monochrome" },
                    { label: "Cine Neutral", value: "cine" },
                    { label: "Natural Color", value: "natural" },
                  ]}
                  value={profile}
                />
              </div>
            </div>

            <div className="control-group control-group--compact">
              <p className="spec-label">Selection</p>
              <Checkbox
                checked={frameLines}
                label="Show frame lines"
                onChange={(event) => setFrameLines(event.target.checked)}
              />
              <Toggle
                checked={livePreview}
                label="Live preview"
                onCheckedChange={setLivePreview}
              />
            </div>

            <div className="control-group">
              <p className="spec-label">Segmented control</p>
              <SegmentedControl
                label="Capture mode"
                onValueChange={setMode}
                options={["AUTO", "MANUAL", "PRO"]}
                value={mode}
              />
              <div className="selection-readout" aria-live="polite">
                <span>Current setup</span>
                <strong>{mode} · {profile.replace("-", " ")}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="navigation-data-section">
          <div className="navigation-specimen">
            <div className="section-heading">
              <span>03</span>
              <h2>Navigation</h2>
            </div>
            <div className="navigation-specimen__content">
              <div>
                <p className="spec-label">Tabs</p>
                <Tabs
                  label="Asset sections"
                  onValueChange={setActiveTab}
                  options={["Overview", "Details", "History"]}
                  value={activeTab}
                />
                <div
                  aria-labelledby={`tab-${activeTab.toLowerCase()}`}
                  className="tab-panel"
                  id="asset-panel"
                  role="tabpanel"
                >
                  <span>{activeTab}</span>
                  <strong>
                    {activeTab === "Overview" && "Frame 24 is ready for review."}
                    {activeTab === "Details" && "16-bit DNG · 8368 × 5584 px"}
                    {activeTab === "History" && "Last developed May 12, 2026."}
                  </strong>
                </div>
              </div>
              <div>
                <p className="spec-label">Breadcrumb</p>
                <nav aria-label="Breadcrumb" className="breadcrumb">
                  <a href="#components">Projects</a>
                  <span aria-hidden="true">›</span>
                  <a href="#data">Street Series</a>
                  <span aria-hidden="true">›</span>
                  <span aria-current="page">Frame 24</span>
                </nav>
                <p className="spec-label pagination-label">Pagination</p>
                <Pagination
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  pageCount={5}
                />
              </div>
            </div>
          </div>

          <div className="data-specimen" id="data">
            <div className="section-heading">
              <span>04</span>
              <h2>Data</h2>
            </div>
            <AssetTable
              onAction={(asset, action) => notify(`${action}: ${asset}`)}
              rows={assets}
            />
          </div>
        </section>

        <section className="pattern-dialog-section" id="patterns">
          <div className="instrument-panel">
            <FrameCorners />
            <div className="section-heading section-heading--dark">
              <span>05</span>
              <h2>Camera-inspired patterns</h2>
            </div>
            <div className="instrument-grid">
              <div className="instrument-group">
                <p className="spec-label">Aperture selector</p>
                <ApertureSelector
                  onValueChange={setAperture}
                  value={aperture}
                />
                <span className="instrument-readout">f/{aperture} selected</span>
              </div>
              <div className="instrument-group">
                <p className="spec-label">Exposure compensation</p>
                <ExposureControl
                  onValueChange={setExposure}
                  value={exposure}
                />
                <span className="instrument-readout">
                  {exposure > 0 ? "+" : ""}{exposure} EV
                </span>
              </div>
              <div className="instrument-group instrument-group--shutter">
                <p className="spec-label">Shutter / action</p>
                <div className="shutter-lock-row">
                  <ShutterButton
                    captureCount={captureCount}
                    onClick={() => {
                      if (locked) return;
                      setCaptureCount((count) => count + 1);
                      notify("Frame captured");
                    }}
                  />
                  <IconButton
                    aria-pressed={locked}
                    className={locked ? "is-locked" : undefined}
                    label={locked ? "Unlock shutter" : "Lock shutter"}
                    onClick={() => setLocked((value) => !value)}
                  >
                    <LockIcon locked={locked} />
                  </IconButton>
                </div>
              </div>
            </div>
          </div>

          <div className="dialog-specimen">
            <div className="section-heading">
              <span>06</span>
              <h2>Dialog example</h2>
            </div>
            <div className="dialog-card">
              <div className="dialog-card__topline">
                <span>Confirmation</span>
                <span>01</span>
              </div>
              <h3>Apply profile?</h3>
              <p>This will update the selected asset with the “Monochrome” profile.</p>
              <div className="dialog-card__footer">
                <span aria-live="polite">{applyStatus}</span>
                <PrecisionButton onClick={() => setDialogOpen(true)}>
                  Open dialog
                </PrecisionButton>
              </div>
            </div>
          </div>
        </section>

        <section className="workflow-section" id="workflow">
          <div className="section-heading">
            <span>07</span>
            <h2>Instruments &amp; workflow</h2>
          </div>

          <WorkflowToolbar
            onOpenCommands={() => setCommandOpen(true)}
            onViewModeChange={(value) => {
              setViewMode(value);
              notify(`${value} view selected`);
            }}
            viewMode={viewMode}
          />

          <div className="workflow-instrument">
            <HistogramPanel />
            <LightMeterScale value={exposure} />
            <div className="iso-grain-panel">
              <IsoDial onValueChange={setIso} value={iso} />
              <GrainControl onValueChange={setGrain} value={grain} />
            </div>
            <CaptureMetadata
              aperture={aperture}
              captureCount={captureCount}
              exposure={exposure}
              iso={iso}
            />
          </div>

          <div className="workflow-operations">
            <div className="workflow-operations__selection">
              <SelectionStates />
            </div>
            <FileDropzone onFiles={addFiles} />
            <ProcessingQueue items={queue} onAdvance={advanceQueue} />
            <div className="feedback-specimen">
              <p className="spec-label">Feedback</p>
              <div className="feedback-specimen__badges">
                <StatusBadge label="Ready" tone="neutral" />
                <StatusBadge label="Developing" tone="active" />
                <StatusBadge label="Clipping" tone="warning" />
              </div>
              <div className="feedback-specimen__message">
                <span>Export complete</span>
                <strong>12 files saved to Archive</strong>
              </div>
              <PrecisionButton onClick={() => notify("Export complete")}>
                Test notification
              </PrecisionButton>
            </div>
          </div>

          <div className="workflow-states">
            <div>
              <p className="spec-label">Tonal range</p>
              <TonalRangeControl
                blackPoint={blackPoint}
                onChange={(black, white) => {
                  setBlackPoint(black);
                  setWhitePoint(white);
                }}
                whitePoint={whitePoint}
              />
            </div>
            <div>
              <p className="spec-label">Skeleton / loading</p>
              <SkeletonSpecimen />
            </div>
            <div>
              <p className="spec-label">Empty state</p>
              <EmptyState onSelect={() => notify("First asset selected")} />
            </div>
          </div>
        </section>

        <footer className="system-footer">
          <span>Aperture UI</span>
          <span>System 02</span>
        </footer>
      </div>

      <ConfirmDialog
        onApply={() => setApplyStatus("Monochrome profile applied")}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
      />
      <CommandPalette
        onCommand={handleCommand}
        onOpenChange={setCommandOpen}
        open={commandOpen}
      />
      <WorkflowToast
        message={toastMessage}
        onDismiss={() => setToastOpen(false)}
        open={toastOpen}
      />
    </main>
  );
}
