document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const visitList = document.getElementById('visitList');
  const daysLimitInput = document.getElementById('daysLimit');
  const saveButton = document.getElementById('save');
  const searchInput = document.getElementById('search');

  // 显示指定日期的访问数据
  function showVisitData(date, searchTerm = '') {
    chrome.storage.local.get('visitData', (data) => {
      const visitData = data.visitData || {};
      const dailyData = visitData[date] || {};
      visitList.innerHTML = '';

      // 将数据转换为数组并进行排序
      const sortedData = Object.entries(dailyData)
        .map(([domain, { count, favicon }]) => ({
          domain,
          count,
          favicon,
        }))
        .sort((a, b) => b.count - a.count); // 按照次数降序排序

      // 显示访问次数和 favicon，过滤符合搜索条件的项
      const filteredData = sortedData.filter((item) =>
        item.domain.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filteredData.forEach(({ domain, count, favicon }) => {
        const listItem = document.createElement('li');
        const link = document.createElement('a'); // 创建链接
        link.href = formatURL(domain); // 使用格式化函数设置链接地址
        link.target = '_blank'; // 在新标签页中打开链接
        link.style.display = 'flex'; // 使链接内容能够在一行内显示
        link.style.textDecoration = 'none'; // Remove underline
        link.style.color = 'inherit'; // Use the parent's color

        const iconImg = document.createElement('img');
        iconImg.src = favicon
          ? favicon
          : chrome.runtime.getURL('default_icon.png'); // 如果没有 favicon 则使用默认图标
        iconImg.width = 16;
        iconImg.height = 16;
        iconImg.style.marginRight = '8px';
        iconImg.onerror = () => {
          iconImg.src = chrome.runtime.getURL('default_icon.png'); // 默认图标的路径
        };

        const text = document.createTextNode(
          `${domain}: ${count} ${chrome.i18n.getMessage('visits')}`
        ); // 添加国际化的访问次数文本

        link.appendChild(iconImg);
        link.appendChild(text);
        listItem.appendChild(link);
        visitList.appendChild(listItem);
      });
    });
  }

  // 格式化 URL，确保有正确的前缀
  function formatURL(domain) {
    if (!domain) return '#'; // 返回一个空链接以防止错误
    // 添加 http:// 或 https:// 前缀
    if (!/^https?:\/\//i.test(domain)) {
      return `http://${domain}`; // 默认使用 http
    }
    return domain; // 如果已经有前缀则返回原始域名
  }

  // 加载并显示当前最大存储天数设置
  function loadSettings() {
    chrome.storage.local.get('daysLimit', (data) => {
      const daysLimit = data.daysLimit || 7;
      daysLimitInput.value = daysLimit;

      // 清理超出时间的数据
      cleanupOldVisitData(daysLimit);
    });
  }

  // 清理超出时间的数据
  function cleanupOldVisitData(daysLimit) {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() - daysLimit);

    chrome.storage.local.get('visitData', (data) => {
      const visitData = data.visitData || {};
      for (const date in visitData) {
        const recordDate = new Date(date);
        if (recordDate < thresholdDate) {
          delete visitData[date]; // 删除超出最大存储天数的数据
        }
      }

      // 更新存储数据
      chrome.storage.local.set({ visitData }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error cleaning up visit data:',
            chrome.runtime.lastError
          );
        }
      });
    });
  }

  // 发送通知的函数
  function sendNotification() {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png', // 请替换为您的图标路径
      title: chrome.i18n.getMessage('notificationSavedTitle'),
      message: chrome.i18n.getMessage('notificationSavedMessage'),
      priority: 2,
    });
  }

  // 保存最大存储天数设置
  function saveSettings() {
    const daysLimit = parseInt(daysLimitInput.value);
    chrome.storage.local.set({ daysLimit }, () => {
      sendNotification();
    });
  }

  // 设置默认日期为今天并显示对应数据
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  showVisitData(today);

  // 加载当前设置
  loadSettings();

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // 监听日期变化
  dateInput.addEventListener('change', () => {
    showVisitData(dateInput.value);
  });

  // 监听搜索输入变化
  searchInput.addEventListener(
    'input',
    debounce(() => {
      showVisitData(dateInput.value, searchInput.value);
    }, 200)
  );

  // 保存设置按钮点击事件
  saveButton.addEventListener('click', saveSettings);

  // 设置国际化文本
  document.getElementById('extensionName').textContent =
    chrome.i18n.getMessage('extensionName');
  document.getElementById('selectDateLabel').textContent =
    chrome.i18n.getMessage('selectDate');
  document.getElementById('searchLabel').textContent =
    chrome.i18n.getMessage('searchLabel');
  document.getElementById('search').placeholder =
    chrome.i18n.getMessage('searchPlaceholder');
  document.getElementById('settings').textContent =
    chrome.i18n.getMessage('settings');
  document.getElementById('maxDaysLabel').textContent =
    chrome.i18n.getMessage('maxDays');
  document.getElementById('save').textContent = chrome.i18n.getMessage('save');
});
