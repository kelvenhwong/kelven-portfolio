document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================================
       Header Styling on Scroll
       ========================================================================= */
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* =========================================================================
       Smooth Scroll Adjustments
       ========================================================================= */
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for sticky header
                const headerHeight = header.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* =========================================================================
       Intersection Observer for Reveal Animations
       ========================================================================= */
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);
    
    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    /* =========================================================================
       AI Chatbot Logic (Google Gemini integration)
       ========================================================================= */
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    let chatHistory = [];

    const systemPrompt = `You are a friendly, professional AI assistant embedded on Kelven Wong's personal portfolio website.
    Your main goal is to enthusiastically engage visitors, answer questions about Kelven, and politely suggest they book a meeting with him by emailing kelvenhwong@gmail.com.
    
    Here is what you know about Kelven Wong:
    - He is a Vancouver-based people leader and business operations professional.
    - Strong background in customer experience (CX), sales leadership, franchise operations, and team development.
    - His leadership experience spans organizations like 1-800-GOT-JUNK?, BCAA, and Rogers.
    - Key Achievements: Accountable for a $130M+ portfolio of revenue, led large high-performing teams (including 10 managers and 200 employees at Rogers, and 6 managers with 150+ employees at 1-800-GOT-JUNK?), successfully developed and mentored 6 direct reports into senior management roles, led growth and engagement through COVID restrictions, drove inbound sales conversion rate of +22.6%, and dramatically increased revenue per completed job by +46.8% since 2019.
    - He successfully combines operational excellence with a highly people-focused leadership style (emphasizing coaching, culture, and continuous improvement).
    - He is passionate about leveraging data, AI, and process optimization to improve business performance and support frontline teams.
    - Personal traits: Friends and colleagues describe him as thoughtful, organized, approachable, naturally building trust and positive energy within communities.
    - Outside of work: Deeply interested in health and longevity. He's focused on improving his body composition through consistent fitness, strength training, and intermittent fasting.
    - He is also actively trying to be a better tennis player.
    - He is an avid traveler with a strong interest in Japan, food culture, and discovering authentic local experiences (like ramen spots or hidden travel gems).
    
    Never hallucinate information about Kelven outside of what is provided here. Keep responses relatively concise as they will be displayed in a small widget.`;

    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
    });

    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
    });

    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const text = chatbotInput.value.trim();
        if (!text) return;

        addMessage('user', text);
        chatbotInput.value = '';
        
        chatHistory.push({ role: "user", parts: [{ text: text }] });

        const loadingId = "loading-" + Date.now();
        addMessage('bot', `<span class="loading-dots">Thinking...</span>`, loadingId);

        try {
            const response = await fetch(`/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    contents: chatHistory
                })
            });

            const data = await response.json();
            document.getElementById(loadingId).remove();

            if (data.error) {
                addMessage('bot', "Initialization Error: " + data.error.message);
                return;
            }

            if (data.candidates && data.candidates.length > 0) {
                const botReply = data.candidates[0].content.parts[0].text;
                addMessage('bot', botReply);
                chatHistory.push({ role: "model", parts: [{ text: botReply }] });
            } else {
                addMessage('bot', "Sorry, I didn't get a response.");
            }

        } catch (error) {
            document.getElementById(loadingId).remove();
            addMessage('bot', "Network error connecting to Google API. Please check your console.");
            console.error(error);
        }
    }

    function addMessage(sender, text, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        if (id) msgDiv.id = id;
        
        // Allow very simple html tags like the loading span
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        
        chatbotMessages.appendChild(msgDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    /* =========================================================================
       Rotating Message Logic
       ========================================================================= */
    const messages = [
        "Let’s Build Better Customer Experiences",
        "Let’s Talk Operations + AI",
        "Interested in Leadership, CX, or Operational Strategy?",
        "Open to Strategic Leadership Opportunities"
    ];
    let messageIndex = 0;
    const rotatingMessageEl = document.getElementById('rotating-message');
    
    if (rotatingMessageEl) {
        setInterval(() => {
            rotatingMessageEl.style.opacity = 0;
            setTimeout(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                rotatingMessageEl.textContent = messages[messageIndex];
                rotatingMessageEl.style.opacity = 1;
            }, 500); // Wait for fade out to complete before changing text
        }, 5000);
    }

    /* =========================================================================
       Animated Counters
       ========================================================================= */
    const counters = document.querySelectorAll('.metric-value');
    const bars = document.querySelectorAll('.metric-bar-fill');
    
    const countUpObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate numbers
                if (entry.target.classList.contains('metric-value')) {
                    const el = entry.target;
                    const target = parseFloat(el.getAttribute('data-target'));
                    const prefix = el.getAttribute('data-prefix') || '';
                    const suffix = el.getAttribute('data-suffix') || '';
                    const decimals = parseInt(el.getAttribute('data-decimals') || '0');
                    const duration = 2000;
                    let start = null;
                    
                    const step = (timestamp) => {
                        if (!start) start = timestamp;
                        const progress = Math.min((timestamp - start) / duration, 1);
                        
                        // Ease out cubic
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const current = (easeOut * target).toFixed(decimals);
                        
                        el.textContent = prefix + current + suffix;
                        
                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        } else {
                            el.textContent = prefix + target.toFixed(decimals) + suffix;
                        }
                    };
                    
                    window.requestAnimationFrame(step);
                    observer.unobserve(el);
                }
                
                // Animate bars
                if (entry.target.classList.contains('metric-bar-fill')) {
                    const bar = entry.target;
                    const targetWidth = bar.getAttribute('data-width');
                    setTimeout(() => {
                        bar.style.width = targetWidth + '%';
                    }, 300); // slight delay for visual effect
                    observer.unobserve(bar);
                }
            }
        });
    }, revealOptions);

    counters.forEach(counter => countUpObserver.observe(counter));
    bars.forEach(bar => countUpObserver.observe(bar));

});
