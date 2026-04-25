import type { GeneratedFiles, ReviewCheck, ReviewResult } from "@/lib/types";

const fallbackApp = `import "./styles.css";

export default function App() {
  return (
    <main className="generated-app">
      <section className="empty-state">
        <p className="eyebrow">Recovered prototype</p>
        <h1>Generated app repaired</h1>
        <p>The reviewer created a minimal React entry file because the generated project was missing one.</p>
      </section>
    </main>
  );
}
`;

const fallbackCss = `.generated-app {
  min-height: 100vh;
  padding: 32px;
  background: #f5f7fa;
  color: #1d232b;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.empty-state {
  max-width: 680px;
  margin: 0 auto;
  padding: 28px;
  border: 1px solid #d8dee6;
  border-radius: 8px;
  background: #ffffff;
}

.eyebrow {
  color: #0b8f83;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .generated-app {
    padding: 18px;
  }
}
`;

const fallbackPackage = `{
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {}
}
`;

function hasDefaultExport(source: string): boolean {
  return /export\s+default\s+/.test(source);
}

function hasStylesImport(source: string): boolean {
  return /import\s+["']\.\/styles\.css["'];?/.test(source);
}

function canAppendDefaultExport(source: string): boolean {
  return /function\s+App\s*\(/.test(source) || /const\s+App\s*=/.test(source);
}

export function reviewAndRepairFiles(inputFiles: GeneratedFiles): {
  files: GeneratedFiles;
  review: ReviewResult;
} {
  const files: GeneratedFiles = { ...inputFiles };
  const checks: ReviewCheck[] = [];
  const repairs: string[] = [];

  if (!files["/App.tsx"]?.trim()) {
    files["/App.tsx"] = fallbackApp;
    repairs.push("Created missing /App.tsx React entry file.");
    checks.push({
      name: "React entry file",
      passed: true,
      detail: "/App.tsx was missing and has been created.",
      repaired: true
    });
  } else {
    checks.push({
      name: "React entry file",
      passed: true,
      detail: "/App.tsx is present."
    });
  }

  if (!files["/styles.css"]?.trim()) {
    files["/styles.css"] = fallbackCss;
    repairs.push("Created missing /styles.css.");
    checks.push({
      name: "Stylesheet",
      passed: true,
      detail: "/styles.css was missing and has been created.",
      repaired: true
    });
  } else {
    checks.push({
      name: "Stylesheet",
      passed: true,
      detail: "/styles.css is present."
    });
  }

  const appSource = files["/App.tsx"] || "";
  if (!hasStylesImport(appSource)) {
    files["/App.tsx"] = `import "./styles.css";\n${appSource}`;
    repairs.push("Added missing styles import to /App.tsx.");
    checks.push({
      name: "CSS import",
      passed: true,
      detail: "Reviewer added the local stylesheet import.",
      repaired: true
    });
  } else {
    checks.push({
      name: "CSS import",
      passed: true,
      detail: "/App.tsx imports ./styles.css."
    });
  }

  if (!hasDefaultExport(files["/App.tsx"] || "")) {
    if (canAppendDefaultExport(files["/App.tsx"] || "")) {
      files["/App.tsx"] = `${files["/App.tsx"]}\nexport default App;\n`;
      repairs.push("Added missing default export for Sandpack.");
      checks.push({
        name: "Default export",
        passed: true,
        detail: "Reviewer added a default App export.",
        repaired: true
      });
    } else {
      files["/App.tsx"] = fallbackApp;
      repairs.push("Replaced invalid App source with a minimal valid React component.");
      checks.push({
        name: "Default export",
        passed: true,
        detail: "Reviewer replaced invalid source with a default App export.",
        repaired: true
      });
    }
  } else {
    checks.push({
      name: "Default export",
      passed: true,
      detail: "/App.tsx has a default export."
    });
  }

  if (!/@media\s*\(/.test(files["/styles.css"] || "")) {
    files["/styles.css"] = `${files["/styles.css"] || fallbackCss}

@media (max-width: 760px) {
  .app-shell,
  .hero-grid,
  .metrics-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
`;
    repairs.push("Added responsive CSS breakpoint.");
    checks.push({
      name: "Responsive layout",
      passed: true,
      detail: "Reviewer added a mobile breakpoint.",
      repaired: true
    });
  } else {
    checks.push({
      name: "Responsive layout",
      passed: true,
      detail: "Responsive CSS breakpoint is present."
    });
  }

  if (!files["/package.json"]?.trim()) {
    files["/package.json"] = fallbackPackage;
    repairs.push("Added package metadata for the Sandpack React project.");
    checks.push({
      name: "Package metadata",
      passed: true,
      detail: "/package.json was missing and has been created.",
      repaired: true
    });
  } else {
    checks.push({
      name: "Package metadata",
      passed: true,
      detail: "/package.json is present."
    });
  }

  const passed = checks.filter((check) => check.passed).length;

  return {
    files,
    review: {
      score: Math.round((passed / checks.length) * 100),
      checks,
      repairs
    }
  };
}
