// script.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
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
        try {
            // Создаем запрос к бэкенду для генерации аудио о метро
            const response = await fetch('/api/chat/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    query: "Расскажи интересные факты о Московском метрополитене, его истории, архитектуре и современных возможностях",
                    voice: this.selectedVoice
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.audioUrl && this.audioEnabled) {
                    await this.playAudio(data.audioUrl);
                }
            }
        } catch (error) {
            console.error('Ошибка воспроизведения аудио о метро:', error);
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

    // Остальные методы остаются без изменений
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
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            if (!localStorage.getItem('theme')) {
                this.applyTheme('dark');
            }
        }

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
            
            if (savedVoice === 'female') {
                this.voiceFemale.checked = true;
            } else {
                this.voiceMale.checked = true;
            }
        }
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
        
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
    }

    async sendMessage(message) {
        this.messageInput.value = '';
        this.handleInput();
        
        if (!this.chatStarted) {
            this.startChat();
        }
        
        this.displayMessage(message, 'user');
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
                this.displayMessage(data.textResponse, 'bot');
                
                if (this.audioEnabled && data.audioUrl) {
                    this.playAudio(data.audioUrl);
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

    displayMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message-touch ${sender}-message-touch`;
        
        const time = new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-avatar-touch">
                ${sender === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content-touch">
                <div class="message-text-touch">${this.escapeHtml(text)}</div>
                <div class="message-time-touch">${time}</div>
            </div>
        `;

        this.chatWindow.appendChild(messageElement);
        this.scrollToBottom();
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
        if (this.audioEnabled) {
            this.showNotification('Озвучка включена', 'success');
        } else {
            this.showNotification('Озвучка выключена', 'info');
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
    }

    async playAudio(audioUrl) {
        try {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            this.lastAudioUrl = audioUrl;
            const urlWithTimestamp = `${audioUrl}?t=${Date.now()}`;
            this.currentAudio = new Audio(urlWithTimestamp);
            
            await this.currentAudio.play();
            
            this.currentAudio.onended = () => {
                this.currentAudio = null;
            };
            
            this.currentAudio.onerror = (e) => {
                console.error('Ошибка воспроизведения аудио:', e);
                this.showNotification('Ошибка воспроизведения аудио', 'error');
                this.currentAudio = null;
            };
            
        } catch (error) {
            console.error('Ошибка воспроизведения аудио:', error);
            this.showNotification('Ошибка воспроизведения аудио', 'error');
        }
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
