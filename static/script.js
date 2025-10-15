class ChatApp {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeApp();
        this.audioEnabled = true;
        this.currentAudio = null;
        this.isRecording = false;
        this.recognition = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.setupSpeechRecognition();
    }

    initializeElements() {
        // Основные элементы
        this.chatWindow = document.getElementById('chat-window');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.botStatus = document.getElementById('bot-status');
        this.notification = document.getElementById('notification');
        this.charCounter = document.getElementById('char-counter');
        
        // Кнопки
        this.voiceBtn = document.getElementById('voice-btn');
        this.audioToggle = document.getElementById('audio-toggle');
        this.themeToggle = document.getElementById('theme-toggle');
        
        // Время приветствия
        this.welcomeTime = document.getElementById('welcome-time');
    }

    initializeApp() {
        this.setWelcomeTime();
        this.loadTheme();
        this.setupQuickQuestions();
        this.checkHealth();
    }

    setupSpeechRecognition() {
        // Проверяем поддержку Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'ru-RU';
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.updateVoiceButton(true);
                this.showNotification('Слушаю... Говорите сейчас', 'info');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                
                this.messageInput.value = transcript;
                this.handleInput();
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    this.showNotification(`Ошибка распознавания: ${event.error}`, 'error');
                }
            };
            
            this.recognition.onend = () => {
                this.isRecording = false;
                this.updateVoiceButton(false);
                
                // Если есть распознанный текст, предлагаем отправить
                if (this.messageInput.value.trim()) {
                    setTimeout(() => {
                        this.showNotification('Текст распознан. Нажмите Enter для отправки', 'info');
                    }, 500);
                }
            };
        } else {
            this.voiceBtn.style.display = 'none';
            this.showNotification('Голосовой ввод не поддерживается вашим браузером', 'warning');
        }
    }

    setWelcomeTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        this.welcomeTime.textContent = timeString;
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('.theme-icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    setupEventListeners() {
        // Форма отправки сообщения
        this.messageForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Ввод текста
        this.messageInput.addEventListener('input', () => this.handleInput());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!this.sendBtn.disabled) {
                    this.handleSubmit(e);
                }
            }
        });
        
        // Голосовой ввод
        this.voiceBtn.addEventListener('click', () => this.handleVoiceInput());
        
        // Переключение темы
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Переключение озвучки
        this.audioToggle.addEventListener('click', () => this.toggleAudio());
        
        // Быстрые вопросы
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-question-btn')) {
                this.handleQuickQuestion(e.target);
            }
        });
        
        // Закрытие уведомлений
        this.notification.addEventListener('click', () => this.hideNotification());
    }

    setupQuickQuestions() {
        const buttons = document.querySelectorAll('.quick-question-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.sendMessage(question);
            });
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        const message = this.messageInput.value.trim();
        if (message) {
            this.sendMessage(message);
        }
    }

    handleInput() {
        const text = this.messageInput.value;
        const length = text.length;
        
        // Счетчик символов
        this.charCounter.textContent = `${length}/500`;
        
        // Блокировка кнопки отправки
        this.sendBtn.disabled = length === 0 || length > 500;
        
        // Подсветка при превышении лимита
        if (length > 450) {
            this.charCounter.style.color = 'var(--warning-color)';
        } else if (length > 500) {
            this.charCounter.style.color = 'var(--error-color)';
        } else {
            this.charCounter.style.color = 'var(--text-tertiary)';
        }
        
        // Авто-высота текстового поля
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    handleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Голосовой ввод не поддерживается вашим браузером', 'error');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.messageInput.value = '';
            this.handleInput();
            this.recognition.start();
        }
    }

    updateVoiceButton(recording) {
        const icon = this.voiceBtn.querySelector('svg');
        if (recording) {
            icon.style.color = 'var(--error-color)';
            this.voiceBtn.classList.add('recording');
            // Добавляем анимацию пульсации
            this.voiceBtn.style.animation = 'pulse 1s infinite';
        } else {
            icon.style.color = '';
            this.voiceBtn.classList.remove('recording');
            this.voiceBtn.style.animation = '';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        const icon = this.audioToggle.querySelector('svg');
        
        if (this.audioEnabled) {
            icon.style.color = 'var(--success-color)';
            this.showNotification('Озвучка включена', 'success');
        } else {
            icon.style.color = 'var(--text-tertiary)';
            this.showNotification('Озвучка выключена', 'info');
            
            // Останавливаем текущее аудио
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
        }
    }

    handleQuickQuestion(button) {
        const question = button.getAttribute('data-question');
        this.sendMessage(question);
        
        // Анимация нажатия
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    async sendMessage(message) {
        // Очищаем поле ввода
        this.messageInput.value = '';
        this.handleInput();
        
        // Показываем сообщение пользователя
        this.displayMessage(message, 'user');
        
        // Показываем индикатор набора
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: message })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка сервера');
            }

            // Скрываем индикатор набора
            this.hideTypingIndicator();
            
            // Показываем ответ бота
            this.displayMessage(data.textResponse, 'bot');
            
            // Воспроизводим аудио если включено
            if (this.audioEnabled && data.audioUrl) {
                this.playAudio(data.audioUrl);
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.displayMessage('Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.', 'bot');
            this.showNotification(error.message, 'error');
            console.error('Ошибка:', error);
        }
    }

    displayMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const time = new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-avatar">
                ${sender === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        this.chatWindow.appendChild(messageElement);
        this.scrollToBottom();
        
        // Анимация появления
        messageElement.style.animation = 'messageSlide 0.3s ease-out';
    }

    showTypingIndicator() {
        this.typingIndicator.classList.add('show');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.remove('show');
    }

    async playAudio(audioUrl) {
        try {
            // Останавливаем предыдущее аудио
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            // Добавляем временную метку для обхода кеширования
            const urlWithTimestamp = `${audioUrl}?t=${Date.now()}`;
            this.currentAudio = new Audio(urlWithTimestamp);
            
            // Показываем уведомление о воспроизведении
            this.showNotification('Воспроизводится аудиоответ...', 'info');
            
            await this.currentAudio.play();
            
            this.currentAudio.onended = () => {
                this.showNotification('Аудиоответ завершен', 'success');
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
        this.notification.className = `notification show ${type}`;
        
        // Автоматическое скрытие только для info и success
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                this.hideNotification();
            }, 3000);
        }
    }

    hideNotification() {
        this.notification.classList.remove('show');
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            if (!response.ok) {
                throw new Error('Сервер недоступен');
            }
            this.botStatus.textContent = 'Онлайн • Готов помочь';
            this.botStatus.style.color = 'var(--success-color)';
        } catch (error) {
            this.botStatus.textContent = 'Офлайн • Проблемы с соединением';
            this.botStatus.style.color = 'var(--error-color)';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});
