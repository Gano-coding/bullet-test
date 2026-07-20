# goose-city-quiz 项目上下文

## Dependencies
- @supabase/supabase-js: Supabase 客户端，用于数据库、认证、存储等云服务
- @tanstack/react-router: 路由管理
- @tanstack/react-query: 数据获取和状态管理
- framer-motion: 动画库
- lucide-react: 图标库
- shadcn/ui + Radix UI: UI 组件库
- tailwindcss v4: CSS 框架
- zod: 表单验证和数据校验
- qrcode: 二维码生成
- gifenc: GIF 编码库
- html-to-image: DOM 转图片库

## Architecture
- 单页应用，使用 TanStack Router 文件路由（src/routes/）
- 首页为性格测试问卷，包含欢迎页、答题页、加载页、角色揭示页、结果页五个状态
- 音频管理通过 src/lib/sound.ts 统一处理背景音乐和音效
- 海报生成使用 Canvas API（posterCeremony.ts），GIF 生成使用 gifenc 库

## Patterns / Constraints
- 首页采用深色复古风格，背景使用渐变而非纯黑，增加视觉层次
- 所有页面必须适配移动端（H5），使用 clamp() 实现响应式字体
- 海报二维码跳转到正式域名 https://oa7gu7fu8id9.meoo.info
- 移动端音视频需等待用户首次交互后才能播放，WelcomePage 通过点击屏幕任意位置解锁
- 背景音乐使用阿里云 OSS：https://galliano.oss-cn-beijing.aliyuncs.com/bgm.mp3
- GIF 生成使用 Canvas 绘制方案，尺寸为 540x960，简化装饰元素（单层边框、无角标）
- GIF 两幕流程：Act1 全屏复刻结果页鹅城签（摇筒→飞签→展签→判词点亮→落印）→ 交叉淡入 → Act2 复刻海报预览（骰子落下→签牌展开→判词点亮→落印→签解/页脚）
- Act1 时间对齐 ResultPage（900/1500/2100ms + 字数×70ms）；Act2 时间对齐 PosterPreview（900/1600ms + 字数×55ms）
- 摇签阶段全屏显示摇签筒，完全复刻结果页的摇签筒结构（筒口椭圆、筒身渐变、底座、5根签头 rattling、飞签 eject）
