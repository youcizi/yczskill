import puppeteer from 'puppeteer';

let browser = null;
let page = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function ensureLogin() {
  if (page && !page.isClosed()) return page;
  
  browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: './xhs_profile',  // 持久化登录状态
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const pages = await browser.pages();
  page = pages.length > 0 ? pages[0] : await browser.newPage();
  
  // 设置移动端 User-Agent
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36');
  
  await page.goto('https://www.xiaohongshu.com', { waitUntil: 'networkidle2' });
  
  // 检查是否需要登录
  const needLogin = await page.evaluate(() => {
    return document.querySelector('.login-container') !== null || document.querySelector('.login-box') !== null;
  });
  
  if (needLogin) {
    console.log('请扫描二维码登录，等待30秒...');
    await delay(30000);
  }
  
  return page;
}

export async function publishContent(title, content, images = []) {
  const page = await ensureLogin();
  
  // 点击发布按钮 (根据 XHS 实际选择器调整)
  // NOTE: 以下选择器为模拟，实际需根据小红书网页结构适配
  try {
    await page.waitForSelector('.publish-btn', { timeout: 5000 });
    await page.click('.publish-btn');
  } catch (e) {
    console.log('未找到标准发布按钮，尝试其他方式...');
  }
  
  await delay(2000);
  
  // 上传图片
  if (images.length > 0) {
    const input = await page.waitForSelector('input[type="file"]');
    await input.uploadFile(...images);
    await delay(2000);
  }
  
  // 输入标题（限制20字）
  await page.type('.title-input', title.slice(0, 20));
  
  // 输入正文
  await page.type('.content-editor', content);
  
  // 添加标签 (示例)
  try {
    const tagBtn = await page.$('.add-tag-btn');
    if (tagBtn) {
      await tagBtn.click();
      await delay(1000);
    }
  } catch (e) {}
  
  // 发布
  await page.click('.publish-submit');
  await delay(3000);
  
  return { success: true, message: '发布流程执行完毕' };
}
