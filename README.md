# 鹈鹕骑行

使用 Three.js 制作的实时 3D 海岸骑行动画。鹈鹕踩踏、自行车车轮与路面同步运动，腿部通过两段逆运动学连接脚踏。支持触摸旋转、缩放、暂停、速度调整和恢复视角。

静态网页入口为 `dist/index.html`。在项目目录运行 `python3 -m http.server 8080 --directory dist`，访问 `http://localhost:8080`。需要支持 WebGL 的浏览器。Three.js 0.180.0 已包含在 `dist/vendor/`，运行时不依赖外部 CDN。第三方许可见 `dist/vendor/THREE-LICENSE.txt`。

原仓库内容由本次提交替换，旧版本仍保留在 Git 历史中。
