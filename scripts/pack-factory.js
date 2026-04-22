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
 */
function archiveDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: ['node_modules/**', '.git/**', '__pycache__/**', 'dist/**', '.DS_Store']
    });
    archive.finalize();
  });
}

async function hasSourceCode(dir) {
  const files = await fs.readdir(dir);
  const sourceFiles = ['.py', '.js', '.ts', '.sh', '.rs', 'package.json', 'requirements.txt'];
  return files.some(file => sourceFiles.includes(file) || sourceFiles.includes(path.extname(file)));
}

async function packFactory() {
  console.log('🚀 启动装配工厂双语构建流...');

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
      if (!(await fs.pathExists(metaPath))) continue;

      const meta = await fs.readJson(metaPath);
      const entry = {
        ...meta,
        id: meta.id || slug,
        slug: meta.slug || slug,
        type: isSkill ? 'skill' : 'mcp',
        name_en: meta.name_en || meta.name, // 兜底
        description_en: meta.description_en || meta.description,
        icon: meta.icon || (isSkill ? 'cpu' : 'wrench')
      };

      if (isSkill) {
        const zipName = `${entry.slug}.zip`;
        await archiveDirectory(itemPath, path.join(DIST_SKILLS, zipName));
        entry.download_url = `/dist-skills/${zipName}`;
        entry.driver_type = "zip_package";
        skillsRegistry.push(entry);
      } else {
        entry.driver_type = "mcp";
        if (await hasSourceCode(itemPath)) {
          const zipName = `${entry.slug}.zip`;
          await archiveDirectory(itemPath, path.join(DIST_MCPS, zipName));
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

  // 全量双语搜索索引
  const searchIndex = [
    ...skillsRegistry,
    ...mcpsRegistry
  ];
  await fs.writeJson(SEARCH_INDEX, searchIndex);
  console.log(`✨ 构建完成。索引包含 ${searchIndex.length} 个项目。`);
}

packFactory().catch(console.error);
