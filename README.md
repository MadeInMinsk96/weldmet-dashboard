# 🏭 WeldMet Order Dashboard

**Система управления заказами для производства**

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-brightgreen?logo=github)](https://ваш-username.github.io/weldmet-dashboard/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Mobile Friendly](https://img.shields.io/badge/Mobile-Friendly-green.svg)]()

## 🌟 Возможности

- ⚡ **Быстрое перемещение заказов** между этапами производства
- 💬 **Комментарии к движениям** для детального трекинга
- 📱 **Мобильная адаптация** для работы на всех устройствах
- 📊 **Детальная аналитика** и отчеты
- 💾 **Локальное хранение** данных (не требует сервера)
- 🎯 **Интуитивный интерфейс** с drag-and-drop

## 🚀 Демо

**[📱 Открыть приложение](https://ваш-username.github.io/weldmet-dashboard/)**

### Доступные страницы:

- **[Панель управления](mobile_order_dashboard.html)** - Основной интерфейс для работы с заказами
- **[Отчеты](reports.html)** - Анализ движения заказов и логистика
- **[Полное демо](full_app_demo.html)** - Презентация всех возможностей

## 📋 Этапы производства

1. **📝 Новые заказы** - Входящие заказы
2. **⚙️ Производство** - Заказы в работе
3. **🔍 Контроль качества** - Проверка готовой продукции
4. **📦 Готов к отправке** - Заказы готовые к доставке
5. **🚚 Отправлен** - Отгруженные заказы
6. **✅ Выполнен** - Завершенные заказы

## 🛠️ Технологии

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Components**: Swiper.js для слайдеров
- **Storage**: LocalStorage для данных
- **Design**: Responsive Mobile-First подход
- **Hosting**: GitHub Pages (статический хостинг)

## 💻 Локальный запуск

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/ваш-username/weldmet-dashboard.git
   cd weldmet-dashboard
   ```

2. **Откройте в браузере:**
   ```bash
   # Простой способ
   open index.html
   
   # Или через локальный сервер
   python -m http.server 8000
   # Затем откройте http://localhost:8000
   ```

## 📁 Структура проекта

```
📦 weldmet-dashboard/
├── 📄 index.html                    # Главная страница
├── 📱 mobile_order_dashboard.html   # Панель управления заказами
├── 📊 reports.html                  # Отчеты и аналитика
├── 🎯 full_app_demo.html           # Полное демо приложения
├── 📝 README.md                     # Документация
├── ⚙️ .github/workflows/           # GitHub Actions
│   └── deploy.yml                   # Автоматический деплой
└── 📜 LICENSE                       # MIT лицензия
```

## 🔧 Настройка для продакшена

### Резервное копирование данных
Приложение автоматически сохраняет данные в localStorage. Для создания резервной копии:

1. Откройте консоль браузера (F12)
2. Выполните:
   ```javascript
   // Экспорт всех данных
   const backup = {
     orders: localStorage.getItem('orders'),
     logs: localStorage.getItem('logisticsLog'),
     timestamp: new Date().toISOString()
   };
   
   // Скачать как файл
   const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'weldmet_backup.json';
   a.click();
   ```

### Восстановление данных
```javascript
// Восстановление из backup файла
const restoreData = (backupData) => {
  localStorage.setItem('orders', backupData.orders);
  localStorage.setItem('logisticsLog', backupData.logs);
  location.reload();
};
```

## 🌐 Деплой на GitHub Pages

### Автоматический деплой
Проект настроен для автоматического деплоя при push в main ветку.

### Ручная настройка
1. Перейдите в Settings репозитория
2. Найдите секцию "Pages"
3. Source: "Deploy from a branch"
4. Branch: "main" / "(root)"
5. Сохраните настройки

## 📈 Особенности использования

### Перемещение заказов
1. Нажмите на заказ для открытия деталей
2. Выберите новый этап в разделе "Переместить заказ"
3. Подтвердите действие
4. При желании добавьте комментарий

### Просмотр отчетов
- Все движения заказов логируются автоматически
- Отчеты включают временные метки и комментарии
- Фильтрация по типам событий

### Мобильное использование
- Приложение оптимизировано для сенсорных экранов
- Swipe-жесты для навигации
- Адаптивная верстка для всех размеров экранов

## 🐛 Решение проблем

### Данные не сохраняются
- Проверьте, что localStorage включен в браузере
- Очистите кэш и перезагрузите страницу
- Убедитесь, что не используется режим инкогнито

### Медленная загрузка
- Проверьте интернет-соединение
- Очистите кэш браузера
- Попробуйте другой браузер

## 📄 Лицензия

MIT License - свободное использование для коммерческих и некоммерческих проектов.

## 👨‍💻 Автор

**MiniMax Agent** - Разработка и поддержка

---

## 🔗 Полезные ссылки

- [GitHub Pages документация](https://docs.github.com/en/pages)
- [Swiper.js документация](https://swiperjs.com/)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

⭐ **Если проект полезен, поставьте звезду!** ⭐