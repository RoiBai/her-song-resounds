# 颂声起 · 纵向三格阅读分支

`codex/linear-reading` 基于原版 `main` 的 `f121b31`。仅将六个关卡及最终章的解谜区域换成从上到下排列的三幅正确情节画面及原说明，移除答题与通关阻挡。

开场、封面、正文文案与版式、插画、滚动动效、十八格风化画廊、背景音乐、加载流程、尾声、参考文献、制作人员、横屏提示及原有按钮均沿用原版。原始 JS、CSS 和素材保持原样，原站仍由 `main` 发布。

## 构建与预览

无需安装依赖。仓库根目录运行：

```sh
node reader/build.mjs
python3 -m http.server 4173 --bind 127.0.0.1
```

浏览器打开 http://127.0.0.1:4173/ 。

- `reader/vertical-levels.json`：七组画面，每组三格，沿用原版正确组合和图层配置。
- `reader/vertical-levels.js`：只渲染三格画面与原说明。
- `reader/vertical-levels.css`：仅作用于上述区域的纵向布局。
- `reader/build.mjs`：核对原版脚本后，生成 `assets/index-linear-reading.js`。原版 HTML 只替换脚本地址并增加局部样式链接。

阅读版使用独立存档键 `her-song-resounds:linear-progress:v1`，原有清空/续读按钮不会覆盖原游戏记录。构建脚本锚定原版提交；原版升级后应重新核对补丁，不要直接套用到其他构建。
