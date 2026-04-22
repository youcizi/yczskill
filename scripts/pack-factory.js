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
 * @param {string} sourceDir 源目录
 * @param {string} outPath 输出路径
 */
function archiveDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    // 排除不必要的文件
    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: ['node_modules/**', '.git/**', '__pycache__/**', 'dist/**', '.DS_Store']
    });
    archive.finalize();
  });
}

/**
 * 检测目录是否包含源码文件
 * @param {string} dir 目录路径
 */
async function hasSourceCode(dir) {
  const files = await fs.readdir(dir);
  const sourceExtensions = ['.py', '.js', '.ts', '.sh', '.rs', '.go'];
  const configFiles = ['package.json', 'requirements.txt', 'Dockerfile', 'go.mod'];
  
  return files.some(file => {
    const ext = path.extname(file).toLowerCase();
    return sourceExtensions.includes(ext) || configFiles.includes(file);
  });
}

async function packFactory() {
  console.log('🚀 启动装配工厂流水线...');

  // 1. 初始化目录
  await fs.emptyDir(DIST_SKILLS);
  await fs.emptyDir(DIST_MCPS);
  await fs.ensureDir(DATA_DIR);

  const skillsRegistry = [];
  const mcpsRegistry = [];

  // 2. 处理 Skills
  if (await fs.pathExists(SKILLS_DIR)) {
    const folders = await fs.readdir(SKILLS_DIR);
    for (const slug of folders) {
      const itemPath = path.join(SKILLS_DIR, slug);
      if (!(await fs.stat(itemPath)).isDirectory()) continue;

      const metaPath = path.join(itemPath, '_meta.json');
      if (!(await fs.pathExists(metaPath))) continue;

      const meta = await fs.readJson(metaPath);
      const zipName = `${meta.slug || slug}.zip`;
      const outPath = path.join(DIST_SKILLS, zipName);

      await archiveDirectory(itemPath, outPath);
      
      skillsRegistry.push({
        ...meta,
        id: meta.id || slug,
        slug: meta.slug || slug,
        download_url: `/dist-skills/${zipName}`,
        driver_type: "zip_package"
      });
      console.log(`✅ [Skill] 打包完成: ${meta.name}`);
    }
  }

  // 3. 处理 MCPs
  if (await fs.pathExists(MCPS_DIR)) {
    const folders = await fs.readdir(MCPS_DIR);
    for (const slug of folders) {
      const itemPath = path.join(MCPS_DIR, slug);
      if (!(await fs.stat(itemPath)).isDirectory()) continue;

      const metaPath = path.join(itemPath, '_meta.json');
      if (!(await fs.pathExists(metaPath))) continue;

      const meta = await fs.readJson(metaPath);
      const entry = {
        ...meta,
        id: meta.id || slug,
        slug: meta.slug || slug,
        driver_type: "mcp"
      };

      // 检测源码
      if (await hasSourceCode(itemPath)) {
        const zipName = `${meta.slug || slug}.zip`;
        const outPath = path.join(DIST_MCPS, zipName);
        await archiveDirectory(itemPath, outPath);
        entry.download_url = `/dist-mcps/${zipName}`;
        entry.install_type = "mcp_source";
      } else {
        entry.install_type = "mcp_config";
      }

      mcpsRegistry.push(entry);
      console.log(`✅ [MCP] 处理完成: ${meta.name} (${entry.install_type})`);
    }
  }

  // 4. 持久化数据
  await fs.writeJson(path.join(DATA_DIR, 'skills-master.json'), skillsRegistry, { spaces: 2 });
  await fs.writeJson(path.join(DATA_DIR, 'mcps-master.json'), mcpsRegistry, { spaces: 2 });

  // 5. 更新搜索索引
  const searchIndex = [
    ...skillsRegistry.map(s => ({ id: s.id, name: s.name, type: 'skill' })),
    ...mcpsRegistry.map(m => ({ id: m.id, name: m.name, type: 'mcp' }))
  ];
  await fs.writeJson(SEARCH_INDEX, searchIndex);

  console.log(`✨ 构建流执行完毕。`);
}

packFactory().catch(err => {
  console.error('❌ 构建流异常终止:', err);
  process.exit(1);
});
