document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================================
       Google Analytics Custom Event Tracking Helper
       ========================================================================= */
    function trackAnalyticsEvent(eventName, eventParams = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventParams);
            console.log(`[GA4 Event] ${eventName}:`, eventParams);
        }
    }

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

            trackAnalyticsEvent('navigation_click', { target_section: targetId });
            
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

    const systemPrompt = `You are a friendly, professional AI assistant embedded on Kelven Wong's personal executive portfolio website.
    Your goal is to engage executive recruiters, hiring managers, and business leaders by sharing insights into Kelven's leadership philosophy, operational scale, career evolution, and work with AI-enabled transformation. Always invite visitors to connect with Kelven at kelvenhwong@gmail.com or on LinkedIn.

    Core Positioning & Persona:
    - Kelven is an experienced Operations & Customer Experience Leader who combines people leadership, business performance, and AI-enabled transformation.
    - He is a senior operator who understands how to use AI, data, and modern platforms to solve practical business problems.
    - He is NOT positioned as a software engineer, data scientist, or developer.

    Key Achievements & Facts (Source of Truth):
    - Scale & Performance: Managed a $130M+ revenue portfolio, led teams of 200+ employees across up to 10 managers, grew commercial portfolio to $30M, drove +115%+ revenue growth, +22.6% inbound sales conversion, +46.8% revenue per job, and 82%+ employee engagement. Supported 5,000+ contact center employees over his career.
    - People Development: Mentored, developed, and promoted 12+ leaders into senior management roles.
    - Operational Innovation & AI in Action: Architected an automated AI-enabled call scoring workflow using Dialpad, Gemini AI, DynamoDB, and React to turn customer calls into structured performance insights.
    - Executive Philosophy: "AI doesn't replace the operator's judgment. It changes how quickly an operator can move from an idea to a working solution."
    - Career Evolution: Progressive leadership across Rogers Communications (national scale & retention), BCAA (contact center & digital CX), and 1-800-GOT-JUNK? / O2E Brands (Director of Local Commercial Sales & Sales Centre).
    - What Leaders Say: Celebrated by former superiors, direct reports, and executive peers as a thoughtful, authentic, high-integrity leader, phenomenal mentor, and true culture carrier.

    Strict Rules:
    - Never mention personal interests such as tennis, Japan travel, or longevity/health optimization.
    - Keep answers professional, concise, structured, and focused on operational innovation, leadership, and CX.`;

    chatbotToggle.addEventListener('click', () => {
        const isOpening = chatbotWindow.classList.contains('hidden');
        chatbotWindow.classList.toggle('hidden');
        if (isOpening) {
            trackAnalyticsEvent('chat_opened');
        }
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

    // Handle prompt chips
    const promptChips = document.querySelectorAll('.prompt-chip');
    promptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt');
            if (promptText && chatbotInput) {
                chatbotInput.value = promptText;
                sendMessage();
            }
        });
    });

    async function sendMessage() {
        const text = chatbotInput.value.trim();
        if (!text) return;

        trackAnalyticsEvent('chat_message_sent', {
            message_length: text.length
        });

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
                    const format = el.getAttribute('data-format') || '';
                    const duration = 2000;
                    let start = null;
                    
                    const step = (timestamp) => {
                        if (!start) start = timestamp;
                        const progress = Math.min((timestamp - start) / duration, 1);
                        
                        // Ease out cubic
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        let valStr = '';
                        if (format === 'comma') {
                            const rawNum = Math.floor(easeOut * target);
                            valStr = rawNum.toLocaleString('en-US');
                        } else {
                            valStr = (easeOut * target).toFixed(decimals);
                        }
                        
                        el.textContent = prefix + valStr + suffix;
                        
                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        } else {
                            const finalVal = format === 'comma' ? Math.floor(target).toLocaleString('en-US') : target.toFixed(decimals);
                            el.textContent = prefix + finalVal + suffix;
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

    /* =========================================================================
       Testimonial Carousel
       ========================================================================= */
    const slides = document.querySelectorAll('.testimonial-card.slide');
    const dots = document.querySelectorAll('.carousel-indicators .dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentSlide = 0;

    if (slides.length > 0) {
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].classList.add('active');
            dots[index].classList.add('active');
            currentSlide = index;
        }

        function nextSlide() {
            let index = (currentSlide + 1) % slides.length;
            showSlide(index);
        }

        function prevSlide() {
            let index = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(index);
        }

        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        dots.forEach(dot => {
            dot.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                showSlide(index);
            });
        });
    }

    /* =========================================================================
       Contact Form Submission & Redundant Message Delivery
       ========================================================================= */
    const contactForm = document.getElementById('contact-form');
    const contactSubmitBtn = document.getElementById('contact-submit-btn');
    const contactStatus = document.getElementById('contact-status');

    // Display confirmation message if redirected back with ?submitted=true
    if (window.location.search.includes('submitted=true')) {
        if (contactStatus) {
            showContactStatus('Thank you! Your message has been sent directly to Kelven. We will be in touch soon.', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            const nameEl = document.getElementById('name');
            const emailEl = document.getElementById('email');
            const messageEl = document.getElementById('message');

            const name = nameEl ? nameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';
            const message = messageEl ? messageEl.value.trim() : '';

            if (!name || !email || !message) {
                e.preventDefault();
                showContactStatus('Please fill in all required fields.', 'error');
                return;
            }

            setContactLoading(true);
            showContactStatus('', ''); // clear status

            trackAnalyticsEvent('contact_form_submitted');

            const payload = {
                name: name,
                email: email,
                message: message,
                _subject: `New Portfolio Message from ${name}`
            };

            let sentViaAjax = false;

            // Attempt 1: Node Backend API (/api/contact)
            try {
                const apiRes = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (apiRes.ok) {
                    const data = await apiRes.json();
                    if (data.success) {
                        sentViaAjax = true;
                    }
                }
            } catch (err) {
                console.log('Node backend /api/contact not available, using FormSubmit service...');
            }

            // Attempt 2: FormSubmit Service (AJAX)
            if (!sentViaAjax) {
                try {
                    const fsRes = await fetch('https://formsubmit.co/ajax/kelvenhwong@gmail.com', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (fsRes.ok) {
                        const data = await fsRes.json();
                        if (data.success === 'true' || data.success === true) {
                            sentViaAjax = true;
                        }
                    }
                } catch (fsErr) {
                    console.error('FormSubmit AJAX dispatch failed:', fsErr);
                }
            }

            if (sentViaAjax) {
                e.preventDefault();
                setContactLoading(false);
                showContactStatus('Thank you! Your message has been sent directly to Kelven. We will be in touch soon.', 'success');
                contactForm.reset();
            } else {
                // If AJAX was not confirmed, reset the spinner state FIRST so button never gets stuck
                setContactLoading(false);

                // Configure _next redirect parameter dynamically
                let nextInput = contactForm.querySelector('input[name="_next"]');
                if (!nextInput) {
                    nextInput = document.createElement('input');
                    nextInput.type = 'hidden';
                    nextInput.name = '_next';
                    contactForm.appendChild(nextInput);
                }
                const currentUrl = window.location.href.split('?')[0].split('#')[0];
                nextInput.value = currentUrl + '?submitted=true#contact';

                // Prevent JS from blocking default form submission
                // FormSubmit will process natively and show activation page if live domain requires 1-click activation
            }
        });
    }

    function setContactLoading(isLoading) {
        if (!contactSubmitBtn) return;
        const btnText = contactSubmitBtn.querySelector('.btn-text');
        const btnSpinner = contactSubmitBtn.querySelector('.btn-spinner');
        
        if (isLoading) {
            contactSubmitBtn.disabled = true;
            if (btnText) btnText.textContent = 'Sending...';
            if (btnSpinner) btnSpinner.classList.remove('hidden');
        } else {
            contactSubmitBtn.disabled = false;
            if (btnText) btnText.textContent = 'Send Message';
            if (btnSpinner) btnSpinner.classList.add('hidden');
        }
    }

    function showContactStatus(msg, type) {
        if (!contactStatus) return;
        if (!msg) {
            contactStatus.classList.add('hidden');
            contactStatus.className = 'contact-status hidden';
            contactStatus.innerHTML = '';
            return;
        }
        contactStatus.className = `contact-status ${type}`;
        contactStatus.innerHTML = msg;
        contactStatus.classList.remove('hidden');
    }

});
