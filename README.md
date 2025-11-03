# 业务数据融合后台前端项目 README

## 项目概述

本项目是一个**业务数据融合后台管理系统的前端应用**，通过调用API后台的HTTP接口获取数据，实现登录、运营首页、各类报表页面的展示和交互功能。

后端API已对接客户的"预约系统"、"培训系统"、"环境监测系统"，并提供北向HTTP接口供前端集成。

---

## 技术栈

- **前端框架**: Vue 3
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **HTTP请求**: Axios
- **图表库**: ECharts
- **构建工具**: Vite
- **样式**: SCSS
- **路由**: Vue Router 4

---

## 后端接口配置

### 基础URL
```
http://47.106.233.89:8081/grmh-eqmgrb
```

### 请求头配置
所有接口请求需在请求头中添加固定的认证key：
```javascript
headers: {
  'securityCode': '<联系接口方获取的VALUE值>'
}
```

### 跨域处理
由于后端服务器地址为 `47.106.233.89`，非本地开发环境，需要配置代理解决跨域问题：

**Vite配置示例**：
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/grmh-eqmgrb': {
        target: 'http://47.106.233.89:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grmh-eqmgrb/, '/grmh-eqmgrb')
      }
    }
  }
})
```

---

## 功能模块设计

### 1. 登录模块（Login）

#### 功能需求
- 支持**账号密码登录**（接口：`/operateDock/accountLogin`）

#### 权限控制
登录后根据用户角色判断权限：
- **可登录角色**：超级管理员、科研平台总体管理员、平台主管、技术管理员、平台负责人、平台助理、行政管理部门
- **数据权限**：
  - 超级管理员、科研平台总体管理员、行政管理部门：可查看所有数据
  - 其他角色：根据返回的 `platform`（所属平台ID）、`room`（管辖房间ID）、`eq`（管辖仪器ID）过滤数据

#### 实现思路
1. 用户输入账号密码，前端对 `用户名*密码` 进行Base64编码后发送请求
2. 接收返回的用户信息（姓名、角色、平台ID、房间ID、仪器ID、当天预约列表）
3. 将用户信息存储到 Pinia Store 和 localStorage
4. 根据角色跳转到对应页面

---

### 2. 运营首页（Dashboard）

#### 功能需求
- 展示园区关键指标（接口：`/operateDock/parkData`）
- 展示统计图表（参考 `img.png` 和 `img_1.png` 的设计）
- **不展示**：平台最新资讯、通知公告、近期培训计划

#### 数据展示内容
- 园区面积、楼栋数量、仪器数量、用户数、收入、机时数、课题组数、经费卡数
- 培训场数、培训人数、培训资料数、培训通过率
- 传感器数据（温度、湿度、水浸）
- 监控信息
- 实时报警信息

#### 实现思路
1. 调用 `/operateDock/parkData` 接口获取园区数据
2. 使用 ECharts 绘制统计图表（柱状图、饼图、折线图等）
3. 使用卡片组件展示关键指标
4. 实时轮询或WebSocket更新传感器和报警数据

---

### 3. 实体统计模块

#### 3.1 建筑统计
- 接口：`/operateDock/buildingData`
- 展示建筑基本信息和业务数据

#### 3.2 楼层统计
- 接口：`/operateDock/floorData`
- 展示楼层基本信息和包含平台

#### 3.3 房间统计
- 接口：`/operateDock/roomData`
- 展示房间信息、传感器数据、监控信息、报警信息

#### 3.4 仪器统计
- 接口：`/operateDock/eqData`（仪器列表）
- 接口：`/operateDock/bookingData`（仪器使用信息）
- 每台仪器右侧显示"使用信息"按钮，点击跳转到详情页

#### 前端分页处理
**注意**：后端接口返回的数据**没有分页**，需要前端自行实现分页逻辑。

**实现思路**：
1. 一次性获取所有数据
2. 使用 Element Plus 的 Pagination 组件
3. 根据当前页码和每页条数切割数据数组进行展示

```javascript
// 示例代码（Vue 3 Composition API）
import { ref, computed } from 'vue'

const currentPage = ref(1)
const pageSize = ref(20)
const allData = ref([])

// 计算当前页数据
const currentData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allData.value.slice(start, end)
})
```

---

### 4. 运营统计模块

#### 4.1 平台运营统计
- 接口：`/operateDock/totalPlatform`
- 展示平台总数、平台使用排名

#### 4.2 仪器运营统计
- 接口：`/operateDock/totalEq`
- 展示仪器总数、机时、使用量、收入、使用率、使用排名、时间分布、使用趋势

#### 4.3 用户运营统计
- 接口：`/operateDock/totalUser`
- 展示用户数、课题组数、经费卡数、用户类型分布、日活走势

#### 4.4 培训运营统计
- 接口：`/operateDock/totalTrain`
- 展示培训场数、培训人数、培训通过率、平台培训量排名、仪器培训量排名

#### 实现思路
1. 支持**实时查询**（type=0）和**按时段查询**（type=1）
2. 使用 Element Plus 的 DatePicker 组件选择时间范围
3. 使用 ECharts 绘制排名、趋势、分布图表

---

### 5. 使用统计模块

#### 5.1 仪器使用统计
- 接口：`/operateDock/eqStatistics`
- 支持平台筛选、关键字搜索、分页

#### 5.2 用户使用统计
- 接口：`/operateDock/userStatistics`
- 支持课题组关键字搜索、排序（次数/时长/收入）、分页

#### 5.3 课题组使用统计
- 接口：`/operateDock/piStatistics`
- 支持课题组关键字搜索、排序、分页

#### 实现思路
1. 使用 Element Plus 的 Table 组件展示数据
2. 支持列排序、列筛选、列显示/隐藏
3. 支持Excel导出功能（使用 `xlsx` 库）

---

### 6. 业绩统计模块

#### 6.1 管理员业绩统计
- 接口：`/operateDock/mgrStatistics`

#### 6.2 平台业绩统计
- 接口：`/operateDock/platformStatistics`

---

### 7. 投入产出分析模块

#### 7.1 购置投入产出分析
- 接口：`/operateDock/buyStatistics`

#### 7.2 维保投入产出分析
- 接口：`/operateDock/repairStatistics`

#### 7.3 培训投入产出分析
- 接口：`/operateDock/trainStatistics`

---

### 8. 报警统计模块

#### 8.1 环境超标报警
- 接口：`/operateDock/alarmData`
- 筛选类型：温度超标报警（type=1）、湿度超标报警（type=2）、水浸报警（type=3）

#### 8.2 忘记关机报警
- 筛选类型：忘记关机报警（type=4）

#### 8.3 仪器盗用报警
- 筛选类型：仪器盗用报警（type=5）

#### 8.4 维保到期报警
- 筛选类型：维保到期报警（type=6）

#### 8.5 劣迹用户报警
- 筛选类型：劣迹用户报警（type=7）

#### 8.6 劣迹行为报警
- 筛选类型：劣迹行为报警（type=8）

#### 8.7 违规行为报警
- 筛选类型：违规行为报警（type=9）

#### 实现思路
1. 调用 `/operateDock/alarmData` 获取所有报警数据
2. 前端根据 `type` 字段过滤不同类型的报警
3. 使用 Element Plus 的 Table 组件展示报警信息（报警名称、描述、时间、地点）

---

## 通用功能设计

### 1. 表格功能
- **列排序**：点击列头排序
- **列筛选**：支持按条件筛选
- **列显示/隐藏**：用户自定义显示列
- **Excel导出**：使用 `xlsx` 库导出表格数据

### 2. 图表功能
- 使用 ECharts 绘制各类统计图表
- 支持图表交互（点击、缩放、数据提示）

### 3. 权限控制
- 根据用户角色和数据权限过滤接口请求参数
- 非超级管理员需传递 `platform`、`room`、`eq` 参数

---

## 开发路线

### 第一阶段：基础搭建
1. 初始化 Vue 3 + Vite 项目
2. 安装依赖（Element Plus、ECharts、Axios、Pinia、Vue Router、SCSS、xlsx）
3. 配置跨域代理
4. 封装 Axios 请求拦截器（统一添加 `securityCode`）
5. 搭建路由结构
6. 配置 Pinia Store
7. 实现登录模块

### 第二阶段：核心功能开发
1. 实现运营首页（园区信息展示、图表绘制）
2. 实现实体统计模块（建筑、楼层、房间、仪器）
3. 实现前端分页逻辑

### 第三阶段：统计模块开发
1. 实现运营统计模块（平台、仪器、用户、培训）
2. 实现使用统计模块（仪器、用户、课题组）
3. 实现业绩统计模块（管理员、平台）
4. 实现投入产出分析模块

### 第四阶段：报警模块开发
1. 实现报警统计模块（环境、关机、盗用、维保、劣迹、违规）

### 第五阶段：优化与测试
1. 优化UI/UX（参考设计图 img.png 和 img_1.png）
2. 性能优化（懒加载、虚拟滚动）
3. 单元测试、集成测试
4. 部署上线

---

## 项目结构

```
frontEnd/
├── src/
│   ├── api/                 # 接口封装
│   │   ├── login.js         # 登录相关接口
│   │   ├── dashboard.js     # 运营首页接口
│   │   ├── entity.js        # 实体统计接口
│   │   ├── operation.js     # 运营统计接口
│   │   ├── usage.js         # 使用统计接口
│   │   ├── performance.js   # 业绩统计接口
│   │   ├── analysis.js      # 投入产出分析接口
│   │   └── alarm.js         # 报警统计接口
│   ├── assets/              # 静态资源
│   ├── components/          # 公共组件
│   │   ├── Table/           # 表格组件
│   │   ├── Chart/           # 图表组件
│   │   ├── Pagination/      # 分页组件
│   │   └── ...
│   ├── views/               # 页面组件
│   │   ├── Login/           # 登录页
│   │   ├── Dashboard/       # 运营首页
│   │   ├── Entity/          # 实体统计
│   │   │   ├── Building.vue # 建筑统计
│   │   │   ├── Floor.vue    # 楼层统计
│   │   │   ├── Room.vue     # 房间统计
│   │   │   └── Equipment.vue # 仪器统计
│   │   ├── Operation/       # 运营统计
│   │   │   ├── Platform.vue # 平台运营统计
│   │   │   ├── Equipment.vue # 仪器运营统计
│   │   │   ├── User.vue     # 用户运营统计
│   │   │   └── Training.vue # 培训运营统计
│   │   ├── Usage/           # 使用统计
│   │   │   ├── Equipment.vue # 仪器使用统计
│   │   │   ├── User.vue     # 用户使用统计
│   │   │   └── Group.vue    # 课题组使用统计
│   │   ├── Performance/     # 业绩统计
│   │   │   ├── Manager.vue  # 管理员业绩统计
│   │   │   └── Platform.vue # 平台业绩统计
│   │   ├── Analysis/        # 投入产出分析
│   │   │   ├── Purchase.vue # 购置投入产出分析
│   │   │   ├── Maintenance.vue # 维保投入产出分析
│   │   │   └── Training.vue # 培训投入产出分析
│   │   └── Alarm/           # 报警统计
│   │       ├── Environment.vue # 环境超标报警
│   │       ├── Shutdown.vue # 忘记关机报警
│   │       ├── Theft.vue    # 仪器盗用报警
│   │       ├── Maintenance.vue # 维保到期报警
│   │       ├── BadUser.vue  # 劣迹用户报警
│   │       ├── BadBehavior.vue # 劣迹行为报警
│   │       └── Violation.vue # 违规行为报警
│   ├── stores/              # Pinia状态管理
│   │   ├── user.js          # 用户状态
│   │   ├── permission.js    # 权限状态
│   │   └── ...
│   ├── router/              # 路由配置
│   │   └── index.js
│   ├── utils/               # 工具函数
│   │   ├── request.js       # Axios封装
│   │   ├── auth.js          # 权限控制
│   │   ├── export.js        # Excel导出
│   │   └── ...
│   ├── styles/              # 样式文件
│   │   ├── index.scss       # 全局样式
│   │   └── variables.scss   # 样式变量
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
├── public/                  # 公共资源
├── .env.development         # 开发环境变量
├── .env.production          # 生产环境变量
├── package.json
├── vite.config.js           # Vite配置
└── README.md
```

---

## 安装与运行

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run dev
```

### 生产环境构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

---

## 主要依赖

```json
{
  "dependencies": {
    "vue": "^3.x",
    "vue-router": "^4.x",
    "pinia": "^2.x",
    "element-plus": "^2.x",
    "axios": "^1.x",
    "echarts": "^5.x",
    "xlsx": "^0.18.x"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.x",
    "vite": "^4.x",
    "sass": "^1.x"
  }
}
```

---

## 注意事项

1. **接口协议**：所有接口使用 `http` 协议，无需 `https`（内部使用）
2. **跨域处理**：必须配置代理解决跨域问题
3. **前端分页**：实体统计模块的数据需前端自行分页
4. **权限控制**：根据用户角色过滤数据和功能
5. **代码规范**：
   - 导入所需的包和依赖
   - 编写详细的注释
   - 遵循 Vue 3 Composition API 风格
   - 使用 ESLint 和 Prettier 保持代码一致性

---

## 环境变量配置

### .env.development
```
VITE_API_BASE_URL=/grmh-eqmgrb
VITE_SECURITY_CODE=<联系接口方获取>
```

### .env.production
```
VITE_API_BASE_URL=http://47.106.233.89:8081/grmh-eqmgrb
VITE_SECURITY_CODE=<联系接口方获取>
```

---

## 联系方式

如有问题，请联系项目负责人或查阅接口文档《运营支撑平台开放接口对接文档_V1.0.docx》。

---

**开发愉快！🚀**

