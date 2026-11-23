import path from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { name: '320x640', width: 320, height: 640 },
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
] as const;

const DEMO_STORAGE_V2 = {
  schemaVersion: 2,
  baseline: {
    fixedSalary: 12000,
    sideIncome: 1500,
    currentBalance: 15000,
    fixedBills: { rent: 4000, utilities: 800, subscriptions: 300, other: 200 },
    variableBuckets: { groceries: 2500, transport: 800, leisure: 600, other: 300 },
  },
  items: [
    {
      id: '1',
      name: 'صندوق الطوارئ',
      category: 'goal',
      totalAmount: 24000,
      alreadySaved: 6000,
      targetDate: '2027-05',
      createdAt: 1700000000000,
    },
    {
      id: '2',
      name: 'قرض السيارة',
      category: 'debt',
      totalAmount: 30000,
      alreadySaved: 12000,
      targetDate: '2027-09',
      createdAt: 1700000000000,
    },
    {
      id: '3',
      name: 'مصاريف العيد',
      category: 'shock',
      totalAmount: 8000,
      alreadySaved: 2000,
      targetDate: '2027-02',
      createdAt: 1700000000000,
    },
  ],
  whatIf: {},
  balanceUpdatedAt: Date.now(),
  meta: { lastExportAt: null },
  updatedAt: Date.now(),
};

test.describe('miZan V1 E2E, Accessibility & PWA Gates', () => {
  test('zero horizontal overflow & responsive nav across all 6 viewports and 4 tabs', async ({
    page,
  }) => {
    await page.addInitScript(data => {
      localStorage.setItem('mizan-data', JSON.stringify(data));
    }, DEMO_STORAGE_V2);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const hash of ['#/', '#/goals', '#/budget', '#/data']) {
        await page.goto(`/${hash}`);
        await page.waitForLoadState('networkidle');

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        );
        expect(overflow, `Overflow at ${vp.name} on ${hash}`).toBeLessThanOrEqual(0);

        const bottomNav = page.locator('nav.md\\:hidden');
        const sideNav = page.locator('aside.hidden.lg\\:flex');
        if (vp.width < 768) {
          await expect(bottomNav).toBeVisible();
          await expect(sideNav).toBeHidden();
        } else if (vp.width >= 1024) {
          await expect(bottomNav).toBeHidden();
          await expect(sideNav).toBeVisible();
        } else {
          await expect(bottomNav).toBeHidden();
        }
      }
    }
  });

  test('Quick Check-in persists across reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/');

    await page.getByRole('button', { name: 'تحديث سريع' }).first().click();
    const balanceInput = page.getByRole('textbox', { name: 'شحال عندك دابا' });
    await expect(balanceInput).toBeVisible();
    await balanceInput.fill('25000');
    await page.getByRole('button', { name: 'سجّل' }).click();

    await expect(page.getByText('25.000').first()).toBeVisible();
    // Wait past 300ms debounce before reload
    await page.waitForTimeout(450);

    await page.reload();
    await expect(page.getByText('25.000').first()).toBeVisible();
  });

  test('corrupt localStorage boots cleanly with quarantine recovery banner', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded-corrupt')) {
        localStorage.setItem('mizan-data', '{"schemaVersion": 2, "broken":');
        sessionStorage.setItem('seeded-corrupt', '1');
      }
    });

    await page.goto('/#/');
    await expect(page.getByText('لقينا بيانات خاسرة')).toBeVisible();

    const recoveredKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k => k.startsWith('mizan-data.recovered.'))
    );
    expect(recoveredKeys.length).toBeGreaterThanOrEqual(1);
  });

  test('malformed import fixtures are rejected without altering stored state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(data => {
      localStorage.setItem('mizan-data', JSON.stringify(data));
    }, DEMO_STORAGE_V2);

    await page.goto('/#/data');
    const before = await page.evaluate(() => localStorage.getItem('mizan-data'));

    const badFixtures = [
      'partial-baseline.json',
      'string-numbers.json',
      'future-version.json',
      'bad-item-target.json',
      'corrupt-syntax.json',
    ];

    for (const fixture of badFixtures) {
      const filePath = path.resolve(process.cwd(), 'src/storage/fixtures', fixture);
      await page.locator('input[type="file"]').setInputFiles(filePath);
      await page.waitForTimeout(150);
      const after = await page.evaluate(() => localStorage.getItem('mizan-data'));
      expect(after, `Fixture ${fixture} must not mutate state`).toBe(before);
    }
  });

  test('RTL chart invariant: Today (month 0) sits to the right of Month 12', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(data => {
      localStorage.setItem('mizan-data', JSON.stringify(data));
    }, DEMO_STORAGE_V2);

    await page.goto('/#/');
    const svg = page.locator('section[aria-labelledby="timeline-title"] svg');
    await expect(svg).toBeVisible();

    const coords = await svg.evaluate(el => {
      const texts = Array.from(el.querySelectorAll('text'));
      const todayEl = texts.find(t => t.textContent?.trim() === 'اليوم');
      const m12El = texts.find(t => t.textContent?.trim() === '12ش');
      return {
        todayX: todayEl ? Number(todayEl.getAttribute('x')) : null,
        m12X: m12El ? Number(m12El.getAttribute('x')) : null,
      };
    });

    expect(coords.todayX).not.toBeNull();
    expect(coords.m12X).not.toBeNull();
    expect(coords.todayX!).toBeGreaterThan(coords.m12X!);
  });

  test('axe-core reports 0 serious/critical violations across all 4 tabs and open sheets', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(data => {
      localStorage.setItem('mizan-data', JSON.stringify(data));
    }, DEMO_STORAGE_V2);

    for (const hash of ['#/', '#/goals', '#/budget', '#/data']) {
      await page.goto(`/${hash}`);
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(blocking, `Axe violations on ${hash}: ${JSON.stringify(blocking)}`).toEqual([]);
    }

    // Check open Quick Check-in sheet
    await page.goto('/#/');
    await page.getByRole('button', { name: 'تحديث سريع' }).first().click();
    const checkinAxe = await new AxeBuilder({ page }).analyze();
    expect(
      checkinAxe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    ).toEqual([]);
  });

  test('PWA manifest, icons, zero third-party requests, and offline reload', async ({
    page,
    context,
    request,
  }) => {
    const externalRequests: string[] = [];
    page.on('request', req => {
      const url = req.url();
      if (!url.startsWith('http://127.0.0.1:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        externalRequests.push(url);
      }
    });

    const manifestRes = await request.get('/manifest.webmanifest');
    expect(manifestRes.status()).toBe(200);
    const manifest = (await manifestRes.json()) as {
      dir: string;
      lang: string;
      display: string;
      theme_color: string;
      icons: { src: string; type: string }[];
      screenshots?: { src: string; type: string }[];
    };
    expect(manifest.dir).toBe('rtl');
    expect(manifest.lang).toBe('ar-MA');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0F766E');

    for (const icon of manifest.icons) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.status(), `Icon ${icon.src} must return 200`).toBe(200);
      expect(iconRes.headers()['content-type']).toContain('image/png');
    }

    for (const shot of manifest.screenshots ?? []) {
      const shotRes = await request.get(shot.src);
      expect(shotRes.status(), `Screenshot ${shot.src} must return 200`).toBe(200);
      expect(shotRes.headers()['content-type']).toContain('image/png');
    }

    await page.goto('/#/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Reload once so the activated SW takes control of the client
    await page.reload();
    const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
    expect(controlled).toBe(true);
    expect(externalRequests).toEqual([]);

    // Go offline and reload
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('ميزان').first()).toBeVisible();
    await context.setOffline(false);
  });
});
