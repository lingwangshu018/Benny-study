# 🐰 Benny Study · 小兔上岸

一个面向公考长期备考的童话风学习作战系统。

## 已完成

- 首页
- 完整课程库
- 每日执行计划
- 今日任务
- 错题库
- 学习进度
- 每周复盘
- 考试中心
- 番茄钟
- 行测训练室
- Excel 导入与自动排课
- JSON 导入 / 导出
- GitHub 仓库云存档

## 使用方法

1. 打开网站后进入「完整课程库」。
2. 导入包含以下工作表的 Excel：
   - 基础轮
   - 题海轮
   - 突破轮
   - 模拟轮
3. 点击「自动排课」。
4. 每天在「今日任务」完成并勾选课程。
5. 晚上只整理错题。

## GitHub 云存档

网站右上角点击设置：

- 仓库：`lingwangshu018/Benny-study`
- 分支：`main`
- 存档路径：`data/benny-study-backup.json`
- Token：使用 Fine-grained personal access token，仅授予本仓库 `Contents: Read and write`

Token 只保存在当前浏览器的 localStorage，不会写入仓库。

## 开启 GitHub Pages

进入仓库：

`Settings → Pages → Build and deployment → Deploy from a branch`

选择：

- Branch: `main`
- Folder: `/ (root)`

保存后等待部署完成。

## 数据说明

- 日常数据默认保存在浏览器 localStorage。
- 可随时导出完整 JSON 存档。
- 可将完整存档备份至 GitHub 仓库。
- 齐麟数资按刷题/页数任务识别，不当作视频时长。
