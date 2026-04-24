#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Client } from 'ssh2';

// SSH 配置（从环境变量读取）
const config = {
  host: process.env.ANDROID_HOST || '192.168.1.100',
  port: parseInt(process.env.ANDROID_PORT) || 8022,
  username: process.env.ANDROID_USER || 'u0_a123',
  password: process.env.ANDROID_PASSWORD,
  privateKey: process.env.ANDROID_SSH_KEY
};

function execCommand(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let output = '';
        let errorOutput = '';
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', (data) => { errorOutput += data.toString(); });
        stream.on('close', () => {
          conn.end();
          if (errorOutput && !output) {
            resolve(errorOutput);
          } else {
            resolve(output || errorOutput);
          }
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect(config);
  });
}

const server = new Server({
  name: 'android-mcp',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

// 注册可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'exec',
      description: '在手机 Termux 中执行命令',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的命令' }
        },
        required: ['command']
      }
    },
    {
      name: 'read_file',
      description: '读取手机上的文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        },
        required: ['path']
      }
    },
    {
      name: 'write_file',
      description: '写入内容到手机文件',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' }
        },
        required: ['path', 'content']
      }
    },
    {
      name: 'run_script',
      description: '执行手机上的 Python/Node.js 脚本',
      inputSchema: {
        type: 'object',
        properties: {
          script_path: { type: 'string', description: '脚本路径' },
          args: { type: 'string', description: '参数' }
        },
        required: ['script_path']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'exec':
        const output = await execCommand(args.command);
        return { content: [{ type: 'text', text: output }] };
      
      case 'read_file':
        const content = await execCommand(`cat "${args.path}"`);
        return { content: [{ type: 'text', text: content }] };
      
      case 'write_file':
        // 使用 echo 写入文件（处理特殊字符）
        const escaped = args.content.replace(/'/g, "'\\''");
        await execCommand(`echo '${escaped}' > "${args.path}"`);
        return { content: [{ type: 'text', text: `写入成功: ${args.path}` }] };
      
      case 'run_script':
        const result = await execCommand(`cd $(dirname "${args.script_path}") && python "${args.script_path}" ${args.args || ''}`);
        return { content: [{ type: 'text', text: result }] };
      
      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `错误: ${error.message}` }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
