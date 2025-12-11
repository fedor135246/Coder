// Переменные для таймера
let timerInterval = null;
let seconds = 0;
let minutes = 0;
let hours = 0;
let timerRunning = false;
let userStartedTyping = false;
let comparisonData = null;

// Элементы DOM
const timerDisplay = document.getElementById('timerDisplay');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');
const timerStatus = document.getElementById('timerStatus');
const resultsContainer = document.getElementById('resultsContainer');
const comparisonResults = document.getElementById('comparisonResults');
const visualComparisonContainer = document.getElementById('visualComparisonContainer');
const userCodeVisual = document.getElementById('userCodeVisual');
const referenceCodeVisual = document.getElementById('referenceCodeVisual');
const userCodeSide = document.getElementById('userCodeSide');
const referenceCodeSide = document.getElementById('referenceCodeSide');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Инициализация редактора кода
const codeEditor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    mode: "text/x-csrc",
    theme: "monokai",
    lineNumbers: true,
    indentUnit: 2,
    smartIndent: true,
    lineWrapping: true,
    autofocus: true,
    extraKeys: {
        "Tab": function(cm) {
            cm.replaceSelection("  ", "end");
        },
        "Ctrl-S": saveCode
    }
});

// Функция обновления таймера
function updateTimer() {
    seconds++;
    
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
    }
    
    if (minutes >= 60) {
        minutes = 0;
        hours++;
    }
    
    // Форматирование времени
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    timerDisplay.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    
    // Обновление статуса
    updateTimerStatus();
}

// Функция запуска таймера
function startTimer() {
    if (!timerRunning) {
        timerInterval = setInterval(updateTimer, 1000);
        timerRunning = true;
        timerDisplay.classList.add('running');
        updateTimerStatus();
    }
}

// Функция остановки таймера
function stopTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerDisplay.classList.remove('running');
        updateTimerStatus();
        
        // Выполняем сравнение кода
        compareCode();
    }
}

// Функция сброса таймера
function resetTimer() {
    stopTimer();
    seconds = 0;
    minutes = 0;
    hours = 0;
    timerDisplay.textContent = '00:00:00';
    userStartedTyping = false;
    updateTimerStatus();
    
    // Скрываем результаты сравнения
    resultsContainer.style.display = 'none';
    visualComparisonContainer.style.display = 'none';
}

// Функция обновления статуса таймера
function updateTimerStatus() {
    if (timerRunning) {
        timerStatus.textContent = `Таймер запущен: ${hours} ч ${minutes} мин ${seconds} сек`;
        timerStatus.style.color = '#4caf50';
    } else {
        if (hours > 0 || minutes > 0 || seconds > 0) {
            timerStatus.textContent = `Таймер остановлен: ${hours} ч ${minutes} мин ${seconds} сек`;
            timerStatus.style.color = '#ff9800';
        } else {
            timerStatus.textContent = userStartedTyping ? 
                'Таймер сброшен. Начните печатать для запуска' : 
                'Таймер остановлен. Начните печатать для запуска';
            timerStatus.style.color = '#bbb';
        }
    }
}

// Функция сохранения кода
function saveCode() {
    const code = codeEditor.getValue();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arduino_code.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Визуальная обратная связь
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#2e7d32';
    setTimeout(() => {
        document.body.style.backgroundColor = originalBg;
    }, 300);
}

// Функция сравнения кода
function compareCode() {
    // Показываем контейнер результатов
    resultsContainer.style.display = 'block';
    
    // Получаем текущий код пользователя
    const userCode = codeEditor.getValue();
    
    // Загружаем эталонный код из файла
    fetch('reference_code.ino')
        .then(response => response.text())
        .then(referenceCode => {
            // Выполняем сравнение
            const comparisonResult = compareTwoCodes(userCode, referenceCode);
            comparisonData = comparisonResult;
            
            // Отображаем результаты
            displayComparisonResults(comparisonResult);
            
            // Создаем визуальное сравнение
            createVisualComparison(userCode, referenceCode, comparisonResult.charAnalysis);
            
            // Показываем контейнер визуального сравнения
            visualComparisonContainer.style.display = 'block';
        })
        .catch(error => {
            console.error('Ошибка загрузки эталонного кода:', error);
            comparisonResults.innerHTML = `
                <div class="result-item">
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить эталонный код. Убедитесь, что файл reference_code.ino существует.</p>
                </div>
            `;
        });
}

// Функция сравнения двух кодов
function compareTwoCodes(code1, code2) {
    // Нормализация кодов (удаление лишних пробелов, переводов строк)
    const normalizedCode1 = normalizeCode(code1);
    const normalizedCode2 = normalizeCode(code2);
    
    // Анализ символов с получением данных для визуализации
    const charAnalysis = analyzeCharacters(code1, code2);
    
    // Сравнение по символам
    const charSimilarity = charAnalysis.similarity;
    
    // Сравнение по строкам
    const linesSimilarity = calculateLinesSimilarity(code1, code2);
    
    // Сравнение по ключевым словам
    const keywordsSimilarity = calculateKeywordsSimilarity(code1, code2);
    
    // Сравнение по структуре (наличие setup и loop функций)
    const structureSimilarity = calculateStructureSimilarity(code1, code2);
    
    // Общая оценка
    const overallSimilarity = Math.round(
        (charSimilarity * 0.3 + 
         linesSimilarity * 0.3 + 
         keywordsSimilarity * 0.2 + 
         structureSimilarity * 0.2)
    );
    
    return {
        overallSimilarity,
        charSimilarity: Math.round(charSimilarity),
        linesSimilarity: Math.round(linesSimilarity),
        keywordsSimilarity: Math.round(keywordsSimilarity),
        structureSimilarity: Math.round(structureSimilarity),
        userCodeLength: code1.length,
        referenceCodeLength: code2.length,
        userLines: code1.split('\n').length,
        referenceLines: code2.split('\n').length,
        charAnalysis: charAnalysis
    };
}

// Анализ символов для визуализации
function analyzeCharacters(code1, code2) {
    const lines1 = code1.split('\n');
    const lines2 = code2.split('\n');
    
    // Подготовка данных для визуализации
    const visualData = {
        userCode: [],
        referenceCode: [],
        similarity: 0
    };
    
    // Сравниваем построчно
    const maxLines = Math.max(lines1.length, lines2.length);
    let totalChars = 0;
    let matchingChars = 0;
    
    for (let i = 0; i < maxLines; i++) {
        const line1 = i < lines1.length ? lines1[i] : '';
        const line2 = i < lines2.length ? lines2[i] : '';
        
        const lineComparison = compareLineCharacters(line1, line2);
        
        visualData.userCode.push(lineComparison.line1);
        visualData.referenceCode.push(lineComparison.line2);
        
        totalChars += lineComparison.totalChars;
        matchingChars += lineComparison.matchingChars;
    }
    
    visualData.similarity = totalChars > 0 ? (matchingChars / totalChars) * 100 : 0;
    
    return visualData;
}

// Сравнение символов в строке
function compareLineCharacters(line1, line2) {
    const result = {
        line1: [],
        line2: [],
        totalChars: Math.max(line1.length, line2.length),
        matchingChars: 0
    };
    
    const maxLength = Math.max(line1.length, line2.length);
    
    for (let j = 0; j < maxLength; j++) {
        const char1 = j < line1.length ? line1[j] : '';
        const char2 = j < line2.length ? line2[j] : '';
        
        if (char1 === char2 && char1 !== '') {
            // Совпадающие символы
            result.line1.push({
                char: char1,
                type: 'match'
            });
            result.line2.push({
                char: char2,
                type: 'match'
            });
            result.matchingChars++;
        } else if (char1 !== '' && char2 !== '' && char1 !== char2) {
            // Несовпадающие символы
            result.line1.push({
                char: char1,
                type: 'mismatch'
            });
            result.line2.push({
                char: char2,
                type: 'mismatch'
            });
        } else if (char1 !== '' && char2 === '') {
            // Лишние символы в коде пользователя
            result.line1.push({
                char: char1,
                type: 'extra'
            });
            result.line2.push({
                char: ' ',
                type: 'missing'
            });
        } else if (char1 === '' && char2 !== '') {
            // Отсутствующие символы в коде пользователя
            result.line1.push({
                char: ' ',
                type: 'missing'
            });
            result.line2.push({
                char: char2,
                type: 'extra'
            });
        } else {
            // Пустые символы (пробелы)
            result.line1.push({
                char: ' ',
                type: 'space'
            });
            result.line2.push({
                char: ' ',
                type: 'space'
            });
        }
    }
    
    return result;
}

// Нормализация кода
function normalizeCode(code) {
    return code
        .replace(/\s+/g, ' ') // Заменяем все пробельные символы на один пробел
        .replace(/\/\/.*?\n/g, '') // Удаляем однострочные комментарии
        .replace(/\/\*.*?\*\//g, '') // Удаляем многострочные комментарии
        .trim();
}

// Сравнение по строкам
function calculateLinesSimilarity(code1, code2) {
    const lines1 = code1.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lines2 = code2.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines1.length === 0 && lines2.length === 0) return 100;
    
    let matchingLines = 0;
    
    // Простое сравнение строк (можно улучшить алгоритмом Левенштейна)
    for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
        if (lines1[i] === lines2[i]) {
            matchingLines++;
        }
    }
    
    return (matchingLines / Math.max(lines1.length, lines2.length)) * 100;
}

// Сравнение по ключевым словам
function calculateKeywordsSimilarity(code1, code2) {
    const keywords = ['void', 'setup', 'loop', 'int', 'float', 'double', 'char', 
                      'if', 'else', 'for', 'while', 'do', 'return', 'pinMode', 
                      'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite',
                      'Serial', 'begin', 'print', 'println', 'delay', 'HIGH', 'LOW'];
    
    const extractKeywords = (code) => {
        const foundKeywords = [];
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = code.match(regex);
            if (matches) {
                foundKeywords.push(...matches);
            }
        });
        return foundKeywords;
    };
    
    const keywords1 = extractKeywords(code1);
    const keywords2 = extractKeywords(code2);
    
    if (keywords1.length === 0 && keywords2.length === 0) return 100;
    
    // Подсчет совпадений ключевых слов
    const keywordCount1 = {};
    const keywordCount2 = {};
    
    keywords1.forEach(kw => keywordCount1[kw] = (keywordCount1[kw] || 0) + 1);
    keywords2.forEach(kw => keywordCount2[kw] = (keywordCount2[kw] || 0) + 1);
    
    let matchingKeywords = 0;
    let totalKeywords = 0;
    
    // Учитываем все ключевые слова из обоих кодов
    const allKeywords = new Set([...keywords1, ...keywords2]);
    
    allKeywords.forEach(keyword => {
        const count1 = keywordCount1[keyword] || 0;
        const count2 = keywordCount2[keyword] || 0;
        matchingKeywords += Math.min(count1, count2);
        totalKeywords += Math.max(count1, count2);
    });
    
    return totalKeywords > 0 ? (matchingKeywords / totalKeywords) * 100 : 0;
}

// Сравнение по структуре
function calculateStructureSimilarity(code1, code2) {
    let score = 0;
    
    // Проверка наличия функции setup
    if (code1.includes('void setup()') && code2.includes('void setup()')) {
        score += 30;
    }
    
    // Проверка наличия функции loop
    if (code1.includes('void loop()') && code2.includes('void loop()')) {
        score += 30;
    }
    
    // Проверка наличия открывающих и закрывающих скобок
    const braces1 = (code1.match(/{/g) || []).length + (code1.match(/}/g) || []).length;
    const braces2 = (code2.match(/{/g) || []).length + (code2.match(/}/g) || []).length;
    
    if (braces1 > 0 && braces2 > 0) {
        const bracesSimilarity = Math.min(braces1, braces2) / Math.max(braces1, braces2) * 40;
        score += bracesSimilarity;
    }
    
    return Math.min(score, 100);
}

// Создание визуального сравнения
function createVisualComparison(userCode, referenceCode, charAnalysis) {
    // Отображение кода пользователя с подсветкой
    displayCodeWithHighlight(userCodeVisual, charAnalysis.userCode);
    
    // Отображение эталонного кода с подсветкой
    displayCodeWithHighlight(referenceCodeVisual, charAnalysis.referenceCode);
    
    // Отображение для side-by-side сравнения
    displayCodeWithHighlight(userCodeSide, charAnalysis.userCode);
    displayCodeWithHighlight(referenceCodeSide, charAnalysis.referenceCode);
}

// Отображение кода с подсветкой
function displayCodeWithHighlight(element, codeData) {
    let html = '';
    
    codeData.forEach(line => {
        html += '<div class="code-line">';
        line.forEach(charData => {
            const char = charData.char === ' ' ? '&nbsp;' : escapeHtml(charData.char);
            const className = charData.type !== 'space' ? `char-${charData.type}` : '';
            html += `<span class="${className}">${char}</span>`;
        });
        html += '</div>';
    });
    
    element.innerHTML = html;
}

// Экранирование HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Отображение результатов сравнения
function displayComparisonResults(results) {
    // Определяем класс для цвета в зависимости от процента
    function getColorClass(percentage) {
        if (percentage >= 80) return 'high';
        if (percentage >= 50) return 'medium';
        return 'low';
    }
    
    const html = `
        <div class="result-item">
            <h3>Общее сходство</h3>
            <div class="result-value ${getColorClass(results.overallSimilarity)}">
                ${results.overallSimilarity}%
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${results.overallSimilarity}%"></div>
            </div>
            <div class="result-details">
                <div class="detail-item">
                    <span class="detail-label">Время написания:</span>
                    <span class="detail-value">${hours}ч ${minutes}мин ${seconds}сек</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Длина вашего кода:</span>
                    <span class="detail-value">${results.userCodeLength} символов</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Длина эталонного кода:</span>
                    <span class="detail-value">${results.referenceCodeLength} символов</span>
                </div>
            </div>
        </div>
        
        <div class="result-item">
            <h3>Детальный анализ</h3>
            <div class="result-details">
                <div class="detail-item">
                    <span class="detail-label">Сходство по символам:</span>
                    <span class="detail-value ${getColorClass(results.charSimilarity)}">${results.charSimilarity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Сходство по строкам:</span>
                    <span class="detail-value ${getColorClass(results.linesSimilarity)}">${results.linesSimilarity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Сходство по ключевым словам:</span>
                    <span class="detail-value ${getColorClass(results.keywordsSimilarity)}">${results.keywordsSimilarity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Сходство по структуре:</span>
                    <span class="detail-value ${getColorClass(results.structureSimilarity)}">${results.structureSimilarity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Строк в вашем коде:</span>
                    <span class="detail-value">${results.userLines}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Строк в эталонном коде:</span>
                    <span class="detail-value">${results.referenceLines}</span>
                </div>
            </div>
        </div>
        
        <div class="result-item">
            <h3>Интерпретация результатов</h3>
            <p>
                ${getInterpretation(results.overallSimilarity)}
            </p>
        </div>
    `;
    
    comparisonResults.innerHTML = html;
    
    // Прокручиваем к результатам
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Интерпретация результатов
function getInterpretation(percentage) {
    if (percentage >= 90) {
        return "Отличная работа! Ваш код практически идентичен эталонному. Вы хорошо понимаете структуру Arduino программ.";
    } else if (percentage >= 70) {
        return "Хороший результат! Ваш код имеет высокое сходство с эталонным, но есть некоторые различия. Продолжайте практиковаться!";
    } else if (percentage >= 50) {
        return "Средний результат. Ваш код имеет базовое сходство с эталонным. Рекомендуется изучить примеры кода Arduino для лучшего понимания структуры.";
    } else if (percentage >= 30) {
        return "Результат ниже среднего. Ваш код имеет лишь частичное сходство с эталонным. Рекомендуется больше практиковаться в написании Arduino кода.";
    } else {
        return "Низкое сходство с эталонным кодом. Возможно, вы неправильно поняли задание или допустили значительные ошибки в структуре программы.";
    }
}

// Обработчик события ввода в редакторе
let keypressTimeout = null;
codeEditor.on('change', function(instance, changeObj) {
    // Если пользователь начал печатать и таймер не запущен
    if (!userStartedTyping) {
        userStartedTyping = true;
        startTimer();
    }
    
    // Сбрасываем таймаут при каждом изменении
    if (keypressTimeout) {
        clearTimeout(keypressTimeout);
    }
    
    // Запускаем таймер автоостановки через 10 секунд бездействия
    keypressTimeout = setTimeout(() => {
        if (timerRunning) {
            stopTimer();
        }
    }, 10000); // 10 секунд бездействия
});

// Обработчики кнопок таймера
resetTimerBtn.addEventListener('click', resetTimer);
stopTimerBtn.addEventListener('click', stopTimer);

// Обработчики вкладок
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Убираем активный класс у всех кнопок
        tabBtns.forEach(b => b.classList.remove('active'));
        // Добавляем активный класс текущей кнопке
        btn.classList.add('active');
        
        // Скрываем все вкладки
        tabContents.forEach(content => content.classList.remove('active'));
        // Показываем выбранную вкладку
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Обработка горячих клавиш
document.addEventListener('keydown', function(e) {
    // Ctrl+S для сохранения
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCode();
    }
    
    // Ctrl+F для поиска
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        codeEditor.focus();
        codeEditor.execCommand("find");
    }
    
    // Ctrl+/ для комментария/раскомментирования
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        codeEditor.toggleComment();
    }
    
    // Space для запуска/остановки таймера
    if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        if (timerRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    }
    
    // R для сброса таймера (с Ctrl)
    if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        resetTimer();
    }
});

// Автоматическая настройка высоты редактора
function setEditorHeight() {
    const editorHeight = window.innerHeight - 250;
    codeEditor.setSize("100%", Math.max(editorHeight, 300));
}

window.addEventListener('resize', setEditorHeight);
setEditorHeight();

// Фокус на редакторе при загрузке
window.addEventListener('load', function() {
    codeEditor.focus();
    // Устанавливаем курсор в начало функции setup
    codeEditor.setCursor({line: 1, ch: 2});
    updateTimerStatus();
});

// Сохраняем состояние таймера при перезагрузке страницы
window.addEventListener('beforeunload', function() {
    if (timerRunning) {
        localStorage.setItem('arduinoTimerRunning', 'true');
        localStorage.setItem('arduinoTimerSeconds', seconds.toString());
        localStorage.setItem('arduinoTimerMinutes', minutes.toString());
        localStorage.setItem('arduinoTimerHours', hours.toString());
    } else {
        localStorage.removeItem('arduinoTimerRunning');
        localStorage.removeItem('arduinoTimerSeconds');
        localStorage.removeItem('arduinoTimerMinutes');
        localStorage.removeItem('arduinoTimerHours');
    }
});

// Восстанавливаем состояние таймера при загрузке
const savedTimerRunning = localStorage.getItem('arduinoTimerRunning');
if (savedTimerRunning === 'true') {
    const savedSeconds = parseInt(localStorage.getItem('arduinoTimerSeconds') || '0');
    const savedMinutes = parseInt(localStorage.getItem('arduinoTimerMinutes') || '0');
    const savedHours = parseInt(localStorage.getItem('arduinoTimerHours') || '0');
    
    seconds = savedSeconds;
    minutes = savedMinutes;
    hours = savedHours;
    
    // Обновляем отображение
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    timerDisplay.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    
    userStartedTyping = true;
    startTimer();
}
