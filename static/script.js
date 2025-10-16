class BoardChatApp {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeApp();
        this.audioEnabled = true;
        this.currentAudio = null;
        this.isRecording = false;
        this.recognition = null;
        this.selectedVoice = 'female';
        this.speechSupport = this.checkSpeechSupport();
        this.setupSpeechRecognition();
        this.lastAudioUrl = null;
        
        // Переменные для маскота
        this.inactivityTimer = null;
        this.inactivityDelay = 30000; // 30 секунд бездействия
        this.mascotActive = false;
        this.userInteracted = false;
        this.chatStarted = false;
        
        // Переменные для управления аудио
        this.audioQueue = [];
        this.isPlayingAudio = false;
    }

    initializeElements() {
        // Основные элементы
        this.chatWindow = document.getElementById('chat-window');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.boardStatus = document.getElementById('board-status');
        this.notification = document.getElementById('notification');
        this.charCounter = document.getElementById('char-counter');
        this.recordingOverlay = document.getElementById('recording-overlay');
        this.welcomeTime = document.getElementById('welcome-time');
        this.headerTitle = document.getElementById('header-title');
        
        // Кнопки управления
        this.voiceBtn = document.getElementById('voice-btn');
        this.audioToggle = document.getElementById('audio-toggle');
        this.themeToggle = document.getElementById('theme-toggle');
        this.clearChatBtn = document.getElementById('clear-chat');
        
        // Элементы выбора голоса
        this.voiceFemale = document.getElementById('voice-female');
        this.voiceMale = document.getElementById('voice-male');
        
        // Элементы маскота
        this.mascotBtn = document.getElementById('mascot-btn');
        this.mascotNotification = this.mascotBtn.querySelector('.mascot-notification');
        this.mascotModal = document.getElementById('mascot-modal');
        this.closeMascotModal = document.getElementById('close-mascot-modal');
        this.mascotCloseBtn = document.getElementById('mascot-close-btn');
    }

    initializeApp() {
        this.setWelcomeTime();
        this.loadTheme();
        this.loadVoicePreference();
        this.setupQuickQuestions();
        this.checkHealth();
        this.setupBoardSpecificFeatures();
        this.startInactivityTimer();
    }

    setupBoardSpecificFeatures() {
        // Автофокус на поле ввода
        setTimeout(() => {
            this.messageInput.focus();
        }, 1000);
        
        // Периодическая проверка состояния
        setInterval(() => this.checkHealth(), 30000);
    }

    setupEventListeners() {
        // Отправка сообщения по Enter
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // Отправка по кнопке
        this.sendBtn.addEventListener('click', () => this.handleSubmit());

        // Ввод текста
        this.messageInput.addEventListener('input', () => this.handleInput());

        // Голосовой ввод
        this.voiceBtn.addEventListener('click', () => this.handleVoiceInput());

        // Управление темой
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Очистка чата
        this.clearChatBtn.addEventListener('click', () => this.clearChat());

        // Переключение озвучки
        this.audioToggle.addEventListener('change', () => this.toggleAudio());

        // Выбор голоса
        this.voiceFemale.addEventListener('change', () => this.handleVoiceChange('female'));
        this.voiceMale.addEventListener('change', () => this.handleVoiceChange('male'));

        // Быстрые вопросы
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('question-btn')) {
                this.handleQuickQuestion(e.target);
            }
        });

        // Закрытие уведомлений по клику
        this.notification.addEventListener('click', () => this.hideNotification());

        // Обработка системной темы
        this.setupSystemThemeListener();

        // Обработчики для маскота
        this.mascotBtn.addEventListener('click', () => this.handleMascotClick());
        this.closeMascotModal.addEventListener('click', () => this.hideMascotModal());
        this.mascotCloseBtn.addEventListener('click', () => this.hideMascotModal());
        this.mascotModal.addEventListener('click', (e) => {
            if (e.target === this.mascotModal) {
                this.hideMascotModal();
            }
        });

        // Сброс таймера бездействия при взаимодействии
        this.setupActivityListeners();
    }

    setupActivityListeners() {
        const activityEvents = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
        ];

        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                this.resetInactivityTimer();
            }, { passive: true });
        });
    }

    startInactivityTimer() {
        this.inactivityTimer = setTimeout(() => {
            if (!this.chatStarted && !this.mascotActive) {
                this.showMascotAttention();
            }
        }, this.inactivityDelay);
    }

    resetInactivityTimer() {
        clearTimeout(this.inactivityTimer);
        this.startInactivityTimer();
    }

    showMascotAttention() {
        if (this.chatStarted || this.mascotActive) return;

        this.mascotActive = true;
        this.mascotBtn.classList.add('attention');
        this.mascotNotification.classList.add('show');
        
        // Показываем уведомление
        this.showNotification('Маскот хочет вам что-то рассказать! Нажмите на него.', 'info');
        
        // Автоматическое скрытие через 15 секунд, если не нажали
        setTimeout(() => {
            if (this.mascotActive && !this.mascotModal.classList.contains('show')) {
                this.hideMascotAttention();
            }
        }, 15000);
    }

    hideMascotAttention() {
        this.mascotActive = false;
        this.mascotBtn.classList.remove('attention');
        this.mascotNotification.classList.remove('show');
    }

    handleMascotClick() {
        if (this.mascotActive || this.mascotNotification.classList.contains('show')) {
            this.showMascotModal();
            this.hideMascotAttention();
        } else {
            // Обычный клик по маскоту - небольшая анимация
            this.mascotBtn.classList.add('idle');
            setTimeout(() => {
                this.mascotBtn.classList.remove('idle');
            }, 1000);
        }
    }

    showMascotModal() {
        this.mascotModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Добавляем сообщение в чат о метро только если модалка открыта через активацию маскота
        if (!this.chatStarted) {
            this.startChat();
        }
        this.addMetroInfoToChat();
    }

    hideMascotModal() {
        this.mascotModal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Воспроизводим аудио с информацией о метро, если озвучка включена
        if (this.audioEnabled) {
            this.playMetroAudio();
        }
        
        // Перезапускаем таймер бездействия
        this.resetInactivityTimer();
    }

    addMetroInfoToChat() {
        const metroMessage = `🐻 Московский метрополитен - это одна из самых красивых и загруженных систем метро в мире!

🚇 **Интересные факты:**
• Более 250 станций на 14 линиях
• Протяженность более 450 км
• Ежедневно перевозит 9+ миллионов пассажиров
• Некоторые станции находятся на глубине до 84 метров
• Известен уникальной архитектурой "сталинских" станций

🏛️ **Самые красивые станции:**
• Комсомольская
• Новослободская  
• Маяковская
• Площадь Революции
• Арбатская

Метро Москвы - это не просто транспорт, а настоящий подземный музей! 🎨`;

        this.displayMessage(metroMessage, 'bot');
    }

    async playMetroAudio() {
        if (!this.audioEnabled) {
            return;
        }

        try {
            this.showNotification('Генерируем аудио о метро...', 'info');
            
            const response = await fetch('/api/chat/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    query: "Расскажи интересные факты о Московском метрополитене, его истории, архитектуре и современных возможностях. Расскажи кратко, но информативно.",
                    voice: this.selectedVoice
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.audioUrl) {
                await this.playAudio(data.audioUrl);
                this.showNotification('Аудио о метро воспроизведено', 'success');
            } else {
                throw new Error('Аудио URL не получен от сервера');
            }

        } catch (error) {
            console.error('Ошибка воспроизведения аудио о метро:', error);
            this.showNotification('Не удалось воспроизвести аудио о метро', 'error');
        }
    }

    startChat() {
        this.chatStarted = true;
        const welcomeBoard = this.chatWindow.querySelector('.welcome-board');
        if (welcomeBoard) {
            welcomeBoard.style.display = 'none';
        }
        this.headerTitle.textContent = 'Чат-помощник';
        
        // Останавливаем таймер бездействия при начале чата
        clearTimeout(this.inactivityTimer);
    }

    setWelcomeTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = now.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        this.welcomeTime.textContent = `${dateString}, ${timeString}`;
    }

    setupSystemThemeListener() {
        // Проверка системных предпочтений темы
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Если системная тема темная и нет сохраненной темы
            if (!localStorage.getItem('theme')) {
                this.applyTheme('dark');
            }
        }

        // Слушатель изменений системной темы
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = this.themeToggle;
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    handleVoiceChange(voiceType) {
        this.selectedVoice = voiceType;
        localStorage.setItem('preferredVoice', voiceType);
        
        const voiceName = voiceType === 'female' ? 'женский' : 'мужской';
        this.showNotification(`Выбран ${voiceName} голос`, 'success');
    }

    loadVoicePreference() {
        const savedVoice = localStorage.getItem('preferredVoice');
        if (savedVoice) {
            this.selectedVoice = savedVoice;
            
            // Устанавливаем соответствующий radio button
            if (savedVoice === 'female') {
                this.voiceFemale.checked = true;
            } else {
                this.voiceMale.checked = true;
            }
        }
    }

    setupQuickQuestions() {
        // Автоматическая настройка уже работает через делегирование событий
    }

    handleSubmit() {
        const message = this.messageInput.value.trim();
        if (message) {
            this.sendMessage(message);
        }
    }

    handleInput() {
        const text = this.messageInput.value;
        const length = text.length;
        
        this.charCounter.textContent = `${length}/200`;
        this.sendBtn.disabled = length === 0 || length > 200;
        
        if (length > 180) {
            this.charCounter.style.color = 'var(--warning-color)';
        } else if (length > 200) {
            this.charCounter.style.color = 'var(--error-color)';
        } else {
            this.charCounter.style.color = 'var(--text-tertiary)';
        }
    }

    handleQuickQuestion(button) {
        const question = button.getAttribute('data-question');
        this.sendMessage(question);
        
        // Анимация нажатия
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
    }

    async sendMessage(message) {
        // Очищаем поле ввода
        this.messageInput.value = '';
        this.handleInput();
        
        // Начинаем чат, если еще не начат
        if (!this.chatStarted) {
            this.startChat();
        }
        
        // Показываем сообщение пользователя
        this.displayMessage(message, 'user');
        
        // Показываем индикатор загрузки
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    query: message,
                    voice: this.selectedVoice
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            this.hideTypingIndicator();
            
            if (data.textResponse) {
                // Передаем audioUrl в displayMessage
                this.displayMessage(data.textResponse, 'bot', data.audioUrl);
                
                // Воспроизводим аудио если включено
                if (this.audioEnabled && data.audioUrl) {
                    await this.playAudio(data.audioUrl);
                }
            } else {
                throw new Error('Некорректный ответ от сервера');
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.displayMessage('Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.', 'bot');
            this.showNotification(error.message, 'error');
            console.error('Ошибка:', error);
        }
    }

    displayMessage(text, sender, audioUrl = null) {
        const messageElement = document.createElement('div');
        messageElement.className = `message-touch ${sender}-message-touch`;
        
        if (audioUrl && sender === 'bot') {
            messageElement.classList.add('message-with-audio');
        }
        
        const time = new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let audioIndicator = '';
        if (audioUrl && sender === 'bot') {
            audioIndicator = `
                <div class="audio-playing-indicator" data-audio-url="${audioUrl}">
                    <span>🔊</span>
                    <div class="audio-wave">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <button class="replay-audio-btn" title="Воспроизвести снова">↻</button>
                </div>
            `;
        }

        messageElement.innerHTML = `
            <div class="message-avatar-touch">
                ${sender === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content-touch">
                <div class="message-text-touch">${this.escapeHtml(text)}</div>
                <div class="message-time-touch">
                    ${time}
                    ${audioIndicator}
                </div>
            </div>
        `;

        this.chatWindow.appendChild(messageElement);
        this.scrollToBottom();
        
        // Добавляем обработчик для кнопки повторного воспроизведения
        if (audioUrl && sender === 'bot') {
            const replayBtn = messageElement.querySelector('.replay-audio-btn');
            replayBtn.addEventListener('click', () => {
                this.playAudio(audioUrl).catch(error => {
                    console.error('Ошибка повторного воспроизведения:', error);
                    this.showNotification('Ошибка воспроизведения аудио', 'error');
                });
            });
        }
    }

    showTypingIndicator() {
        this.typingIndicator.classList.add('show');
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.remove('show');
    }

    clearChat() {
        const messages = this.chatWindow.querySelectorAll('.message-touch');
        messages.forEach(msg => msg.remove());
        
        // Показываем приветственный блок снова
        const welcomeBoard = this.chatWindow.querySelector('.welcome-board');
        if (welcomeBoard) {
            welcomeBoard.style.display = 'block';
        }
        
        this.chatStarted = false;
        this.headerTitle.textContent = 'Популярные вопросы';
        this.showNotification('Чат очищен', 'success');
        
        // Перезапускаем таймер бездействия при очистке чата
        this.startInactivityTimer();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.showNotification(newTheme === 'dark' ? 'Темная тема включена' : 'Светлая тема включена', 'success');
    }

    toggleAudio() {
        this.audioEnabled = this.audioToggle.checked;
        
        // Если выключаем аудио, останавливаем текущее воспроизведение
        if (!this.audioEnabled && this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
            this.isPlayingAudio = false;
        }
        
        if (this.audioEnabled) {
            this.showNotification('Озвучка включена', 'success');
        } else {
            this.showNotification('Озвучка выключена', 'info');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
    }

    async playAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            // Если озвучка выключена, сразу завершаем
            if (!this.audioEnabled) {
                resolve();
                return;
            }

            try {
                // Останавливаем текущее воспроизведение
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio = null;
                }

                // Создаем полный URL для аудио
                const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${window.location.origin}${audioUrl}`;
                const urlWithTimestamp = `${fullAudioUrl}?t=${Date.now()}`;
                
                console.log('Воспроизведение аудио:', urlWithTimestamp);
                
                this.currentAudio = new Audio(urlWithTimestamp);
                this.isPlayingAudio = true;

                // Обработчики событий
                this.currentAudio.onended = () => {
                    console.log('Аудио воспроизведение завершено');
                    this.currentAudio = null;
                    this.isPlayingAudio = false;
                    resolve();
                };

                this.currentAudio.onerror = (e) => {
                    console.error('Ошибка воспроизведения аудио:', e);
                    this.currentAudio = null;
                    this.isPlayingAudio = false;
                    reject(new Error('Ошибка воспроизведения аудио'));
                };

                this.currentAudio.oncanplaythrough = () => {
                    console.log('Аудио готово к воспроизведению');
                };

                this.currentAudio.onloadstart = () => {
                    console.log('Началась загрузка аудио');
                };

                // Запускаем воспроизведение
                this.currentAudio.play().catch(error => {
                    console.error('Ошибка при запуске аудио:', error);
                    this.currentAudio = null;
                    this.isPlayingAudio = false;
                    
                    if (error.name === 'NotAllowedError') {
                        this.showNotification('Разрешите автоматическое воспроизведение аудио в браузере', 'error');
                    }
                    reject(error);
                });

            } catch (error) {
                console.error('Ошибка создания аудио:', error);
                this.currentAudio = null;
                this.isPlayingAudio = false;
                reject(error);
            }
        });
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatWindow.scrollTo({
                top: this.chatWindow.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `board-notification show ${type}`;
        
        setTimeout(() => {
            this.hideNotification();
        }, 4000);
    }

    hideNotification() {
        this.notification.classList.remove('show');
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            if (!response.ok) throw new Error('Сервер недоступен');
            
            const data = await response.json();
            
            this.boardStatus.classList.add('online');
            this.boardStatus.querySelector('span:last-child').textContent = 'Онлайн';
        } catch (error) {
            this.boardStatus.classList.remove('online');
            this.boardStatus.querySelector('span:last-child').textContent = 'Офлайн';
        }
    }

    // Базовые функции голосового ввода
    checkSpeechSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        return {
            recognition: !!SpeechRecognition,
            browser: this.detectBrowser()
        };
    }

    detectBrowser() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('chrome')) return 'chrome';
        if (ua.includes('firefox')) return 'firefox';
        if (ua.includes('safari')) return 'safari';
        return 'unknown';
    }

    setupSpeechRecognition() {
        if (!this.speechSupport.recognition) {
            this.voiceBtn.style.display = 'none';
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ru-RU';

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.voiceBtn.classList.add('recording');
            this.recordingOverlay.classList.add('show');
            this.showNotification('Говорите сейчас...', 'info');
        };

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            this.messageInput.value = transcript;
            this.handleInput();
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.voiceBtn.classList.remove('recording');
            this.recordingOverlay.classList.remove('show');
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            let errorMessage = 'Ошибка распознавания речи';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'Речь не распознана. Попробуйте еще раз.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Микрофон не доступен. Проверьте разрешения.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.';
                    break;
            }
            
            this.showNotification(errorMessage, 'error');
        };
    }

    handleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Голосовой ввод не поддерживается', 'error');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.boardApp = new BoardChatApp();
});
