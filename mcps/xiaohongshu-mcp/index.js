#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ensureLogin, publishContent } from './browser-control.js';

const server = new Server({
  name: 'xiaohongshu-mcp',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'publish',
      description: '发布小红书笔记',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '标题，不超过20字' },
          content: { type: 'string', description: '正文，不超过1000字' },
          images: { type: 'array', items: { type: 'string' }, description: '本地图片路径数组' }
        },
        required: ['title', 'content']
      }
    },
    {
      name: 'check_login',
      description: '检查小红书登录状态'
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'publish':
        const result = await publishContent(args.title, args.content, args.images || []);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      
      case 'check_login':
        const page = await ensureLogin();
        const loggedIn = await page.evaluate(() => {
          // 这里的选择器需要根据小红书实际页面结构定期更新
          return document.querySelector('.user-avatar') !== null || document.querySelector('.side-bar') !== null;
        });
        return { content: [{ type: 'text', text: loggedIn ? '已登录' : '未登录' }] };
      
      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `操作失败: ${error.message}` }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
