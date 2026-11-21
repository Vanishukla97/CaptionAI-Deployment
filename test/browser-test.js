const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const app = require('../server');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const SAMPLE_IMAGE_PATH = path.join(__dirname, 'sample_golden_retriever.jpg');
const BASE_URL = 'http://localhost:3000';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runBrowserVerification() {
  console.log('====================================================');
  console.log('CaptionAI — Full Browser Verification with Puppeteer');
  console.log('====================================================');

  // Start Express server if not already running
  let serverInstance = null;
  await new Promise((resolve) => {
    const s = app.listen(3000, () => {
      console.log('Express server started on port 3000 for browser test.');
      serverInstance = s;
      resolve();
    });
    s.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.log('Server already running on port 3000.');
        resolve();
      } else {
        console.error('Server listen error:', err);
        resolve();
      }
    });
  });

  let executablePath;
  if (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
    executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  } else if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  console.log('Launching browser with:', executablePath || 'bundled Chromium');
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  async function selectCaptionType(val) {
    await page.evaluate((value) => {
      const input = document.querySelector(`input[name="captionType"][value="${value}"]`);
      if (input) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, val);
    await sleep(300);
  }

  const screenshotsTaken = [];

  try {
    // ----------------------------------------------------
    // 1. Dashboard View (1440x900)
    // ----------------------------------------------------
    console.log('\n[1/12] Verifying Dashboard at 1440x900...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    const title = await page.title();
    console.log('Page Title:', title);

    const shot1 = path.join(SCREENSHOT_DIR, '01_dashboard_1440x900.png');
    await page.screenshot({ path: shot1, fullPage: true });
    screenshotsTaken.push('01_dashboard_1440x900.png');

    // ----------------------------------------------------
    // 2. Navigation to Create Caption
    // ----------------------------------------------------
    console.log('\n[2/12] Navigating to Create Caption Section...');
    await page.click('a[data-section="create"]');
    await page.waitForSelector('#create-section:not(.d-none)');
    await sleep(300);

    const shot2 = path.join(SCREENSHOT_DIR, '02_create_section_empty.png');
    await page.screenshot({ path: shot2, fullPage: true });
    screenshotsTaken.push('02_create_section_empty.png');

    // ----------------------------------------------------
    // 3. Image Upload and Preview
    // ----------------------------------------------------
    console.log('\n[3/12] Uploading sample image...');
    const fileInput = await page.$('#fileInput');
    await fileInput.uploadFile(SAMPLE_IMAGE_PATH);

    await page.waitForSelector('#imagePreview:not(.d-none)');
    const filename = await page.$eval('#previewFilename', el => el.textContent);
    const size = await page.$eval('#previewSize', el => el.textContent);
    console.log(`Image Preview displayed: Filename="${filename}", Size="${size}"`);

    const shot3 = path.join(SCREENSHOT_DIR, '03_image_uploaded_preview.png');
    await page.screenshot({ path: shot3, fullPage: true });
    screenshotsTaken.push('03_image_uploaded_preview.png');

    // ----------------------------------------------------
    // 4. Generate Short Caption
    // ----------------------------------------------------
    console.log('\n[4/12] Generating Mode 1: Short Caption...');
    await selectCaptionType('short');
    await page.click('#generateBtn');

    await page.waitForSelector('#resultArea:not(.d-none)', { timeout: 30000 });
    const shortText = await page.$eval('#resultCaption', el => el.textContent);
    console.log('Generated Short Caption:\n', shortText);

    const shot4 = path.join(SCREENSHOT_DIR, '04_result_short_caption.png');
    await page.screenshot({ path: shot4, fullPage: true });
    screenshotsTaken.push('04_result_short_caption.png');

    // Save to Library
    await page.click('#saveLibraryBtn');
    await sleep(500);

    // ----------------------------------------------------
    // 5. Generate Detailed Description
    // ----------------------------------------------------
    console.log('\n[5/12] Generating Mode 2: Detailed Description...');
    await selectCaptionType('detailed');
    await page.click('#generateBtn');

    await sleep(6500);
    const detailedText = await page.$eval('#resultCaption', el => el.textContent);
    console.log('Generated Detailed Description:\n', detailedText.substring(0, 150) + '...');

    const shot5 = path.join(SCREENSHOT_DIR, '05_result_detailed_description.png');
    await page.screenshot({ path: shot5, fullPage: true });
    screenshotsTaken.push('05_result_detailed_description.png');

    // ----------------------------------------------------
    // 6. Generate Social Media Caption
    // ----------------------------------------------------
    console.log('\n[6/12] Generating Mode 3: Social Media Caption...');
    await selectCaptionType('social');
    await page.click('#generateBtn');

    await sleep(6500);
    const socialText = await page.$eval('#resultCaption', el => el.textContent);
    console.log('Generated Social Caption:\n', socialText.substring(0, 150) + '...');

    const shot6 = path.join(SCREENSHOT_DIR, '06_result_social_caption.png');
    await page.screenshot({ path: shot6, fullPage: true });
    screenshotsTaken.push('06_result_social_caption.png');

    // ----------------------------------------------------
    // 7. Generate Accessibility Alt Text
    // ----------------------------------------------------
    console.log('\n[7/12] Generating Mode 4: Accessibility Alt Text...');
    await selectCaptionType('accessibility');
    await page.click('#generateBtn');

    await sleep(6000);
    const altText = await page.$eval('#resultCaption', el => el.textContent);
    console.log('Generated Alt Text:\n', altText);

    const shot7 = path.join(SCREENSHOT_DIR, '07_result_accessibility_alt.png');
    await page.screenshot({ path: shot7, fullPage: true });
    screenshotsTaken.push('07_result_accessibility_alt.png');

    // ----------------------------------------------------
    // 8. Generate Keywords and Tags
    // ----------------------------------------------------
    console.log('\n[8/12] Generating Mode 5: Keywords & Tags...');
    await selectCaptionType('keywords');
    await page.click('#generateBtn');

    await sleep(6000);
    const tagsText = await page.$eval('#resultCaption', el => el.textContent);
    console.log('Generated Keywords & Tags:\n', tagsText);

    const shot8 = path.join(SCREENSHOT_DIR, '08_result_keywords_tags.png');
    await page.screenshot({ path: shot8, fullPage: true });
    screenshotsTaken.push('08_result_keywords_tags.png');

    // Save keywords to Library too
    await page.click('#saveLibraryBtn');
    await sleep(500);

    // ----------------------------------------------------
    // 9. Test Edit Mode & Download
    // ----------------------------------------------------
    console.log('\n[9/12] Testing Edit Mode & UI Controls...');
    await page.click('#editBtn');
    await page.waitForSelector('#resultEdit:not(.d-none)');

    await page.type('#editTextarea', ' #PuppyLoveVerified');
    await page.click('#saveEditBtn');
    await page.waitForSelector('#resultBody:not(.d-none)');

    const shot9 = path.join(SCREENSHOT_DIR, '09_caption_edited.png');
    await page.screenshot({ path: shot9, fullPage: true });
    screenshotsTaken.push('09_caption_edited.png');

    // ----------------------------------------------------
    // 10. Verify My Library & Search
    // ----------------------------------------------------
    console.log('\n[10/12] Verifying My Library & Search Filter...');
    await page.click('a[data-section="library"]');
    await page.waitForSelector('#library-section:not(.d-none)');
    await sleep(500);

    const shot10 = path.join(SCREENSHOT_DIR, '10_my_library_view.png');
    await page.screenshot({ path: shot10, fullPage: true });
    screenshotsTaken.push('10_my_library_view.png');

    // Search filter
    await page.type('#librarySearch', 'puppy');
    await sleep(300);
    const shot11 = path.join(SCREENSHOT_DIR, '11_library_search_filter.png');
    await page.screenshot({ path: shot11, fullPage: true });
    screenshotsTaken.push('11_library_search_filter.png');

    // ----------------------------------------------------
    // 11. Settings View & Health Status
    // ----------------------------------------------------
    console.log('\n[11/12] Navigating to Settings...');
    await page.click('a[data-section="settings"]');
    await page.waitForSelector('#settings-section:not(.d-none)');
    await sleep(1000);

    const shot12 = path.join(SCREENSHOT_DIR, '12_settings_view.png');
    await page.screenshot({ path: shot12, fullPage: true });
    screenshotsTaken.push('12_settings_view.png');

    // ----------------------------------------------------
    // 12. Responsive Viewports
    // ----------------------------------------------------
    console.log('\n[12/12] Capturing Responsive Layouts across 4 Viewports...');
    const viewports = [
      { name: 'laptop_1366x768', width: 1366, height: 768, section: 'create' },
      { name: 'tablet_768x1024', width: 768, height: 1024, section: 'create' },
      { name: 'mobile_390x844', width: 390, height: 844, section: 'create' },
      { name: 'small_mobile_360x800', width: 360, height: 800, section: 'dashboard' },
    ];

    let vpIdx = 13;
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.click(`a[data-section="${vp.section}"]`).catch(() => {});
      await sleep(500);

      const filename = `${vpIdx}_responsive_${vp.name}.png`;
      const filePath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filePath, fullPage: true });
      screenshotsTaken.push(filename);
      console.log(`Saved Viewport [${vp.name}]:`, filePath);
      vpIdx++;
    }

    console.log('\nChecking Console Errors...');
    console.log('Total Console Errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Console error messages:', consoleErrors);
    }

    console.log('\n====================================================');
    console.log(`Browser Verification Completed! Generated ${screenshotsTaken.length} screenshots.`);
    console.log('====================================================');
  } catch (err) {
    console.error('Verification error:', err);
    throw err;
  } finally {
    await browser.close();
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

if (require.main === module) {
  runBrowserVerification().catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runBrowserVerification };
