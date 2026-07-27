# NoNote 官网落地页实施计划

> Date: 2026-07-27  
> Status: Ready  
> Design: `docs/superpowers/specs/2026-07-27-landing-page-design.md`  
> Branch: `landing-page`

## 交付目标

在不使用 Vue、React 或其他前端框架的前提下，交付一个可直接部署的中英文 NoNote 官网。页面以真实产品证据、Local-First 信任和短下载路径为核心，并通过少量原生交互解释产品工作方式。

## 核心 tradeoff

选择 Node.js 内置模块完成静态生成，以少量构建代码换取双语 SEO、统一内容和可验证下载配置。浏览器端只保留渐进增强逻辑，不把核心内容或下载能力放进 JavaScript。

首版不实现 CMS、统计、博客、视频、3D、WebGL 或动画依赖。

## 前置条件

- Node.js 20 或更新版本；
- `landing` 独立仓库处于 `landing-page` 分支；
- NoNote 最新公开 Release 可访问；
- 可运行或可截图的 NoNote 最新发布版本；
- 生产部署时提供 HTTPS `SITE_URL`。

## 阶段 1：建立静态生成骨架

### 用户价值

先确保双语页面能够稳定生成、部署和被搜索引擎正确识别，避免视觉实现建立在脆弱基础上。

### 文件

- `package.json`
- `scripts/build.mjs`
- `scripts/dev.mjs`
- `scripts/lib/content.mjs`
- `scripts/lib/paths.mjs`
- `src/templates/page.html`
- `src/content/en.json`
- `src/content/zh-CN.json`
- `src/content/site.json`
- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/scripts/main.js`

### 实施

1. 建立零运行时依赖的 npm scripts：
   - `npm run dev`
   - `npm run build`
   - `npm run check`
2. 使用 Node 内置 `http`、`fs`、`path` 实现本地静态服务器和构建器。
3. 构建器读取 HTML 模板及中英文 JSON，生成：
   - `dist/index.html`
   - `dist/en/index.html`
   - `dist/zh-CN/index.html`
4. 根页面保留英文默认内容和显式语言链接；首次访问时允许根据浏览器语言跳转。
5. 强制校验 `SITE_URL`：
   - 生产构建必须是绝对 HTTPS URL；
   - 本地开发使用明确的 localhost 默认值；
   - URL 统一去除末尾 `/`。
6. 建立递归内容 key 校验，阻止中英文结构漂移。
7. 复制静态资源时保留稳定目录结构，不进行隐式文件改名。

### 验证

- 冷启动执行 `npm install` 后不下载第三方依赖；
- `npm run build` 可重复执行且产物一致；
- 缺少生产 `SITE_URL` 时构建明确失败；
- 中英文缺少任意必填 key 时构建明确失败；
- 三个 HTML 入口均可直接打开并导航。

### 提交

```text
feat: add framework-free static site generator
```

## 阶段 2：确定品牌资产与真实产品素材

### 用户价值

用当前真实产品建立信任，避免官网看起来像尚未落地的概念项目。

### 文件

- `src/assets/brand/nonote-mark.svg`
- `src/assets/brand/favicon.svg`
- `src/assets/brand/apple-touch-icon.png`
- `src/assets/product/*`
- `src/assets/social/og-en.png`
- `src/assets/social/og-zh-CN.png`
- `src/assets/product/manifest.json`
- `docs/assets/landing-screenshot-source.md`
- `DESIGN.md`

### 实施

1. 从 NoNote 应用现有 `nonote-icon.svg` 派生官网标志，保留品牌识别，不重画一个无关 Logo。
2. 创建无敏感信息的演示 Workspace。
3. 以最新公开 tag 采集四类画面：
   - 完整工作台；
   - 混合搜索结果；
   - 带引用的 Assistant 回答；
   - Save as Note 确认预览。
4. 截图清单记录：
   - 产品 tag；
   - 操作系统；
   - 界面语言；
   - 场景说明；
   - 裁切或遮盖说明。
5. 输出 AVIF、WebP 和 PNG 回退；每个变体声明尺寸。
6. 生成中英文分享卡片，不伪造 UI 或数据。
7. 根据已确认方向写入 `DESIGN.md`：
   - OKLCH 色彩 token；
   - 字体栈；
   - 间距与容器；
   - 圆角、边框和阴影；
   - 动画时长和 easing；
   - 响应式原则。

### 验证

- 每张产品图均能追溯到真实 tag；
- 截图不包含用户真实路径、API key 或个人资料；
- 图片尺寸与 manifest 一致；
- AVIF/WebP 变体可以被浏览器解码；
- Logo、favicon 和分享图在浅色与深色预览中清晰。

### 提交

```text
assets: add verified NoNote brand and product visuals
```

## 阶段 3：实现完整双语页面

### 用户价值

完成从理解产品、建立信任到下载的主路径。

### 文件

- `src/templates/page.html`
- `src/templates/partials/header.html`
- `src/templates/partials/hero.html`
- `src/templates/partials/workflow.html`
- `src/templates/partials/capabilities.html`
- `src/templates/partials/local-first.html`
- `src/templates/partials/showcase.html`
- `src/templates/partials/download.html`
- `src/templates/partials/faq.html`
- `src/templates/partials/footer.html`
- `src/content/en.json`
- `src/content/zh-CN.json`
- `src/styles/layout.css`
- `src/styles/components.css`
- `src/styles/responsive.css`

### 实施

1. 先实现语义化 HTML 和无样式可读顺序：
   - Skip link；
   - Header；
   - Main；
   - 九个内容区；
   - Footer。
2. 分别创作中英文文案，保持相同事实与结构，不逐字翻译。
3. Hero 首屏包含：
   - 品牌主张；
   - 产品类别解释；
   - 推荐下载入口；
   - GitHub 次级入口；
   - 静态可读的真实产品图。
4. 用交错图文而非重复卡片墙呈现核心能力。
5. Local-First 段落使用深色叙事区和静态可读 SVG。
6. 产品实景围绕三个连续使用场景，不重复罗列功能。
7. FAQ 使用原生 `details` / `summary`。
8. 中英文页面互相提供明确语言链接。

### 响应式策略

- Mobile-first；
- 内容容器使用流式宽度；
- 375px 下主 CTA 和下载项可完整操作；
- 768px 起恢复双列图文；
- 1024px 起呈现非对称产品构图；
- 1440px 控制最大行长和视觉密度，不无限拉宽；
- 页面在 320px 和 200% 缩放下不横向溢出。

### 验证

- 禁用 CSS 后仍能按正确顺序阅读；
- 禁用 JavaScript 后导航、语言入口、FAQ 和下载均可用；
- 中英文无截断、孤行或异常断词；
- 所有交互目标至少 44×44px；
- 标题层级连续，页面只有一个主标题；
- 所有功能截图有描述性 alt。

### 提交

```text
feat: build bilingual NoNote landing page
```

## 阶段 4：加入有意义的渐进增强

### 用户价值

让访客通过操作理解 NoNote，而不是只阅读静态功能说明。

### 文件

- `src/scripts/navigation.js`
- `src/scripts/language.js`
- `src/scripts/hero-demo.js`
- `src/scripts/workflow.js`
- `src/scripts/reveal.js`
- `src/scripts/platform.js`
- `src/styles/motion.css`

### 实施

1. 移动导航：
   - 按钮使用 `aria-expanded`；
   - Escape 关闭；
   - 点击外部关闭；
   - 关闭后恢复焦点。
2. 语言偏好：
   - 用户主动选择后写入 localStorage；
   - 浏览器语言只影响首次根路径访问；
   - 不覆盖用户选择。
3. Hero 演示：
   - 搜索、引用、回答三个热点；
   - 自动播放一次；
   - 用户点击后停止自动播放；
   - 页面隐藏时暂停；
   - 对应说明对屏幕阅读器可用。
4. 工作流：
   - 四个真实按钮；
   - 左右方向键切换；
   - 正确的 tab / panel 关系；
   - 初始 HTML 保留全部静态内容。
5. Local-First SVG：
   - 使用 `IntersectionObserver` 添加一次性状态；
   - 不以透明状态作为默认内容；
   - 不持续监听滚动位置。
6. 下载推荐：
   - 优先 `navigator.userAgentData`；
   - 保守回退到 user agent；
   - 只突出、不隐藏其他平台；
   - 未知系统不作错误推荐。
7. 全局 reduced-motion：
   - 停止自动演示；
   - 移除位移与路径绘制；
   - 保留即时状态变化。

### 验证

- 全键盘完成菜单、Hero、工作流和下载选择；
- reduced-motion 下无自动运动；
- 未知平台展示全部下载；
- 页面切后台后 Hero 不继续计时；
- JavaScript 初始化执行两次不会重复绑定事件；
- 控制台无错误。

### 提交

```text
feat: add accessible product interactions
```

## 阶段 5：接入真实 Release 下载

### 用户价值

保证下载按钮始终对应真实、完整、已发布的安装包。

### 文件

- `scripts/sync-release.mjs`
- `scripts/lib/release.mjs`
- `src/content/releases.json`
- `src/content/releases.schema.json`
- `src/templates/partials/download.html`
- `src/scripts/platform.js`
- `tests/release.test.mjs`

### 实施

1. 使用 GitHub 最新已发布 Release API，排除 draft 和 prerelease。
2. 只接受三个资产模式：
   - macOS arm64 DMG；
   - macOS x64 DMG；
   - Windows x64 setup.exe。
3. 校验 tag、版本、资产名称、URL 和 size。
4. 将同步结果写入可 review 的 `releases.json`。
5. 正式构建只读取 manifest，不在客户端调用 GitHub。
6. 系统要求字段人工维护：
   - Windows 10 22H2 或更新；
   - macOS 未完成最低版本验证前链接 Release requirements，不猜测版本。
7. Release 不完整时阻止生产构建；本地预览可以使用最后一次已验证 manifest，并显示开发警告。
8. 下载按钮附带版本、架构、文件类型和未签名构建提示；不承诺绕过 Gatekeeper 或 SmartScreen。

### 验证

- 使用 fixture 测试完整、缺资产、多余资产、draft、prerelease、零 size 和错误命名；
- 三个平台 URL 都指向同一已发布 tag；
- 网络失败不覆盖现有 manifest；
- manifest 变更在 Git diff 中清晰可 review；
- 下载页始终提供 GitHub Release 回退链接。

### 提交

```text
feat: source downloads from verified GitHub releases
```

## 阶段 6：SEO、分享和部署产物

### 用户价值

让中英文页面可被正确索引、分享，并能部署到任意静态托管平台。

### 文件

- `scripts/lib/seo.mjs`
- `src/templates/page.html`
- `src/content/site.json`
- `src/assets/social/*`
- `src/robots.txt`
- `tests/seo.test.mjs`

### 实施

1. 使用 `SITE_URL` 生成：
   - canonical；
   - `hreflang` 与 `x-default`；
   - Open Graph URL；
   - SoftwareApplication JSON-LD URL；
   - sitemap。
2. 每种语言提供独立 title、description 和分享内容。
3. 根路径是 `x-default`；`/en/` 与 `/zh-CN/` 各自 canonical。
4. 结构化数据只填写真实字段，不加入评分、虚构价格或不存在的平台。
5. 生成 `robots.txt`、`sitemap.xml`、favicon 和 web manifest。
6. 所有部署路径使用根相对或由构建器安全生成的 URL，禁止写死 GitHub Pages 子路径。

### 验证

- HTTPS `SITE_URL` 构建通过，HTTP/相对/非法 URL 构建失败；
- 三个页面的 canonical 和 hreflang 互相完整；
- sitemap 仅包含规范页面；
- JSON-LD 可解析；
- Open Graph 图片 URL 为绝对地址；
- 页面 title 与 description 在中英文下不同且自然。

### 提交

```text
feat: add bilingual SEO and deployment metadata
```

## 阶段 7：生产验证与发布准备

### 用户价值

确保官网不仅视觉完成，而且在真实设备、低性能网络和辅助技术下可靠。

### 文件

- `scripts/check.mjs`
- `tests/content.test.mjs`
- `tests/build.test.mjs`
- `tests/markup.test.mjs`
- `docs/deployment.md`
- `README.md`

### 自动检查

1. 使用 Node test runner，不引入测试框架。
2. 检查：
   - 双语 key；
   - 必填 SEO；
   - 重复 id；
   - 图片 alt；
   - 内部链接和资源路径；
   - Release manifest；
   - sitemap、robots 和 JSON-LD；
   - JavaScript 与首屏资源体积。
3. 若环境已有可用浏览器自动化工具，执行交互和截图回归；否则将真实浏览器矩阵作为人工验收，不为此引入大型依赖。

### 浏览器矩阵

- Chromium、WebKit、Firefox；
- 375、768、1024、1440px；
- 200% 页面缩放；
- 中英文；
- 键盘与屏幕阅读顺序；
- reduced-motion；
- 无 JavaScript；
- macOS、Windows 和未知平台；
- 慢速网络与图片失败。

### 性能与质量门槛

- LCP ≤ 2.5s；
- CLS ≤ 0.1；
- INP ≤ 200ms；
- 首屏关键资源约 500KB 以内；
- 自有 JavaScript gzip 后尽量 ≤ 20KB；
- Lighthouse 四项 95+，若工具或环境导致波动，记录真实数值和原因，不修改数据。

### 文档

`README.md` 说明本地开发、构建和验证。`docs/deployment.md` 说明：

- `SITE_URL`；
- Release 同步；
- 静态目录部署；
- 缓存策略；
- 回滚方式；
- 发布前人工检查。

### 提交

```text
test: verify landing page for production
```

## 最终验收

实施完成必须同时满足：

1. 所有源代码位于 `landing/src` 或 `landing/scripts`，无代码写入 NoNote 主仓库；
2. `landing` 仓库工作区干净，每个阶段独立提交；
3. 中英文页面都能独立访问、分享和被索引；
4. 首次访客能从首屏理解产品并找到下载；
5. 三种安装包来自同一已发布 Release；
6. 无 JavaScript时核心内容和下载可用；
7. 键盘、减少动画和移动端验收通过；
8. 自动检查、生产构建和浏览器验证实际运行通过；
9. 部署文档和未来更新 Release 的流程完整；
10. 未经用户明确要求，不推送分支、不创建 PR、不部署生产。

## 风险与控制

- 产品素材不足：先完成可追溯截图清单，再进入视觉组合。
- Release API 或仓库权限变化：manifest 作为审查和回退边界，网络失败不覆盖。
- 双语质量漂移：结构自动检查加人工文案审查。
- 动画范围膨胀：任何交互必须解释产品或改善下载，受 20KB JS 预算约束。
- 未知生产域名：构建参数化 `SITE_URL`，部署前必须明确。
- 浏览器测试依赖扩大：优先使用现有工具，缺失时人工验证，不为单页提前引入平台。

## 后续演进

首版上线并获得真实访问与下载反馈后，才评估：

- 用例详情页；
- 更新日志或文档入口；
- 隐私友好的匿名转化分析；
- 真实用户案例；
- 平台 CTA 优化；
- 轻量内容管理。

不为这些候选提前设计 CMS 或路由框架。
