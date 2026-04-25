import type { TemplatePrompt } from "@/lib/types";

export const templates: TemplatePrompt[] = [
  {
    id: "saas",
    label: "订阅分析",
    prompt: "构建一个订阅分析 SaaS，看板包含账户健康度、收入趋势、流失风险和下一步行动建议。"
  },
  {
    id: "commerce",
    label: "电商零售",
    prompt: "构建一个商品发现型电商前台，包含分类筛选、转化指标、购物车概览和上新操作。"
  },
  {
    id: "internal",
    label: "运营工具",
    prompt: "构建一个客服运营看板，包含工单、SLA 状态、负责人分配和升级处理操作。"
  },
  {
    id: "fitness",
    label: "健身习惯",
    prompt: "构建一个健身习惯追踪器，包含每周进度、连续打卡、目标完成度和训练备注。"
  }
];
