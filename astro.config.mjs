// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
// 方案 B：纯静态模式。引入 astro-icon 插件支持 Lucide 图标系统。
export default defineConfig({
  output: 'static',
  integrations: [icon()],
});
