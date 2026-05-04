import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';

const SKILLS_DIR = path.resolve('skills');
const MCPS_DIR = path.resolve('mcps');
const DIST_SKILLS = path.resolve('public/dist-skills');
const DIST_MCPS = path.resolve('public/dist-mcps');
const DATA_DIR = path.resolve('src/data');
const SEARCH_INDEX = path.resolve('public/search.json');

/**
 * 核心打包函数
 * 确保文件布局有一层根目录（防止解压散落）
 */
function archiveDirectory(sourceDir, outPath, slug) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    
    // 将内容放入以 slug 命名的子目录中
    archive.directory(sourceDir, slug);
    
    archive.finalize();
  });
}

async function getInstallManager(dir) {
  if (await fs.pathExists(path.join(dir, 'pnpm-lock.yaml')) || await fs.pathExists(path.join(dir, 'package.json'))) {
    return 'pnpm';
  }
  if (await fs.pathExists(path.join(dir, 'requirements.txt')) || await fs.pathExists(path.join(dir, 'pyproject.toml'))) {
    return 'pip';
  }
  return null;
}

async function hasSourceCode(dir) {
  const files = await fs.readdir(dir);
  const sourceFiles = ['.py', '.js', '.ts', '.sh', '.rs', 'package.json', 'requirements.txt'];
  return files.some(file => sourceFiles.includes(file) || sourceFiles.includes(path.extname(file)));
}

async function packFactory() {
  console.log('🚀 启动装配工厂双语构建流 (Spec v2026.1)...');

  await fs.emptyDir(DIST_SKILLS);
  await fs.emptyDir(DIST_MCPS);
  await fs.ensureDir(DATA_DIR);

  const skillsRegistry = [];
  const mcpsRegistry = [];

  const processCategory = async (dir, isSkill) => {
    if (!await fs.pathExists(dir)) return;
    const folders = await fs.readdir(dir);
    for (const slug of folders) {
      const itemPath = path.join(dir, slug);
      if (!(await fs.stat(itemPath)).isDirectory()) continue;
      const metaPath = path.join(itemPath, '_meta.json');
      if (!(await fs.pathExists(metaPath))) {
        console.warn(`⚠️ 忽略缺少 _meta.json 的目录: ${slug}`);
        continue;
      }

      let meta = await fs.readJson(metaPath);
      
      // 容错处理：双重反序列化别名兼容拼写错误
      if (meta.tpye) {
        meta.type = meta.tpye;
        delete meta.tpye;
      }

      // 自动探测依赖与安装命令
      let installCommand = null;
      if (await fs.pathExists(path.join(itemPath, 'package.json'))) {
        installCommand = "pnpm install --production";
      } else if (await fs.pathExists(path.join(itemPath, 'requirements.txt'))) {
        installCommand = "pip install --no-cache-dir -r requirements.txt";
      }
      
      const entry = {
        ...meta,
        id: meta.id || slug,
        slug: meta.slug || slug,
        type: meta.type || (isSkill ? 'skill' : 'mcp'),
        name_en: meta.name_en || meta.name,
        description_en: meta.description_en || meta.description,
        icon: meta.icon || (isSkill ? 'cpu' : 'wrench'),
        spec_version: "2026.1",
        install_command: meta.install_command || installCommand,
        permissions: meta.permissions || [], // 风险告知字段
      };

      // 标准化运行时配置 (runtime_config)
      if (!entry.runtime_config) {
        // 兼容 MCP 旧配置
        if (entry.mcp_config) {
          const cfg = entry.mcp_config;
          if (cfg.base_command && !cfg.command) {
            const parts = cfg.base_command.split(' ');
            cfg.command = parts[0];
            cfg.args = parts.slice(1);
          }
          entry.runtime_config = {
            command: cfg.command || (entry.runtime === 'python' ? 'python' : 'node'),
            args: cfg.args || [],
            env: cfg.env || {}
          };
        } else {
          // 默认为 Skill 生成基础配置
          const files = await fs.readdir(itemPath);
          const isPython = entry.runtime === 'python' || 
                           (installCommand && installCommand.includes('pip')) ||
                           files.some(f => f.endsWith('.py'));
          
          entry.runtime_config = {
            command: isPython ? 'python' : 'node',
            args: [entry.entry || (isPython ? 'main.py' : 'index.js')],
            env: {}
          };
        }
      }

      if (isSkill) {
        const zipName = `${entry.slug}.zip`;
        await archiveDirectory(itemPath, path.join(DIST_SKILLS, zipName), entry.slug);
        entry.download_url = `/dist-skills/${zipName}`;
        entry.driver_type = "zip_package";
        skillsRegistry.push(entry);
      } else {
        entry.driver_type = "mcp";
        if (await hasSourceCode(itemPath)) {
          const zipName = `${entry.slug}.zip`;
          await archiveDirectory(itemPath, path.join(DIST_MCPS, zipName), entry.slug);
          entry.download_url = `/dist-mcps/${zipName}`;
          entry.install_type = "mcp_source";
        } else {
          entry.install_type = "mcp_config";
        }
        mcpsRegistry.push(entry);
      }
      console.log(`✅ [${isSkill ? 'Skill' : 'MCP'}] ${entry.name}`);
    }
  };

  await processCategory(SKILLS_DIR, true);
  await processCategory(MCPS_DIR, false);

  await fs.writeJson(path.join(DATA_DIR, 'skills-master.json'), skillsRegistry, { spaces: 2 });
  await fs.writeJson(path.join(DATA_DIR, 'mcps-master.json'), mcpsRegistry, { spaces: 2 });

  const searchIndex = [
    ...skillsRegistry,
    ...mcpsRegistry
  ];
  await fs.writeJson(SEARCH_INDEX, searchIndex);
  console.log(`✨ 构建完成。索引包含 ${searchIndex.length} 个项目。`);
}

packFactory().catch(console.error);
