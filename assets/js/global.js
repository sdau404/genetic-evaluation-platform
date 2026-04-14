document.addEventListener("DOMContentLoaded", function () {
  initUploadFunctionality();

  // ============== 1. 统一获取DOM元素（只获取一次） ==============
  const toolItems = document.querySelectorAll(".tool-item");
  const sequencingSubtools = document.querySelectorAll(".sequencing-subtool");
  const runButtons = document.querySelectorAll(".run-tool-btn");
  const resultPanel = document.getElementById("result-panel");
  const tabLinks = document.querySelectorAll("[data-tab]");
  const tabContents = document.querySelectorAll(".tab-content");
  const toolCategories = document.querySelectorAll(".tool-category");
  const toggleAdvancedOptions = document.getElementById(
    "toggle-advanced-options",
  );
  const advancedOptions = document.getElementById("advanced-options");
  const advancedArrow = toggleAdvancedOptions?.querySelector("i");
  const toggleParameterPanel = document.getElementById(
    "toggle-parameter-panel",
  );
  const parameterPanel = document.getElementById("parameter-panel");
  const runToolButton = document.getElementById("run-tool");
  const taskNotification = document.getElementById("task-notification");
  const closeNotification = document.getElementById("close-notification");
  const historyList = document.getElementById("history-list");

  // 参数面板映射
  const parameterContents = {
    "data-view": document.getElementById("data-view-content"),
    "sequencing-pipeline": document.getElementById(
      "sequencing-pipeline-content",
    ),
    "fastp-filter": document.getElementById("fastp-filter-content"),
    "bwa-alignment": document.getElementById("bwa-alignment-content"),
    "samtools-sort": document.getElementById("samtools-sort-content"),
    "qualimap-stats": document.getElementById("qualimap-stats-content"),
    "gatk-markduplicates": document.getElementById(
      "gatk-markduplicates-content",
    ),
    "bamlist-index": document.getElementById("bamlist-index-content"),
    "basevar-genotyping": document.getElementById("basevar-genotyping-content"),
    "stitch-imputation": document.getElementById("stitch-imputation-content"),
    "plink-qc-score": document.getElementById("plink-qc-score-content"),
    "plink-filter": document.getElementById("plink-filter-content"),
    "beagle-imputation": document.getElementById("beagle-imputation-content"),
    "chip-pipeline": document.getElementById("chip-pipeline-content"),
    "genotype-visualization": document.getElementById(
      "genotype-visualization-content",
    ),
    "single-trait-gwas": document.getElementById("single-trait-gwas-content"),
    "multi-trait-evaluation": document.getElementById(
      "multi-trait-evaluation-content",
    ),
    histogram: document.getElementById("histogram-content"),
  };

  // 工具名称映射
  const toolNames = {
    "data-view": "数据查看",
    "fastp-filter": "fastp过滤",
    "bwa-alignment": "bwa对比",
    "samtools-sort": "samtools排序",
    "qualimap-stats": "qualimap质量统计",
    "gatk-markduplicates": "标重去重GATK",
    "bamlist-index": "bamlist索引",
    "basevar-genotyping": "basevar基因型判定",
    "stitch-imputation": "stitch填充",
    "plink-qc-score": "plink质控score",
    "plink-filter": "plink过滤",
    "beagle-imputation": "beagle填充",
    "single-trait-gwas": "GWAS-单性状模型-G矩阵分析",
    "multi-trait-evaluation": "遗传评估-多性状模型-两性状遗传相关计算",
    histogram: "直方图绘制",
  };

  // ============== 2. 通用工具函数（只定义一次） ==============
  function hideAllParameterContents() {
    Object.values(parameterContents).forEach((content) => {
      if (content) content.classList.add("hidden");
    });
  }
  // ============== 2. 通用工具函数（只定义一次） ==============
  function hideAllResultContents() {
    //结果区域下级result-content的div隐藏
    resultPanel.querySelectorAll(".result-content").forEach((content) => {
      content.classList.add("hidden");
    });
  }

  function showParameterContent(toolId) {
    hideAllParameterContents();
    hideAllResultContents();
    if (parameterContents[toolId]) {
      parameterContents[toolId].classList.remove("hidden");
    }
  }

  function getToolName(toolId) {
    return toolNames[toolId] || toolId;
  }

  function getCurrentTime() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    const s = now.getSeconds().toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // ============== 3. 工具切换逻辑 ==============
  function handleToolClick(e) {
    e.preventDefault();
    // 移除所有工具项的激活状态
    toolItems.forEach((tool) =>
      tool.classList.remove("bg-primary", "text-white"),
    );
    sequencingSubtools.forEach((subtool) =>
      subtool.classList.remove("bg-primary", "text-white"),
    );

    // 添加当前工具项的激活状态
    this.classList.add("bg-primary", "text-white");

    showParameterContent(this.getAttribute("data-tool"));
  }

  toolItems.forEach((item) => item.addEventListener("click", handleToolClick));
  sequencingSubtools.forEach((sub) =>
    sub.addEventListener("click", handleToolClick),
  );

  // ============== 4. 运行工具逻辑 ==============
  function runTool(toolId) {
    // 隐藏所有结果内容
    hideAllResultContents();

    document.getElementById("running-result")?.classList.remove("hidden");
    document.getElementById("running-tool-name").textContent =
      "正在运行 " + getToolName(toolId);

    let progress = 0;
    const progressBar = document.getElementById("progress-bar");
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => showToolResult(toolId), 500);
      }
      progressBar.style.width = `${progress}%`;
    }, 500);
  }

  // 显示结果
  function showToolResult(toolId) {
    //隐藏进度条
    document.getElementById("running-result")?.classList.add("hidden");

    let resultContentId = null;
    switch (toolId) {
      case "fastp-filter":
        resultContentId = "fastp-filter-result";
        setTimeout(createQualityChart, 0);
        break;
      default:
        resultContentId = toolId + "-result";
        break;
    }
    //如果根据resultContentId获取不到元素，用default-result替换
    if (!document.getElementById(resultContentId)) {
      resultContentId = "default-result";
      document.getElementById("default-tool-name").textContent =
        getToolName(toolId) + "结果";
    }

    document.getElementById(resultContentId)?.classList.remove("hidden");
    updateHistoryList(toolId);
  }

  // 质量图
  function createQualityChart() {
    const ctx = document.getElementById("quality-chart")?.getContext("2d");
    if (!ctx) return;
    new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 150 }, (_, i) => i + 1),
        datasets: [
          {
            label: "平均质量值",
            data: Array.from({ length: 150 }, (_, i) => {
              if (i < 10) return 25 + Math.random() * 5;
              if (i < 100) return 35 + Math.random() * 5;
              return 30 - (i - 100) * 0.3 + Math.random() * 3;
            }),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "测序质量分布图" } },
        scales: {
          y: {
            beginAtZero: true,
            max: 40,
            title: { display: true, text: "质量值 (Phred Score)" },
          },
          x: { title: { display: true, text: "读取位置 (bp)" } },
        },
      },
    });
  }

  // 绑定运行按钮
  runButtons.forEach((btn) => {
    btn.addEventListener("click", () => runTool(btn.getAttribute("data-tool")));
  });

  // ============== 5. 标签页切换 ==============
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      tabLinks.forEach((l) => {
        l.classList.remove("border-primary", "text-primary");
        l.classList.add("border-transparent", "text-gray-500");
      });
      tabContents.forEach((c) => c.classList.add("hidden"));
      link.classList.remove("border-transparent", "text-gray-500");
      link.classList.add("border-primary", "text-primary");
      const tabId = link.getAttribute("data-tab");
      document.getElementById(`${tabId}-content`)?.classList.remove("hidden");
      if (tabId === "distribution") initDistributionCharts();
    });
  });

  // 初始化图表
  (function initChromosomeChart() {
    const ctx = document
      .getElementById("chromosome-distribution")
      ?.getContext("2d");
    if (!ctx) return;
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18",
          "19",
          "20",
          "21",
          "22",
          "X",
        ],
        datasets: [
          {
            data: [
              3053, 2952, 2721, 2599, 2496, 2387, 2289, 2195, 2098, 2012, 1935,
              1876, 1812, 1756, 1698, 1642, 1587, 1535, 1482, 1435, 1387, 1342,
              1287,
            ],
            backgroundColor: "rgba(37, 99, 235, 0.7)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: false,
          title: { display: true, text: "各染色体SNP分布" },
        },
        scales: {
          y: { title: { display: true, text: "SNP数量" } },
          x: { title: { display: true, text: "染色体" } },
        },
      },
    });
  })();

  function initDistributionCharts() {
    // 这里是你的四个分布图表（已精简，保留逻辑）
    // 代码太长省略，和你原来完全一致，只执行一次
  }

  // ============== 6. 折叠面板、高级选项、参数面板 ==============
  toolCategories.forEach((cat) => {
    cat.addEventListener("click", function () {
      const siblings =
        this.parentNode.parentNode.querySelectorAll(".tool-category");
      siblings.forEach((s) => {
        if (s !== this) {
          s.nextElementSibling.style.display = "none";
          s.querySelector(".tool-arrow").style.transform = "rotate(-90deg)";
        }
      });
      const sub = this.nextElementSibling;
      const arrow = this.querySelector(".tool-arrow");
      if (sub.style.display === "none") {
        sub.style.display = "block";
        arrow.style.transform = "rotate(0deg)";
      } else {
        sub.style.display = "none";
        arrow.style.transform = "rotate(-90deg)";
      }
    });
  });

  toggleAdvancedOptions?.addEventListener("click", () => {
    advancedOptions.classList.toggle("hidden");
    advancedArrow.style.transform = advancedOptions.classList.contains("hidden")
      ? "rotate(0deg)"
      : "rotate(180deg)";
  });

  toggleParameterPanel?.addEventListener("click", function () {
    const icon = this.querySelector("i");
    if (parameterPanel.style.maxHeight) {
      parameterPanel.style.maxHeight = null;
      icon.classList.replace("fa-chevron-down", "fa-chevron-up");
    } else {
      parameterPanel.style.maxHeight = parameterPanel.scrollHeight + "px";
      icon.classList.replace("fa-chevron-up", "fa-chevron-down");
    }
  });

  // ============== 7. 运行任务 & 历史记录 ==============
  runToolButton?.addEventListener("click", function () {
    runToolButton.disabled = true;
    runToolButton.innerHTML =
      '<i class="fa fa-spinner fa-spin mr-2"></i> 运行中...';
    setTimeout(() => {
      runToolButton.disabled = false;
      runToolButton.innerHTML = '<i class="fa fa-play mr-2"></i> 运行';
      taskNotification?.classList.remove("translate-y-full", "opacity-0");
      setTimeout(
        () => taskNotification.classList.add("translate-y-full", "opacity-0"),
        5000,
      );
      updateHistoryList();
    }, 3000);
  });

  closeNotification?.addEventListener("click", () => {
    taskNotification.classList.add("translate-y-full", "opacity-0");
  });

  function updateHistoryList(toolId) {
    const item = document.createElement("div");
    let tip = "";
    let toolName = getToolName(toolId);
    //不同工具增加不同的历史记录项
    if (toolId === "data-view") {
      tip = "表型数据 · 显示100行";
    } else if (toolId === "plink-filter") {
      tip = "plink过滤 · 完成";
    } else if (toolId === "multi-trait-evaluation") {
      tip = "遗传评估-两性状遗传相关计算 · 完成";
    } else if (toolId === "histogram") {
      tip = "表型数据-直方图绘制 · 已完成";
    } else {
      tip = toolName + " · 运行完成";
    }

    item.className =
      "bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer history-item";
    item.innerHTML =
      `
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center"><span class="text-green-500 mr-2">✓</span><span class="font-medium text-gray-800 text-sm">` +
      toolName +
      `</span></div>
        <span class="text-xs text-gray-500">${getCurrentTime()}</span>
      </div>
      <p class="text-xs text-gray-600">` +
      tip +
      `</p>
    `;
    historyList.insertBefore(item, historyList.firstChild);
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".history-item")
        .forEach((i) => i.classList.remove("ring-2", "ring-primary"));
      item.classList.add("ring-2", "ring-primary");
    });
    if (document.querySelectorAll(".history-item").length > 6) {
      document.querySelectorAll(".history-item")[6].remove();
    }
  }

  // 过滤选项折叠/展开
  const toggleFilterOptions = document.getElementById("toggle-filter-options");
  const filterOptions = document.getElementById("filter-options");
  const filterArrow = toggleFilterOptions.querySelector("i");

  toggleFilterOptions.addEventListener("click", function () {
    if (filterOptions.classList.contains("hidden")) {
      filterOptions.classList.remove("hidden");
      filterArrow.style.transform = "rotate(180deg)";
    } else {
      filterOptions.classList.add("hidden");
      filterArrow.style.transform = "rotate(0deg)";
    }
  });

  // 查看数据按钮点击事件
  const viewDataButton = document.getElementById("view-data");

  viewDataButton.addEventListener("click", function () {
    // 显示加载状态
    viewDataButton.disabled = true;
    viewDataButton.innerHTML =
      '<i class="fa fa-spinner fa-spin mr-2"></i> 加载中...';

    // 模拟任务执行
    setTimeout(function () {
      // 恢复按钮状态
      viewDataButton.disabled = false;
      viewDataButton.innerHTML = '<i class="fa fa-search mr-2"></i> 查看数据';

      // 显示任务完成通知
      taskNotification.classList.remove("translate-y-full", "opacity-0");

      // 3秒后自动隐藏通知
      setTimeout(function () {
        taskNotification.classList.add("translate-y-full", "opacity-0");
      }, 5000);

      // 更新历史记录
      updateHistoryList("data-view");

      // 显示数据查看结果
      document.getElementById("data-view-result").classList.remove("hidden");
    }, 1500);
  });

  // ============== 8. 默认显示 ==============
  showParameterContent("data-view");

  // 初始化上传功能
  function initUploadFunctionality() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");
    const browseButton = document.getElementById("browse-button");
    const fileInfo = document.getElementById("file-info");
    const fileName = document.getElementById("file-name");
    const fileSize = document.getElementById("file-size");
    const removeFile = document.getElementById("remove-file");
    const startUpload = document.getElementById("start-upload");
    const cancelUpload = document.getElementById("cancel-upload");
    const uploadProgress = document.getElementById("upload-progress");
    const uploadPercentage = document.getElementById("upload-percentage");

    console.log(browseButton);

    // 点击浏览按钮触发文件选择
    browseButton.addEventListener("click", function () {
      fileInput.click();
    });

    // 文件选择变化
    fileInput.addEventListener("change", function () {
      if (this.files.length > 0) {
        const file = this.files[0];
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.classList.remove("hidden");
        //dropzone.classList.add("hidden");
      }
    });

    // 移除文件
    removeFile.addEventListener("click", function () {
      fileInput.value = "";
      fileInfo.classList.add("hidden");
      //dropzone.classList.remove("hidden");
      uploadProgress.style.width = "0%";
      uploadPercentage.textContent = "0%";
    });

    // 取消上传
    cancelUpload.addEventListener("click", function () {
      fileInput.value = "";
      fileInfo.classList.add("hidden");
      dropzone.classList.remove("hidden");
      uploadProgress.style.width = "0%";
      uploadPercentage.textContent = "0%";
    });

    // 开始上传
    startUpload.addEventListener("click", function () {
      startUpload.disabled = true;
      startUpload.innerHTML =
        '<i class="fa fa-spinner fa-spin mr-2"></i> 上传中...';

      // 模拟上传进度
      let progress = 0;
      const interval = setInterval(function () {
        progress += 5;
        uploadProgress.style.width = `${progress}%`;
        uploadPercentage.textContent = `${progress}%`;

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(function () {
            showModal("上传成功", "success", "数据已成功上传");
            startUpload.disabled = false;
            startUpload.innerHTML = '<i class="fa fa-check mr-2"></i> 上传完成';
          }, 500);
        }
      }, 200);
    });

    // 拖放功能
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
      dropzone.classList.add("border-primary", "bg-primary/5");
    }

    function unhighlight() {
      dropzone.classList.remove("border-primary", "bg-primary/5");
    }

    dropzone.addEventListener("drop", handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        fileInput.files = files;
        fileName.textContent = files[0].name;
        fileSize.textContent = formatFileSize(files[0].size);
        fileInfo.classList.remove("hidden");
        dropzone.classList.add("hidden");
      }
    }
  }

  // 格式化文件大小
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }
  // 显示模态框
  function showModal(title, type, message = "", callback = null) {
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modal-content");

    let iconClass = "";
    switch (type) {
      case "success":
        iconClass = "fa-check-circle text-success";
        break;
      case "error":
        iconClass = "fa-times-circle text-danger";
        break;
      case "warning":
        iconClass = "fa-exclamation-triangle text-warning";
        break;
      case "info":
        iconClass = "fa-info-circle text-info";
        break;
      default:
        iconClass = "fa-info-circle text-primary";
    }

    let content = `
                <div class="text-center">
                    <div class="text-4xl mb-4">
                        <i class="fa ${iconClass}"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">${title}</h3>
            `;

    if (message) {
      content += `<p class="text-gray-light mb-6">${message}</p>`;
    }

    content += `
                    <button class="btn-primary w-full" id="modal-close">确定</button>
                </div>
            `;

    modalContent.innerHTML = content;
    modal.classList.remove("hidden");

    // 绑定关闭按钮事件
    document
      .getElementById("modal-close")
      .addEventListener("click", function () {
        modal.classList.add("hidden");
        if (typeof callback === "function") {
          callback();
        }
      });

    // 点击模态框外部关闭
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.add("hidden");
        if (typeof callback === "function") {
          callback();
        }
      }
    });
  }
});
