# Benny Study Android APK

Benny Study 使用 Capacitor 将现有网页和插画打包为 Android APK。

## 日常更新

1. 照常修改网页源码并提交到 `main`。
2. GitHub Actions 自动运行 `Build Benny Study APK`。
3. 打开仓库的 Actions 页面，进入最新一次成功构建。
4. 在 Artifacts 下载 `Benny-Study-APK-*`。
5. 解压并安装 APK；新版可以直接覆盖旧版。

也可以在 Actions 页面手动点击 `Run workflow` 构建。

## 当前设置

- App 名称：Benny Study
- Android 包名：`com.lingwangshu.bennystudy`
- 使用单兔头像生成应用图标和启动画面
- 网页资源全部装入 APK
- XLSX 与 JSZip 在构建时转为本地资源，核心导入导出功能可离线使用
- 每次构建自动提高 Android 版本号
- 后续 APK 使用同一套个人测试签名，可覆盖安装并保留应用数据

## 数据迁移

浏览器版和 APK 版的本地数据彼此独立。第一次安装时，可先在网页导出完整 JSON 存档，再在 APK 中导入。

日后安装新版 APK 时直接覆盖安装即可。重要数据仍建议定期导出 JSON 备份。

## 相关文件

- `package.json`
- `capacitor.config.json`
- `scripts/prepare-android-web.mjs`
- `.github/workflows/build-android-apk.yml`

当前构建适合个人侧载测试，不用于应用商店正式发布。
