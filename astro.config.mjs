// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// 方案 B：纯静态模式。移除 cloudflare 适配器，使产物直接输出到 dist/ 目录。
export default defineConfig({
  output: 'static',
});
