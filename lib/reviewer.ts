import type { GeneratedFiles, ReviewCheck, ReviewResult } from "@/lib/types";

const fallbackApp = `import "./styles.css";

export default function App() {
  return (
    <main className="generated-app">
      <section className="empty-state">
        <p className="eyebrow">已恢复原型</p>
        <h1>生成结果已修复</h1>
        <p>由于生成结果缺少 React 入口文件，审查器已补齐一个最小可运行版本。</p>
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
    repairs.push("已创建缺失的 /App.tsx React 入口文件。");
    checks.push({
      name: "React 入口文件",
      passed: true,
      detail: "/App.tsx 缺失，已自动创建。",
      repaired: true
    });
  } else {
    checks.push({
      name: "React 入口文件",
      passed: true,
      detail: "/App.tsx 已存在。"
    });
  }

  if (!files["/styles.css"]?.trim()) {
    files["/styles.css"] = fallbackCss;
    repairs.push("已创建缺失的 /styles.css。");
    checks.push({
      name: "样式文件",
      passed: true,
      detail: "/styles.css 缺失，已自动创建。",
      repaired: true
    });
  } else {
    checks.push({
      name: "样式文件",
      passed: true,
      detail: "/styles.css 已存在。"
    });
  }

  const appSource = files["/App.tsx"] || "";
  if (!hasStylesImport(appSource)) {
    files["/App.tsx"] = `import "./styles.css";\n${appSource}`;
    repairs.push("已为 /App.tsx 补充缺失的样式导入。");
    checks.push({
      name: "CSS 导入",
      passed: true,
      detail: "审查器已补充本地样式文件导入。",
      repaired: true
    });
  } else {
    checks.push({
      name: "CSS 导入",
      passed: true,
      detail: "/App.tsx 已导入 ./styles.css。"
    });
  }

  if (!hasDefaultExport(files["/App.tsx"] || "")) {
    if (canAppendDefaultExport(files["/App.tsx"] || "")) {
      files["/App.tsx"] = `${files["/App.tsx"]}\nexport default App;\n`;
      repairs.push("已补充 Sandpack 需要的默认导出。");
      checks.push({
        name: "默认导出",
        passed: true,
        detail: "审查器已补充默认导出的 App。",
        repaired: true
      });
    } else {
      files["/App.tsx"] = fallbackApp;
      repairs.push("已将无效的 App 源码替换为最小可运行 React 组件。");
      checks.push({
        name: "默认导出",
        passed: true,
        detail: "审查器已替换无效源码并补上默认导出。",
        repaired: true
      });
    }
  } else {
    checks.push({
      name: "默认导出",
      passed: true,
      detail: "/App.tsx 已包含默认导出。"
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
    repairs.push("已补充响应式布局断点。");
    checks.push({
      name: "响应式布局",
      passed: true,
      detail: "审查器已补充移动端断点。",
      repaired: true
    });
  } else {
    checks.push({
      name: "响应式布局",
      passed: true,
      detail: "已存在响应式断点。"
    });
  }

  if (!files["/package.json"]?.trim()) {
    files["/package.json"] = fallbackPackage;
    repairs.push("已补充 Sandpack React 项目所需的 package 元数据。");
    checks.push({
      name: "项目元数据",
      passed: true,
      detail: "/package.json 缺失，已自动创建。",
      repaired: true
    });
  } else {
    checks.push({
      name: "项目元数据",
      passed: true,
      detail: "/package.json 已存在。"
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
