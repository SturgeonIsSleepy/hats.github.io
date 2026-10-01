# 鹈鹕骑行 · 镰仓高校前

使用 Three.js 制作的实时 3D 海岸骑行动画。鹈鹕踩踏、自行车车轮与路面同步运动，腿部通过两段逆运动学连接脚踏。支持触摸旋转、缩放、暂停、速度调整和恢复视角。

静态网页入口为 `dist/index.html`。在项目目录运行 `python3 -m http.server 8080 --directory dist`，访问 `http://localhost:8080`。需要支持 WebGL 的浏览器。Three.js 0.180.0 已包含在 `dist/vendor/`，运行时不依赖外部 CDN。第三方许可见 `dist/vendor/THREE-LICENSE.txt`。

原仓库内容由本次提交替换，旧版本仍保留在 Git 历史中。


## 湘南场景

以镰仓高校前站（EN08）实景为参考，加入江之电绿米色双车厢、单线铁路、架空接触网、黄黑道口栏杆与交替红灯、临海道路、护栏、坡道和住宅。鹈鹕接近道口，等待列车通过及栏杆抬起，再骑向海边。海面采用实时波浪、反光与岸边泡沫着色，路面与混凝土具有颗粒纹理。

这是根据照片制作的三维场景，建筑尺寸和骑行时序经过艺术调整，未使用测绘或照片扫描模型。实景照片只作建模参考，不作为网页背景使用。

参考：
- 江之电官方站点与照片：https://www.enoden.co.jp/train/station/kamakurakokomae/
- 道口朝海方向照片：https://umamibites.com/sightseeing/where-is-the-slam-dunk-train-crossing-in-japan
