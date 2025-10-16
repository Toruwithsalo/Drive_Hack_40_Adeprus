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
    }

    initializeElements() {
        // Основные элементы доски
        this.chatWindow = document.getElementById('chat-window');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.boardStatus = document.getElementById('board-status');
        this.notification = document.getElementById('notification');
        this.charCounter = document.getElementById('char-counter');
        this.recordingOverlay = document.getElementById('recording-overlay');
        this.welcomeTime = document.getElementById('welcome-time');
        
        // Кнопки управления
        this.voiceBtn = document.getElementById('voice-btn');
        this.audioToggle = document.getElementById('audio-toggle');
        this.themeToggle = document.getElementById('theme-toggle');
        this.clearChatBtn = document.getElementById('clear-chat');
        
        // Элементы выбора голоса
        this.voiceFemale = document.getElementById('voice-female');
        this.voiceMale = document.getElementById('voice-male');
    }

    initializeApp() {
        this.setWelcomeTime();
        this.loadTheme();
        this.loadVoicePreference();
        this.setupQuickQuestions();
        this.checkHealth();
        this.setupBoardSpecificFeatures();
    }

    setupBoardSpecificFeatures() {
        // Автофокус на поле ввода
        setTimeout(() => {
            this.messageInput.focus();
        }, 1000);
        
        // Периодическая проверка состояния
        setInterval(() => this.checkHealth(), 30000);
    }

    setWelcomeTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        this.welcomeTime.textContent = `Сегодня ${timeString}`;
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
        // Убираем приветственный блок при первом сообщении
        const welcomeBlock = this.chatWindow.querySelector('.welcome-board');
        if (welcomeBlock) {
            welcomeBlock.style.display = 'none';
        }

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
        
        // Показываем приветственный блок снова
        const welcomeBlock = this.chatWindow.querySelector('.welcome-board');
        if (welcomeBlock) {
            welcomeBlock.style.display = 'block';
        }
        
        this.showNotification('Чат очищен', 'success');
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeIcon = this.themeToggle;
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
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
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeIcon = this.themeToggle;
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
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
