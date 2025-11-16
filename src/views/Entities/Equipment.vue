<template>
  <div class="equipment-page">
    <!-- 仪器搜索下拉框 - 使用teleport渲染到body -->
    <teleport to="body" v-if="showEquipmentDropdown">
      <div 
        class="equipment-dropdown equipment-dropdown-teleported" 
        :style="dropdownStyle"
        @mousedown.prevent
      >
        <div 
          v-for="equipment in filteredEquipmentOptions" 
          :key="equipment.value"
          class="equipment-dropdown-item"
          @mousedown="selectEquipment(equipment)"
        >
          <div class="equipment-name">{{ equipment.label }}</div>
          <div class="equipment-id">ID: {{ equipment.value }}</div>
        </div>
        <div v-if="filteredEquipmentOptions.length === 0" class="equipment-dropdown-empty">
          未找到匹配的仪器
        </div>
      </div>
    </teleport>
    
    <!-- 仪器基本信息查询 -->
    <el-card class="query-card">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="查询方式">
          <el-radio-group v-model="queryForm.queryType" @change="handleQueryTypeChange">
            <el-radio-button :label="0">实时</el-radio-button>
            <el-radio-button :label="1">按时段</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="仪器ID">
          <div class="equipment-search-wrapper">
            <el-input 
              ref="equipmentSearchInput"
              v-model="equipmentSearchKeyword" 
              placeholder="请输入仪器名称或ID搜索" 
              clearable 
              @input="filterEquipmentOptions"
              @focus="handleEquipmentSearchFocus"
              @blur="hideDropdown"
              style="width: 300px;"
            />
            <el-tag v-if="queryForm.equipmentId" type="primary" style="margin-left: 10px;">
              ID: {{ queryForm.equipmentId }}
            </el-tag>
          </div>
        </el-form-item>
        
        <el-form-item label="开始日期" v-if="queryForm.queryType === 1">
          <el-date-picker
            v-model="queryForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="结束日期" v-if="queryForm.queryType === 1">
          <el-date-picker
            v-model="queryForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询仪器信息</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 仪器基本信息 -->
    <el-card class="data-card" v-loading="basicLoading" v-if="basicData">
      <div class="card-header">
        <div class="header-left">
          <h3>仪器基本信息</h3>
        </div>
        <div class="header-right">
          <el-button type="primary" size="small" @click="showUsageDialog">
            查看使用信息
          </el-button>
        </div>
      </div>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="仪器编号">{{ basicData.code || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="仪器名称">{{ basicData.name || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="仪器型号">{{ basicData.instrVersion || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="制造商">{{ basicData.manufacturer || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="所属平台">{{ basicData.platform || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ basicData.room || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="仪器状态">{{ basicData.status || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="技术参数">{{ basicData.technical || '暂无' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 技术参数和备注 -->
      <div class="tech-section" v-if="basicData.technical || basicData.remark">
        <h4>技术参数与说明</h4>
        <el-card shadow="never">
          <div v-if="basicData.technical" class="tech-content">
            <strong>技术参数：</strong>
            <p>{{ basicData.technical }}</p>
          </div>
          <div v-if="basicData.remark" class="remark-content">
            <strong>备注说明：</strong>
            <p>{{ basicData.remark }}</p>
          </div>
        </el-card>
      </div>

      <!-- 培训计划 -->
      <div class="training-section" v-if="basicData.plan && basicData.plan.length > 0">
        <h4>培训计划 ({{ basicData.plan.length }} 个)</h4>
        <el-row :gutter="15">
          <el-col :span="12" v-for="plan in basicData.plan" :key="plan.time">
            <el-card shadow="hover" class="training-card">
              <div class="training-title">{{ plan.title }}</div>
              <div class="training-time">时间：{{ plan.time }}</div>
              <div class="training-actions">
                <el-button type="primary" size="small" @click="viewTraining(plan.url)">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 报警信息 -->
      <div class="alarm-section" v-if="basicData.alarm && basicData.alarm.length > 0">
        <h4>报警信息 ({{ basicData.alarm.length }} 条)</h4>
        <el-alert
          v-for="alarm in basicData.alarm"
          :key="alarm.id"
          :title="alarm.title || '报警信息'"
          :type="alarm.level || 'warning'"
          :description="alarm.description"
          style="margin-bottom: 10px;"
        />
      </div>

      <!-- 传感器信息 -->
      <div class="sensor-section" v-if="basicData.sensor && basicData.sensor.length > 0">
        <h4>传感器信息 ({{ basicData.sensor.length }} 个)</h4>
        <el-table :data="basicData.sensor" border style="width: 100%">
          <el-table-column prop="name" label="传感器名称" min-width="200" />
          <el-table-column prop="type" label="传感器类型" width="120" />
          <el-table-column prop="value" label="当前值" width="120" />
        </el-table>
      </div>

      <!-- 摄像头信息 -->
      <div class="camera-section" v-if="basicData.camera && basicData.camera.length > 0">
        <h4>摄像头信息 ({{ basicData.camera.length }} 个)</h4>
        <el-table :data="basicData.camera" border style="width: 100%">
          <el-table-column prop="name" label="摄像头名称" min-width="200" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewCamera(row)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 负责人信息 -->
      <div class="manager-section" v-if="basicData.mgr">
        <h4>负责人信息</h4>
        <el-tag 
          v-for="manager in basicData.mgr.split(';').filter(m => m.trim())" 
          :key="manager"
          type="info"
          style="margin-right: 10px; margin-bottom: 10px;"
        >
          {{ manager.replace('null', '').trim() }}
        </el-tag>
      </div>

      <!-- 使用统计 -->
      <div class="stats-section">
        <h4>使用统计</h4>
        <el-table 
          :data="basicStatsData" 
          border 
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="category" label="统计项目" min-width="150" />
          <el-table-column prop="total" label="总计" min-width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.total !== '-'">{{ formatNumber(row.total) }}{{ row.unit }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="internal" label="内部" min-width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.internal !== '-'">{{ formatNumber(row.internal) }}{{ row.unit }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="external" label="外部" min-width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.external !== '-'">{{ formatNumber(row.external) }}{{ row.unit }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" />
        </el-table>
      </div>
    </el-card>

    <!-- 仪器使用信息弹窗 -->
    <el-dialog
      v-model="usageDialogVisible"
      title="仪器使用信息"
      width="80%"
      top="5vh"
    >
      <div class="usage-content" v-loading="usageLoading">
        <!-- 使用信息查询条件 -->
        <el-card class="usage-query-card">
          <el-form :inline="true" :model="usageQueryForm" class="usage-query-form">
            <el-form-item label="查询方式">
              <el-radio-group v-model="usageQueryForm.queryType">
                <el-radio-button :label="0">实时</el-radio-button>
                <el-radio-button :label="1">按时段</el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="开始日期" v-if="usageQueryForm.queryType === 1">
              <el-date-picker
                v-model="usageQueryForm.startDate"
                type="date"
                placeholder="选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item label="结束日期" v-if="usageQueryForm.queryType === 1">
              <el-date-picker
                v-model="usageQueryForm.endDate"
                type="date"
                placeholder="选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" size="small" @click="queryUsageData">查询使用数据</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 使用记录表格 -->
        <el-card class="usage-table-card">
          <div class="card-header">
            <h4>使用记录</h4>
            <div class="header-right">
              <el-input
                v-model="usageSearchKeyword"
                placeholder="搜索使用记录"
                style="width: 200px; margin-right: 10px;"
                clearable
                @input="handleUsageSearch"
              />
              <el-popover placement="bottom" :width="200" trigger="click">
                <template #reference>
                  <el-button size="small">列设置</el-button>
                </template>
                <div class="column-settings">
                  <el-checkbox 
                    v-for="column in usageColumns" 
                    :key="column.prop"
                    v-model="column.visible"
                    @change="handleUsageColumnChange"
                  >
                    {{ column.label }}
                  </el-checkbox>
                </div>
              </el-popover>
            </div>
          </div>
          
          <el-table
            :data="filteredUsageData"
            border
            stripe
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
            v-if="usageData.length > 0"
          >
            <el-table-column 
              v-for="column in visibleUsageColumns" 
              :key="column.prop"
              :prop="column.prop" 
              :label="column.label" 
              :min-width="column.minWidth || 120"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span v-if="column.formatter">{{ column.formatter(row[column.prop]) }}</span>
                <span v-else>{{ row[column.prop] }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="暂无使用记录" />
        </el-card>

        <!-- 使用统计汇总 -->
        <el-card class="usage-chart-card" v-if="usageStats">
          <h4>使用统计汇总</h4>
          <el-table 
            :data="usageStatsData" 
            border 
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          >
            <el-table-column prop="item" label="统计项目" min-width="150" />
            <el-table-column prop="value" label="数值" min-width="120" align="right">
              <template #default="{ row }">
                {{ row.value }}
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="80" align="center" />
            <el-table-column prop="description" label="说明" min-width="200" />
          </el-table>
        </el-card>
      </div>
    </el-dialog>

    <el-card v-if="!basicData" class="hint-card">
      <el-empty description="请选择仪器并查询基本信息" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getEqData, getBookingData } from '@/api/entities'

// 查询表单
const queryForm = reactive({
  queryType: 0,
  equipmentId: '',
  startDate: '',
  endDate: ''
})

// 仪器搜索相关
const equipmentSearchKeyword = ref('')
const filteredEquipmentOptions = ref([])
const showEquipmentDropdown = ref(false)
const equipmentSearchInput = ref(null)
const dropdownStyle = ref({})

// 仪器基本信息
const basicData = ref(null)
const basicLoading = ref(false)

// 使用信息弹窗
const usageDialogVisible = ref(false)
const usageData = ref([])
const filteredUsageData = ref([])
const usageLoading = ref(false)
const usageSearchKeyword = ref('')
const usageStats = ref(null)

// 使用信息查询表单
const usageQueryForm = reactive({
  queryType: 0,
  startDate: '',
  endDate: ''
})

// 仪器选项 - 根据提供的ID和名称数据
const equipmentOptions = ref([
  { label: '(ZEISS LSM880 NLO with Airyscan)双光子激光共聚焦扫描显微镜', value: '1' },
  { label: '(Luxendo GmbH TruLive3D imager)倒置高通量活细胞光片显微成像系统', value: '2' },
  { label: '(ZEISS LSM 900)激光共聚焦显微镜+搭配活细胞工作站', value: '4' },
  { label: '(ZEISS LSM 800)激光共聚焦显微镜', value: '5' },
  { label: '(ZEISS Axio Observer 7)全自动倒置荧光显微镜', value: '7' },
  { label: '(ZEISS Axio Zoom V16)宏观变倍荧光显微镜', value: '8' },
  { label: '(ZEISS Axio Imager.A2)正置荧光显微镜', value: '9' },
  { label: '单细胞蛋白质表达定量分析系统（milo）', value: '10' },
  { label: '蛋白免疫印迹系统', value: '11' },
  { label: '全自动智能蛋白液相色谱系统（AKTA Avant 25）', value: '12' },
  { label: '等温滴定微量热仪', value: '13' },
  { label: '气相色谱-质谱联用仪（8890-5977B）', value: '14' },
  { label: '非接触式全自动超声波细胞破碎仪（Bioruptor PICO）', value: '17' },
  { label: '离心浓缩系统（SPD2030）', value: '18' },
  { label: '超速离心机（Optima XPN-100）1', value: '19' },
  { label: '立式高速冷冻离心机（Avanti JXN-26）', value: '20' },
  { label: '液相色谱-四极杆飞行时间质谱联用仪（1290InfinityII-6546）', value: '21' },
  { label: '液相色谱-三重四极杆质谱联用仪（1290InfinityII-6495B）', value: '22' },
  { label: '超速离心机（Optima XPN-100）2', value: '26' },
  { label: '三合一超高分辨率液质联用仪（Orbitrap Eclipse）', value: '27' },
  { label: '微量热泳动仪', value: '29' },
  { label: '分子筛层析和场流分离与多角度光散射联用系统（DAWN+ECLIPSE）', value: '30' },
  { label: '多功能酶标仪（BioTek SYNERGY NEO2）', value: '31' },
  { label: '落地式高速冷冻离心机（Avanti J-E）3', value: '32' },
  { label: '荧光定量PCR仪（CFX96）-1', value: '33' },
  { label: '荧光定量PCR仪（CFX96）-2', value: '34' },
  { label: '落地式高速冷冻离心机（Avanti J-E）1', value: '35' },
  { label: '高级荧光定量PCR仪（QuantStudio 6 FLEX）', value: '36' },
  { label: '【莱迪】分选型流式细胞仪（BD FACSAria III）', value: '37' },
  { label: '【莱迪】高端流式细胞分析仪（BD LSRFortessa X-20）', value: '38' },
  { label: '流式分析仪（Beckman CytoFLEX S）', value: '39' },
  { label: '落地式高速冷冻离心机（Avanti J-E）2', value: '40' },
  { label: '600MHz 核磁共振波谱仪', value: '41' },
  { label: '细胞能量代谢仪（Seahorse XFe96）', value: '45' },
  { label: '数字PCR系统（QX200）', value: '46' },
  { label: '单细胞建库测序制备系统', value: '48' },
  { label: '超声波细胞破碎仪（S220）', value: '49' },
  { label: '高通量荧光定量PCR系统（CFX384）-1', value: '50' },
  { label: '全能型成像分析系统（FluorChem E）', value: '52' },
  { label: '冷冻干燥系统（700611140）', value: '53' },
  { label: '酶标仪（MultiskanSKY）', value: '54' },
  { label: '自动化样品破碎仪（TissulyserⅡ）', value: '55' },
  { label: '低温超高压细胞破碎仪 （JN-MiniPro）1', value: '56' },
  { label: '（Andor Dragonfly 200）转盘激光共聚焦显微镜', value: '59' },
  { label: 'PE高内涵成像系统', value: '60' },
  { label: 'Echo 650声波微量移液系统', value: '61' },
  { label: '（Carl Zeiss Axio Imager.Z2）全自动正置荧光显微镜', value: '62' },
  { label: '（Leica M205 FA）体视荧光显微镜', value: '63' },
  { label: '流式细胞仪（Accuri C6 Plus）', value: '64' },
  { label: '高端分选型流式细胞仪（BD FACSAria Fusion）', value: '65' },
  { label: '多光谱激光成像仪（Sapphire RGBNIR）', value: '66' },
  { label: '显微操作系统-1', value: '67' },
  { label: '显微操作系统-2', value: '68' },
  { label: '【莱迪】荧光定量PCR仪（QuantStudio 3）-2', value: '70' },
  { label: '全能型成像仪', value: '71' },
  { label: '【莱迪】显微激光切割系统-1（MMI CellCut plus）', value: '73' },
  { label: '激光切割机（MMI Cellcut plus）', value: '74' },
  { label: '【莱迪】荧光定量PCR仪（QuantStudio 3）-1', value: '75' },
  { label: '高级荧光定量PCR仪罗氏LC480', value: '76' },
  { label: '高级荧光定量PCR仪（QuantStudio™ 7 Flex）', value: '77' },
  { label: '多模式读板仪（PE Envision）', value: '78' },
  { label: '冰冻切片机-2', value: '80' },
  { label: 'DNA剪切仪（LE220）', value: '81' },
  { label: '生物芯片分析系统（Agilent 4200 TapeStation）', value: '82' },
  { label: '测试仪器', value: '84' },
  { label: '高通量超高效液相色谱（UPLC）-高分辨飞行时间质谱（QTof）联用仪', value: '86' },
  { label: '高通量超高效液质联用仪-UPLC', value: '87' },
  { label: '质谱引导的自动纯化仪AutoP （开放实验室）', value: '88' },
  { label: '合相色谱质谱联用仪-UPCC', value: '89' },
  { label: '高通量自动化微量加样工作站（Beckman Biomek4000）', value: '92' },
  { label: '氮吹仪', value: '94' },
  { label: 'Incucyte S3活细胞成像仪', value: '107' },
  { label: '多孔微电极阵列系统（Axion，BioSystems Maestro Pro）', value: '108' },
  { label: '细胞成像多功能微孔板检测系统（Biotek Cytation1）', value: '110' },
  { label: '分选型流式细胞仪（Sony LE-MA900FP）', value: '112' },
  { label: '流式细胞分析仪（Agilent Novocyte Advanteon）-1', value: '114' },
  { label: '全自动密度梯度分离系统（108+152）1', value: '115' },
  { label: '全自动化学发光图像分析系统（iBright FL1500）', value: '116' },
  { label: '（LEICA Aperio Versa 8）病理切片扫描系统', value: '117' },
  { label: '（ZEISS Metafer）染色体核型检测系统', value: '119' },
  { label: '低温超高压细胞破碎仪（JN-MiniPro）2', value: '121' },
  { label: '（奥林巴斯 IXplore SpinSR ）活细胞超高分辨率转盘共聚焦成像系统', value: '122' },
  { label: '（NIKON A1）激光共聚焦显微镜', value: '123' },
  { label: '（Carl Zeiss LSM 980 NLO）双光子共聚焦显微镜', value: '124' },
  { label: '（Carl Zeiss LSM 980）激光共聚焦显微镜', value: '125' },
  { label: '（Carl Zeiss Elyra 7）结构光超分辨成像系统', value: '126' },
  { label: '（Carl Zeiss Axio Zoom V16）体视荧光显微镜', value: '129' },
  { label: '测试仪器2', value: '131' },
  { label: '全自动组织处理机（gentleMACS Octo）', value: '132' },
  { label: '非接触式全自动超声波细胞破碎仪（Bioruptor PICO）2', value: '133' },
  { label: '全自动密度梯度分离系统（108+152）2', value: '134' },
  { label: 'PCR仪（赛默飞ProFlex ）', value: '137' },
  { label: '梯度PCR仪（赛默飞 Veriti）', value: '138' },
  { label: '荧光光谱仪', value: '139' },
  { label: '紫外分光光度计', value: '140' },
  { label: '旋光仪', value: '141' },
  { label: '自动过柱机CombiFlash1（通风橱内）', value: '142' },
  { label: '自动过柱机CombiFlash 2（桌面通风罩内）', value: '143' },
  { label: '微波合成仪Monowave 450', value: '144' },
  { label: '流式细胞分析仪（Agilent Novocyte Advanteon）-2', value: '146' },
  { label: '低温超高压细胞破碎仪（JN-MiniPro）3', value: '147' },
  { label: '化学发光成像系统（6200Touch）', value: '148' },
  { label: '制备超临界流体色谱SFC-150 AP', value: '156' },
  { label: '超声波破碎仪（S220）', value: '158' },
  { label: '单细胞多组学分析系统', value: '159' },
  { label: '落地式高速离心机（Sorvall LYNX6000）1', value: '160' },
  { label: '落地式高速离心机（Sorvall LYNX6000）2', value: '161' },
  { label: '超速离心机（Sorvall WX100+） 1', value: '162' },
  { label: '超速离心机（Sorvall WX100+） 2', value: '163' },
  { label: '工作站-倒置高通量活细胞光片显微成像系统', value: '165' },
  { label: 'PE高内涵数据处理工作站', value: '166' },
  { label: '莱迪园区（Olympus FV3000）激光共聚焦显微镜', value: '167' },
  { label: '高通量自动化微量加样工作站（Beckman Biomek4000）', value: '169' },
  { label: '蛋白纯化液相色谱（多波长 AKTA Pure）', value: '173' },
  { label: '落地式高速冷冻离心机 (Avanti J-E) 4', value: '174' },
  { label: '全能型成像分析系统 （FluorChem E）', value: '175' },
  { label: '飞纳场发射扫描电镜', value: '177' },
  { label: '蛋白纯化液相色谱（单波长 AKTA Pure）', value: '178' },
  { label: '离子淌度高分辨率液质联用仪（timsTOF Pro）', value: '179' },
  { label: 'vitrobot 冷冻制样机', value: '181' },
  { label: 'Nanopore三代测序仪（Oxford Nanopore，GridION MK1）', value: '182' },
  { label: '碳/金属溅射发射仪EMS', value: '183' },
  { label: '单细胞建库测序制备系统', value: '184' },
  { label: '正置多通道膜片钳系统（Axon，MultiClamp 700B）', value: '187' },
  { label: '莱迪118门禁', value: '188' },
  { label: '质谱引导的自动纯化仪AutoP （408）', value: '189' },
  { label: '莱迪入口门禁', value: '190' },
  { label: '等温滴定微量热仪（生物岛）', value: '191' },
  { label: '莱迪一楼纯水仪', value: '192' },
  { label: '健康院F栋1楼入口门禁', value: '193' },
  { label: '分子相互作用仪 Biacore 8K+', value: '194' },
  { label: '健康院F栋127门禁', value: '195' },
  { label: '核酸蛋白测定仪 （D30）', value: '196' },
  { label: '多层生化培养系统 （Multiron Standard）', value: '197' },
  { label: '300 kV冷冻透射电镜 （健康院）Titan Krios G4', value: '198' },
  { label: '标四B栋2006门禁', value: '200' },
  { label: '动物中心1楼灭菌间', value: '203' },
  { label: '标四B栋1008门禁', value: '204' },
  { label: '分选型流式细胞仪（BD FACSAria III）', value: '205' },
  { label: '冷冻真空离心浓缩仪 （CV600）', value: '206' },
  { label: '激光拉针仪（P-2000/F）', value: '207' },
  { label: '高速冷冻台式离心机（5810R）', value: '208' },
  { label: '冻干机 （LYOQUEST-85）', value: '209' },
  { label: 'P2生物安全柜左（1）', value: '210' },
  { label: 'P2生物安全柜右（2）', value: '211' },
  { label: 'D4008(BSL-2)', value: '212' },
  { label: '高通量实时荧光定量PCR仪（CFX384）-2', value: '213' },
  { label: '智能细胞制备系统（华仪宁创 Cell+100）', value: '214' },
  { label: '细胞三维牵张拉伸加载培养与分析系统（FLEXCELL FX-6000TFL）', value: '215' },
  { label: '多层培养箱 （BioStream B7）', value: '216' },
  { label: '冰冻切片机/冰冻切片', value: '217' },
  { label: '全自动组织脱水机/脱水服务', value: '218' },
  { label: '细胞能量代谢仪（Seahorse XFe24）', value: '219' },
  { label: '全自动器皿清洗机-1', value: '220' },
  { label: '全自动器皿清洗机-2', value: '221' },
  { label: '纳米粒度及Zeta电位分析仪', value: '223' },
  { label: '流变仪', value: '224' },
  { label: '全自动轮转式切片机/切片服务', value: '225' },
  { label: '数字病理扫描系统/白光扫描，病理评分，病理描述，诊断', value: '226' },
  { label: '小动物MICRO-CT', value: '227' },
  { label: '小动物高分辨率光学相干断层扫描仪（MICRO-OCT）', value: '228' },
  { label: '全自动染色封片工作站/HE染色', value: '229' },
  { label: '组织包埋机/包埋服务', value: '230' },
  { label: '烘片机', value: '231' },
  { label: '摊片机', value: '232' },
  { label: '麻醉机', value: '233' },
  { label: '麻醉呼吸机', value: '234' },
  { label: '微纳流控子平台临时门禁', value: '235' },
  { label: '纳米颗粒跟踪分析仪', value: '236' },
  { label: '实时荧光定量PCR仪（QuantStudio Dx）-1（96孔）', value: '237' },
  { label: '实时荧光定量PCR仪（Thermo Q 3）(生物岛)', value: '238' },
  { label: '多功能酶标仪（SpectraMax® Paradigm）', value: '239' },
  { label: '多功能激光扫描成像系统', value: '242' },
  { label: '超高参数全光谱流式细胞分析仪（SONY ID7000）', value: '243' },
  { label: '生物分子相互作用分析系统（Octet R8）', value: '244' },
  { label: '蛋白结晶自动化工作站', value: '245' },
  { label: '多功能微孔板检测仪（Agilent SH 1MF）', value: '246' },
  { label: '分析型超速离心机（AUC）', value: '247' },
  { label: '全自动单细胞分选仪（cellenone）', value: '248' },
  { label: '十万级天平', value: '249' },
  { label: '流式分析软件工作站', value: '250' },
  { label: '静电场轨道阱超高分辨率液质联用仪 (Orbitrap Exploris 480)', value: '251' },
  { label: 'PCR仪（BioRad，T100）', value: '252' },
  { label: '台式超速离心机（Optima MAX-XP）', value: '253' },
  { label: '高通量测序仪（华大智造，MGISEQ-2000）-A槽', value: '254' },
  { label: '高通量测序仪（赛陆医疗，Salus Pro）-A 槽', value: '255' },
  { label: '正置电生理及成像系统（HEAK，EPC-10）', value: '256' },
  { label: '倒置电生理及成像系统（HEAK，EPC-10）', value: '257' },
  { label: '抛光仪（Narishige，MF-2）（膜片钳系统配套）', value: '258' },
  { label: '高准确度单分子测序系统（PacBio，Sequel IIe）', value: '260' },
  { label: '热重分析仪', value: '261' },
  { label: '拉制仪（Sutter，P97）', value: '262' },
  { label: '高通量测序仪（赛陆医疗，Salus Pro）-B槽', value: '264' },
  { label: '小鼠胚胎净化服务预约', value: '265' },
  { label: '小鼠精子复苏服务预约', value: '266' },
  { label: '小鼠胚胎复苏服务预约', value: '267' },
  { label: '小鼠精子冷冻保种服务预约', value: '268' },
  { label: '小鼠胚胎冷冻保种服务预约', value: '269' },
  { label: '高通量实时荧光检测分析系统(FLIPR Penta)', value: '270' },
  { label: '实验操作技术服务', value: '271' },
  { label: '小动物肺功能检测系统（PFT）', value: '272' },
  { label: '小动物全身体积描记检测系统（WBP）', value: '273' },
  { label: '小动物气道阻力与肺顺应性检测系统（RC）', value: '274' },
  { label: '1018生物安全柜', value: '275' },
  { label: '安乐死室生物安全柜与生物超净台', value: '276' },
  { label: '高通量核酸分析仪', value: '285' },
  { label: '国产接触式光刻机', value: '286' },
  { label: '面投影3D打印机', value: '287' },
  { label: '双光子3D打印机', value: '288' },
  { label: '多层生化培养系统 （Multiron Standard）-2', value: '289' },
  { label: 'Exer 3/6小鼠跑步机', value: '290' },
  { label: '小动物活体成像', value: '291' },
  { label: '角分辨光谱测量系统', value: '292' },
  { label: '在体多通道记录系统', value: '293' },
  { label: '封膜仪（Biorad，PX1）', value: '294' },
  { label: '核酸药物分析系统（5200）', value: '295' },
  { label: '高通量蛋白晶体自动观察系统（RI1000）', value: '296' },
  { label: '超纯水仪', value: '297' },
  { label: '洗板机', value: '298' },
  { label: '生化培养箱', value: '299' },
  { label: '分选型流式细胞仪（SONY LE-MA900FP）-靠窗', value: '300' },
  { label: '冰冻切片机-3', value: '301' },
  { label: '（EVIDENT VS 200）全自动玻片扫描系统', value: '303' },
  { label: '高压冷冻仪（Leica EM ICE）', value: '315' },
  { label: '高压冷冻仪（WOHLWEND HPF COMPACT 03）', value: '316' },
  { label: '冷冻替代仪1（Leica EM ASF2）', value: '317' },
  { label: '冷冻替代仪2（Leica EM ASF2）', value: '318' },
  { label: '超薄切片机（Leica EM UC7）', value: '319' },
  { label: '冷冻超薄切片机（Leica EM UC7FC7）', value: '320' },
  { label: '冷冻超薄切片机（Boeckeler PTXL/LN）', value: '321' },
  { label: '高通量测序仪（真迈生物，SURFSeq 5000）-A槽', value: '322' },
  { label: '高通量测序仪（真迈生物，SURFSeq 5000）-B槽', value: '323' },
  { label: '高真空离子溅射镀膜机（Quorum Q150R S Plus）', value: '324' },
  { label: '场发射扫描电子显微镜（ZEISS GeminiSEM 500）', value: '325' },
  { label: '三重四极杆-线性离子阱液质联用仪', value: '326' },
  { label: 'X射线单晶衍射仪', value: '327' },
  { label: 'Waters Connect软件工作站-配套高分辨质谱（QTof）使用', value: '330' },
  { label: '生物岛园区（Olympus FV3000）激光共聚焦显微镜', value: '331' },
  { label: 'LiTone XL 大样本激光片层扫描显微镜', value: '332' },
  { label: 'Livecyte2 实时细胞功能及单细胞行为分析系统', value: '333' },
  { label: '纳米流式分析仪（Apogee Micro Plus）', value: '334' },
  { label: '微量分馏系统', value: '335' },
  { label: '非对称轨道无损超高分辨率液质联用仪（Orbitrap Astral）', value: '336' },
  { label: '高通量测序仪（DNBSEQ-T7）', value: '337' },
  { label: '自动化样本制备系统（MGISP-960）', value: '338' },
  { label: '120kV透射电镜-1', value: '339' },
  { label: '细胞计数仪', value: '341' },
  { label: 'MExplorer Ultimate 代谢组学分析软件', value: '343' },
  { label: '点胶机', value: '344' },
  { label: '进口接触式光刻机', value: '345' },
  { label: '准分子激光', value: '346' },
  { label: 'IBE刻蚀机', value: '347' },
  { label: 'Parylene沉积', value: '348' },
  { label: '微流控芯片实验系统', value: '349' },
  { label: '三维流场测试仪', value: '350' },
  { label: '椭偏仪', value: '351' },
  { label: '台阶仪', value: '352' },
  { label: '形状测量激光显微系统', value: '353' },
  { label: '酸腐蚀槽', value: '354' },
  { label: '碱腐蚀槽', value: '355' },
  { label: '冷冻双束扫描电镜（Aquilos2）', value: '356' },
  { label: '热压成型机', value: '357' },
  { label: '热压键合机', value: '358' },
  { label: '120kV透射电镜-2(带冷冻杆)', value: '359' },
  { label: '小动物肺功能检测系统（PFT）D1020', value: '360' },
  { label: '三重四极杆电感耦合等离子体质谱仪', value: '361' },
  { label: '水等离子体处理机', value: '362' },
  { label: '扫描电化学显微镜', value: '364' },
  { label: '多动能微电子打印机', value: '365' },
  { label: '表面处理通风橱', value: '366' },
  { label: '分子相互作用分析系统（极瞳生命）', value: '368' },
  { label: '显微镜', value: '369' },
  { label: '体视荧光显微镜', value: '371' },
  { label: '实时荧光定量PCR仪（Thermo Q 3）(生物岛)', value: '373' },
  { label: '电镜中心液氮罐', value: '374' }
])

// 计算选择的仪器名称
const selectedEquipmentName = computed(() => {
  if (!queryForm.equipmentId) return ''
  const equipment = equipmentOptions.value.find(item => item.value === queryForm.equipmentId)
  return equipment ? equipment.label : '未知仪器'
})

// 搜索过滤仪器选项
const filterEquipmentOptions = () => {
  if (!equipmentSearchKeyword.value) {
    filteredEquipmentOptions.value = []
    showEquipmentDropdown.value = false
    return
  }
  
  const keyword = equipmentSearchKeyword.value.toLowerCase()
  filteredEquipmentOptions.value = equipmentOptions.value.filter(option => 
    option.label.toLowerCase().includes(keyword) || 
    option.value.toString().includes(keyword)
  )
  showEquipmentDropdown.value = filteredEquipmentOptions.value.length > 0
  
  // 计算下拉框位置
  nextTick(() => {
    updateDropdownPosition()
  })
}

// 更新下拉框位置
const updateDropdownPosition = () => {
  if (!equipmentSearchInput.value) return
  
  const inputEl = equipmentSearchInput.value.$el
  const rect = inputEl.getBoundingClientRect()
  
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    zIndex: 999999
  }
}

// 隐藏下拉框
const hideDropdown = () => {
  setTimeout(() => {
    showEquipmentDropdown.value = false
  }, 200)
}

// 选择仪器
const selectEquipment = (equipment) => {
  queryForm.equipmentId = equipment.value
  equipmentSearchKeyword.value = equipment.label
  showEquipmentDropdown.value = false
  // 清除下拉框样式
  dropdownStyle.value = {}
}

// 仪器搜索输入框获得焦点时显示下拉框
const handleEquipmentSearchFocus = () => {
  if (equipmentSearchKeyword.value) {
    filterEquipmentOptions()
  }
  // 更新位置
  nextTick(() => {
    updateDropdownPosition()
  })
}

// 计算基本使用统计数据 - 重新设计，每种统计类型单独成行
const basicStatsData = computed(() => {
  if (!basicData.value) return []
  
  return [
    {
      category: '总用户数',
      total: basicData.value.tUser || 0,
      internal: basicData.value.iUser || 0,
      external: basicData.value.oUser || 0,
      unit: '人',
      remark: ''
    },
    {
      category: '培训用户数',
      total: basicData.value.trainUser || 0,
      internal: '-',
      external: '-',
      unit: '人',
      remark: ''
    },
    {
      category: '总使用时长',
      total: basicData.value.tTime || 0,
      internal: basicData.value.iTime || 0,
      external: basicData.value.oTime || 0,
      unit: '小时',
      remark: '使用率: ' + (basicData.value.usage || 0) + '%'
    },
    {
      category: '总卡次数',
      total: basicData.value.tCard || 0,
      internal: basicData.value.iCard || 0,
      external: basicData.value.oCard || 0,
      unit: '次',
      remark: ''
    },
    {
      category: '培训次数',
      total: basicData.value.train || 0,
      internal: '-',
      external: '-',
      unit: '次',
      remark: '培训通过率: ' + (basicData.value.trainPass || 0) + '%'
    },
    {
      category: '样品数量',
      total: basicData.value.sample || 0,
      internal: '-',
      external: '-',
      unit: '个',
      remark: ''
    },
    {
      category: '材料费用',
      total: basicData.value.materials || 0,
      internal: '-',
      external: '-',
      unit: '元',
      remark: ''
    },
    {
      category: '培训信息',
      total: basicData.value.trainInfo || 0,
      internal: '-',
      external: '-',
      unit: '',
      remark: ''
    }
  ]
})

// 计算使用统计数据
const usageStatsData = computed(() => {
  if (!usageStats.value) return []
  
  const stats = usageStats.value
  return [
    {
      item: '总记录数',
      value: formatNumber(stats.totalRecords) + ' 条',
      unit: '条',
      description: '总的使用记录数量'
    },
    {
      item: '总费用',
      value: formatCurrency(stats.totalCost) + ' 元',
      unit: '元',
      description: '所有使用记录的总费用'
    },
    {
      item: '测试费用',
      value: formatCurrency(stats.totalTestCost) + ' 元',
      unit: '元',
      description: '测试相关的总费用'
    },
    {
      item: '材料费用',
      value: formatCurrency(stats.totalMaterialsCost) + ' 元',
      unit: '元',
      description: '材料相关的总费用'
    },
    {
      item: '平均费用',
      value: stats.totalRecords > 0 ? formatCurrency(stats.totalCost / stats.totalRecords) + ' 元' : '0 元',
      unit: '元',
      description: '每条记录的平均费用'
    },
    {
      item: '平均测试费用',
      value: stats.totalRecords > 0 ? formatCurrency(stats.totalTestCost / stats.totalRecords) + ' 元' : '0 元',
      unit: '元',
      description: '每条记录的平均测试费用'
    }
  ]
})

// 查询类型变化处理
const handleQueryTypeChange = () => {
  // 不自动查询，需要用户手动点击查询按钮
}

// 仪器选择变化处理
const handleEquipmentChange = () => {
  // 不自动查询，需要用户手动点击查询按钮
}

// 查询仪器基本信息
const handleQuery = async () => {
  if (!queryForm.equipmentId) {
    ElMessage.warning('请选择仪器')
    return
  }

  if (queryForm.queryType === 1) {
    if (!queryForm.startDate || !queryForm.endDate) {
      ElMessage.warning('请选择开始日期和结束日期')
      return
    }
    if (queryForm.startDate > queryForm.endDate) {
      ElMessage.warning('开始日期不能大于结束日期')
      return
    }
  }

  basicLoading.value = true
  try {
    const params = {
      id: queryForm.equipmentId,
      type: queryForm.queryType
    }
    
    if (queryForm.queryType === 1) {
      params.beginDate = queryForm.startDate
      params.endDate = queryForm.endDate
    }

    const response = await getEqData(params)
    if (response.code === '00000') {
      basicData.value = response.data
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(response.msg || '查询失败')
    }
  } catch (error) {
    console.error('查询仪器数据失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  } finally {
    basicLoading.value = false
  }
}

// 重置查询条件
const handleReset = () => {
  queryForm.queryType = 0
  queryForm.equipmentId = ''
  queryForm.startDate = ''
  queryForm.endDate = ''
  equipmentSearchKeyword.value = ''
  basicData.value = null
  usageData.value = []
  filteredUsageData.value = []
  usageStats.value = null
  showEquipmentDropdown.value = false
  filteredEquipmentOptions.value = []
  dropdownStyle.value = {}
}

// 显示使用信息弹窗
const showUsageDialog = () => {
  if (!queryForm.equipmentId) {
    ElMessage.warning('请先选择仪器')
    return
  }
  usageDialogVisible.value = true
  // 初始化使用信息查询条件
  usageQueryForm.queryType = queryForm.queryType
  usageQueryForm.startDate = queryForm.startDate
  usageQueryForm.endDate = queryForm.endDate
  // 查询使用数据
  queryUsageData()
}

// 查询使用数据
const queryUsageData = async () => {
  if (!queryForm.equipmentId) return

  usageLoading.value = true
  try {
    const params = {
      id: queryForm.equipmentId,
      type: usageQueryForm.queryType
    }
    
    if (usageQueryForm.queryType === 1) {
      params.beginDate = usageQueryForm.startDate
      params.endDate = usageQueryForm.endDate
    }

    const response = await getBookingData(params)
    if (response.code === '00000') {
      // 使用实际API返回的数据
      if (response.data && Array.isArray(response.data)) {
        usageData.value = response.data
        filteredUsageData.value = response.data
        
        // 计算统计数据
        const totalCost = response.data.reduce((sum, item) => sum + (item.cost || 0), 0)
        const totalTestCost = response.data.reduce((sum, item) => sum + (item.testCost || 0), 0)
        const totalMaterialsCost = response.data.reduce((sum, item) => sum + (item.materialsCost || 0), 0)
        
        usageStats.value = {
          totalRecords: response.data.length,
          totalCost: totalCost,
          totalTestCost: totalTestCost,
          totalMaterialsCost: totalMaterialsCost
        }
      } else {
        usageData.value = []
        filteredUsageData.value = []
        usageStats.value = null
      }
      
      ElMessage.success(`成功获取 ${response.data.length} 条使用记录`)
    } else {
      ElMessage.error(response.msg || '查询使用数据失败')
    }
  } catch (error) {
    console.error('查询使用数据失败:', error)
    ElMessage.error('查询使用数据失败，请稍后重试')
  } finally {
    usageLoading.value = false
  }
}

// 搜索使用记录
const handleUsageSearch = () => {
  if (!usageSearchKeyword.value) {
    filteredUsageData.value = usageData.value
    return
  }
  
  const keyword = usageSearchKeyword.value.toLowerCase()
  filteredUsageData.value = usageData.value.filter(record => {
    return Object.values(record).some(value => 
      String(value).toLowerCase().includes(keyword)
    )
  })
}

// 查看培训详情
const viewTraining = (url) => {
  if (url) {
    // 移除URL中的反引号
    const cleanUrl = url.replace(/`/g, '')
    window.open(cleanUrl, '_blank')
  } else {
    ElMessage.info('暂无培训详情链接')
  }
}

// 查看摄像头
const viewCamera = (camera) => {
  ElMessage.info(`查看摄像头: ${camera.name}`)
  // 这里可以添加实际的摄像头查看逻辑
}

// 格式化数字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString()
}

// 格式化货币
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString()
}

// 使用记录表格列配置
const usageColumns = ref([
  { prop: 'name', label: '用户姓名', visible: true, minWidth: 100 },
  { prop: 'bookingTime', label: '预约时间', visible: true, minWidth: 180 },
  { prop: 'beginTime', label: '开始时间', visible: true, minWidth: 150 },
  { prop: 'endTime', label: '结束时间', visible: true, minWidth: 150 },
  { prop: 'type', label: '使用类型', visible: true, minWidth: 100 },
  { prop: 'status', label: '状态', visible: true, minWidth: 80 },
  { prop: 'testCost', label: '测试费用(元)', visible: true, minWidth: 120, formatter: formatCurrency },
  { prop: 'materialsCost', label: '材料费用(元)', visible: true, minWidth: 120, formatter: formatCurrency },
  { prop: 'cost', label: '总费用(元)', visible: true, minWidth: 120, formatter: formatCurrency }
])

// 计算可见列
const visibleUsageColumns = ref([])

// 列变化处理
const handleUsageColumnChange = () => {
  visibleUsageColumns.value = usageColumns.value.filter(column => column.visible)
}

// 组件挂载时初始化
onMounted(() => {
  // 初始化可见列
  visibleUsageColumns.value = usageColumns.value.filter(column => column.visible)
  
  // 初始化搜索相关状态
  filteredEquipmentOptions.value = []
  showEquipmentDropdown.value = false
  dropdownStyle.value = {}
  
  // 不自动选择仪器，需要用户手动选择
})
</script>

<style scoped>
.equipment-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.query-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.data-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.stats-section {
  margin-top: 20px;
}

.stats-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.tech-section {
  margin-top: 20px;
}

.tech-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.tech-content, .remark-content {
  margin-bottom: 15px;
}

.tech-content strong, .remark-content strong {
  color: #606266;
  display: block;
  margin-bottom: 8px;
}

.tech-content p, .remark-content p {
  color: #303133;
  line-height: 1.6;
  margin: 0;
}

.training-section {
  margin-top: 20px;
}

.training-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.training-card {
  margin-bottom: 15px;
}

.training-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.training-time {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.training-actions {
  text-align: right;
}

.alarm-section {
  margin-top: 20px;
}

.alarm-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.sensor-section, .camera-section {
  margin-top: 20px;
}

.sensor-section h4, .camera-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.manager-section {
  margin-top: 20px;
}

.manager-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.hint-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 使用信息弹窗样式 */
.usage-content {
  max-height: 70vh;
  overflow-y: auto;
}

.usage-query-card {
  margin-bottom: 20px;
}

.usage-query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.usage-table-card {
  margin-bottom: 20px;
}

.usage-chart-card {
  margin-bottom: 0;
}

.chart-stat {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.chart-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.chart-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 列设置样式 */
.column-settings {
  padding: 10px;
}

.column-settings .el-checkbox {
  display: block;
  margin-bottom: 8px;
  margin-right: 0;
}

.column-settings .el-checkbox:last-child {
  margin-bottom: 0;
}

/* 仪器标签样式 */
.el-tag {
  margin-left: 10px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .equipment-page {
    padding: 10px;
  }
  
  .query-form {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .usage-query-form {
    flex-direction: column;
  }
}

/* 仪器搜索下拉框样式 */
.equipment-search-container {
  position: relative;
  display: inline-block;
  z-index: 999999;
}

/* 确保搜索容器在最上层 */
.equipment-search-container {
  isolation: isolate;
}

.equipment-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 300px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 999999;
  margin-top: 4px;
  transform: translateZ(0); /* 强制硬件加速，避免层叠问题 */
  will-change: transform; /* 优化性能 */
}

/* teleport渲染的下拉框样式 */
.equipment-dropdown-teleported {
  position: fixed !important;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 999999;
  transform: translateZ(0);
  will-change: transform;
}

.equipment-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.equipment-dropdown-item:hover {
  background-color: #f5f7fa;
}

.equipment-dropdown-item:last-child {
  border-bottom: none;
}

.equipment-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
  line-height: 1.4;
}

.equipment-id {
  font-size: 12px;
  color: #909399;
}

.equipment-dropdown-empty {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>