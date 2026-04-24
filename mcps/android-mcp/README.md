# Android MCP

这是一个基于 Model Context Protocol (MCP) 的服务器，允许 AI 通过 SSH 连接直接向安卓手机的 Termux 下发命令。

## 功能

- **exec**: 在 Termux 中执行任意 shell 命令。
- **read_file**: 读取手机上的文件内容。
- **write_file**: 向手机写入内容。
- **run_script**: 运行手机上的脚本。

## 配置

请设置以下环境变量：

- `ANDROID_HOST`: 手机 IP 地址 (默认: 192.168.1.100)
- `ANDROID_PORT`: SSH 端口 (默认: 8022)
- `ANDROID_USER`: 用户名 (默认: u0_a123)
- `ANDROID_PASSWORD`: SSH 密码
- `ANDROID_SSH_KEY`: SSH 私钥路径

## 安装

```bash
npm install
```
