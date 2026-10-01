# 鹈鹕骑行 · 镰仓高校前

Three.js 实时 3D 动画：镜头跟随鹈鹕沿江之电铁路海侧步道循环骑行，经过镰仓高校前站与经典道口。往返路线有连续掉头，没有循环边界瞬移。自行车车轮按实际移动距离旋转，腿部使用两段逆运动学踩踏。

铁路、国道 134、沿线步道、日坂及站台采用 OpenStreetMap 的实际坐标。附近 174 个建筑对象来自国土交通省 PLATEAU 镰仓市 2024 LOD1，转换为局部东、上、北坐标，保留真实轮廓、高度和位置；车站模型改为真实轮廓的开放站台与站棚。公寓外墙、窗户、阳台、围墙、道口和设施按现场照片重建。LOD1 本身没有精细扫描外观，地面和外观细节仍是近似重建。

国道上的车辆包含日系混动掀背车、轻型箱式车及紧凑 SUV 原型，遵循日本左侧行驶。海面有动态波浪、反光和泡沫；静态场景按材质合并，降低绘制开销。支持触摸旋转、缩放、暂停、速度调整与恢复跟随。

静态入口是 `dist/index.html`。运行 `python3 -m http.server 8080 --directory dist` 后打开 `http://localhost:8080`。需要 WebGL。Three.js 0.180.0 包含于 `dist/vendor/`，页面不依赖外部 CDN。第三方许可见 `dist/vendor/THREE-LICENSE.txt`。

## 数据来源与许可

- 建筑：Project PLATEAU，镰仓市 2024，LOD1。官方说明：https://www.city.kamakura.kanagawa.jp/plan/plateau.html
- 官方模型浏览器：https://plateauview.mlit.go.jp/?share=01jq8hgpxt5qz9cjva65v4gvy7
- 数据集：https://www.geospatial.jp/ckan/dataset/plateau-14204-kamakura-shi-2024
- 本地 `dist/buildings.js` 由官方建筑 3D Tiles 的 `data237.b3dm`、`data239.b3dm` 解码、转换、裁切得到。原始 tileset：https://assets.cms.plateau.reearth.io/assets/df/c163a1-13a3-4d1b-a8b0-4e07f949e091/14204_kamakura-shi_city_2024_citygml_1_op_bldg_3dtiles_lod1/tileset.json
- 道路与铁路：© OpenStreetMap contributors，ODbL。许可：https://www.openstreetmap.org/copyright 。整理后的局部坐标数据在 `dist/geography.js`，仍按 ODbL 提供。
- 车站照片：https://www.enoden.co.jp/train/station/kamakurakokomae/
- 沿线 20 张实景照片（2016 年）：https://townphoto.net/kanagawa/kamakurakokomae.html
- 道口朝海照片：https://umamibites.com/sightseeing/where-is-the-slam-dunk-train-crossing-in-japan

实景照片仅作建模参考，没有复制为网页背景或贴图。原仓库内容已替换，旧版本保留在 Git 历史中。
