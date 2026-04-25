import type { AgentDefinition, AgentRun, AppSpec } from "@/lib/types";

export const agentDefinitions: AgentDefinition[] = [
  {
    id: "pm",
    name: "产品代理",
    role: "产品经理",
    queued: "等待明确需求范围",
    running: "正在把输入整理成产品范围",
    done: "产品范围已整理完成"
  },
  {
    id: "designer",
    name: "设计代理",
    role: "设计师",
    queued: "等待界面方案",
    running: "正在规划信息架构、界面密度与视觉风格",
    done: "界面方向已确认"
  },
  {
    id: "engineer",
    name: "工程代理",
    role: "工程师",
    queued: "等待生成代码",
    running: "正在生成 React 项目文件",
    done: "React 文件已生成"
  },
  {
    id: "reviewer",
    name: "审查代理",
    role: "审查员",
    queued: "等待审查结果",
    running: "正在检查 Sandpack 运行准备情况",
    done: "审查与修复已完成"
  }
];

export function buildAgentRuns(spec: AppSpec, repairedCount: number): AgentRun[] {
  const domainLabel = {
    commerce: "电商",
    fitness: "健身",
    internal: "内部运营",
    saas: "订阅 SaaS",
    workspace: "工作台"
  }[spec.domain];
  const toneLabel = {
    modern: "现代",
    dark: "深色",
    warm: "温暖",
    enterprise: "企业"
  }[spec.tone];

  return [
    {
      id: "pm",
      name: "产品代理",
      role: "产品经理",
      status: "done",
      output: `已为${spec.audience}梳理 ${domainLabel} 应用范围，聚焦 ${spec.features.length} 个核心能力。`
    },
    {
      id: "designer",
      name: "设计代理",
      role: "设计师",
      status: "done",
      output: `已确定${toneLabel}风格方向，采用高信息密度工作台和清晰的操作层级。`
    },
    {
      id: "engineer",
      name: "工程代理",
      role: "工程师",
      status: "done",
      output: "已生成 TypeScript React 文件、本地样式与适配 Sandpack 的项目元数据。"
    },
    {
      id: "reviewer",
      name: "审查代理",
      role: "审查员",
      status: "done",
      output:
        repairedCount > 0
          ? `发现并修复 ${repairedCount} 个运行准备问题。`
          : "已验证入口文件、样式导入、默认导出、项目元数据与响应式布局。"
    }
  ];
}
