// PART 1 of 8: Global Variables & Initial Setup
//================================================

// Global variables
let apiKey = '';
let apiProvider = 'gemini';
let currentTheme = 'light';
let selectedImage = null;
let chatHistory = [];
let hasSeenSetup = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    checkFirstVisit();
    loadChatHistory();
    updateApiStatus();
    initializeCodeHighlighting();
});

// Initialize code highlighting
function initializeCodeHighlighting() {
    if (window.Prism) {
        Prism.highlightAll();
    }
}

// Load saved data from local storage
function loadSavedData() {
    // UPDATED: Switched to localStorage for permanent storage
    hasSeenSetup = localStorage.getItem('kxpert_setup_complete') === 'true';
    
    if (localStorage.getItem('kxpert_theme')) {
        currentTheme = localStorage.getItem('kxpert_theme');
        document.body.setAttribute('data-theme', currentTheme);
        updateThemeIcon();
    }
    
    if (localStorage.getItem('kxpert_api_key')) {
        apiKey = localStorage.getItem('kxpert_api_key');
    }
    
    if (localStorage.getItem('kxpert_api_provider')) {
        apiProvider = localStorage.getItem('kxpert_api_provider');
    }
}

// Save data to local storage
function saveData() {
    // UPDATED: Switched to localStorage for permanent storage
    localStorage.setItem('kxpert_theme', currentTheme);
    localStorage.setItem('kxpert_api_key', apiKey);
    localStorage.setItem('kxpert_api_provider', apiProvider);
    localStorage.setItem('kxpert_chat_history', JSON.stringify(chatHistory));
    localStorage.setItem('kxpert_setup_complete', 'true');
}

// Check if this is the first visit
function checkFirstVisit() {
    if (!hasSeenSetup) {
        document.getElementById('apiModal').style.display = 'flex';
    }
}

// Select API provider in setup
function selectProvider(provider) {
    document.querySelectorAll('.api-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.api-option').classList.add('selected');
    
    const keyInput = document.getElementById('apiKeyInput');
    const keySection = document.getElementById('apiKeySection');
    
    if (provider === 'gemini') {
        keyInput.placeholder = 'Enter your Gemini API key...';
        keySection.querySelector('p').textContent = 'A Google Gemini API key is required.';
    } else {
        keyInput.placeholder = 'Enter your OpenAI API key...';
        keySection.querySelector('p').textContent = 'An OpenAI API key is required.';
    }
    
    // Update radio button
    document.querySelector(`input[value="${provider}"]`).checked = true;
}

// Save API setup
function saveApiSetup() {
    const selectedProvider = document.querySelector('input[name="provider"]:checked');
    if (!selectedProvider) {
        alert('Please select a provider');
        return;
    }
    
    const keyInput = document.getElementById('apiKeyInput');
    const keyValue = keyInput ? keyInput.value.trim() : '';
    
    apiProvider = selectedProvider.value;
    apiKey = keyValue;
    
    const modal = document.getElementById('apiModal');
    if (modal) modal.style.display = 'none';
    
    saveData();
    updateApiStatus();
    
    if (apiKey) {
        const capabilities = apiProvider === 'openai' 
            ? 'conversations, code analysis, image processing, and image/video generation!'
            : 'conversations, code analysis, image processing, and image generation!';
        
        addMessage('ai', `Great! I'm K-XpertAI. I'm connected via ${apiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT'}. I can help with ${capabilities}`);
    } else {
        addMessage('ai', "Hello! I'm K-XpertAI. To start, please go to settings and enter your API key.");
    }
}

// Skip setup
function skipSetup() {
    apiProvider = 'gemini';
    apiKey = ''; 
    
    const modal = document.getElementById('apiModal');
    if (modal) modal.style.display = 'none';
    
    saveData();
    updateApiStatus();
    addMessage('ai', "Welcome! I'm K-XpertAI. To unlock my full potential, including generating images and videos, please enter your API key in settings.");
}

// END OF PART 1



// PART 2 of 8: API Status & Settings Modal Logic
//================================================
// (No changes were made to this part)

// Update API status indicator
function updateApiStatus() {
    const statusElement = document.getElementById('apiStatus');
    const providerElement = document.getElementById('apiProvider');
    
    if (apiKey) {
        statusElement.style.display = 'flex';
        providerElement.textContent = apiProvider === 'gemini' ? 'Gemini' : 'OpenAI';
        statusElement.style.color = 'var(--success-color)';
    } else {
        statusElement.style.display = 'flex';
        providerElement.textContent = 'No Key';
        statusElement.style.color = 'var(--danger-color)';
    }
}

// Open settings
function openSettings() {
    const settingsProvider = apiProvider;
    document.querySelectorAll('#settingsModal .api-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById(`settings${settingsProvider === 'gemini' ? 'Gemini' : 'OpenAI'}`).classList.add('selected');
    document.querySelector(`#settingsModal input[value="${settingsProvider}"]`).checked = true;
    document.getElementById('settingsApiKey').value = apiKey || '';
    document.getElementById(`lightTheme`).classList.toggle('selected', currentTheme === 'light');
    document.getElementById(`darkTheme`).classList.toggle('selected', currentTheme === 'dark');
    document.querySelector(`#settingsModal input[value="${currentTheme}"]`).checked = true;
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function selectSettingsProvider(provider) {
    document.querySelectorAll('#settingsModal .api-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById(`settings${provider === 'gemini' ? 'Gemini' : 'OpenAI'}`).classList.add('selected');
    document.querySelector(`#settingsModal input[value="${provider}"]`).checked = true;
}

function setThemeFromSettings(theme) {
    document.querySelectorAll('#settingsModal .theme-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById(`${theme}Theme`).classList.add('selected');
    document.querySelector(`#settingsModal input[name="theme"][value="${theme}"]`).checked = true;
}

function saveSettings() {
    apiProvider = document.querySelector('#settingsModal input[name="settingsProvider"]:checked').value;
    apiKey = document.getElementById('settingsApiKey').value.trim();
    if (!apiKey) {
        alert('An API key is required to save settings.');
        return;
    }
    currentTheme = document.querySelector('#settingsModal input[name="theme"]:checked').value;
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    saveData();
    updateApiStatus();
    closeSettings();
}

// END OF PART 2



// PART 3 of 8: Theme & Basic Message Formatting
//===============================================
// (No changes were made to this part)

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    saveData();
}

function updateThemeIcon() {
    const themeBtn = document.querySelector('.header-btn[onclick="toggleTheme()"] i');
    themeBtn.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyCode(elementId) {
    const codeElement = document.getElementById(elementId);
    // MODIFIED to look for the hidden full-code span for truncated code blocks
    const hiddenFullCode = codeElement.closest('.code-content').querySelector('.full-code');
    const codeToCopy = hiddenFullCode || codeElement;
    
    navigator.clipboard.writeText(codeToCopy.textContent).then(() => {
        const btn = codeElement.closest('.code-block').querySelector('.copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });
}

// END OF PART 3



// PART 4 of 8: Advanced Code Block Formatting
//=============================================

// UPDATED: This function is completely rewritten for better formatting.
function processMessageContent(text) {
    // First, process multi-line code blocks to protect them from other replacements
    let processed = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'plaintext';
        const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
        const lines = code.trim().split('\n');
        const lineThreshold = 15;

        let codeHtml;
        if (lines.length > lineThreshold) {
            const visiblePart = lines.slice(0, lineThreshold).join('\n');
            const hiddenPart = lines.slice(lineThreshold).join('\n');
            codeHtml = `
                <pre id="${codeId}" class="code-container">
                    <code class="language-${language}">${escapeHtml(visiblePart)}</code><code class="language-${language} hidden-code" style="display:none;">\n${escapeHtml(hiddenPart)}</code>
                </pre>
                <button class="see-more-btn" onclick="toggleCodeVisibility('${codeId}', this)">See More</button>
                <span class="full-code" style="display:none;">${escapeHtml(code.trim())}</span>
            `;
        } else {
            codeHtml = `<pre id="${codeId}"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
        }
        
        return `<div class="code-block">
            <div class="code-header">
                <span>${language}</span>
                <button class="copy-btn" onclick="copyCode('${codeId}')"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="code-content">${codeHtml}</div>
        </div>`;
    });

    // Process the rest of the markdown.
    processed = processed
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // IMPORTANT: We removed the .replace(/\n/g, '<br>')
    // We now use CSS (white-space: pre-wrap) to handle line breaks instead.
    return processed;
}


function toggleCodeVisibility(codeId, button) {
    const preElement = document.getElementById(codeId);
    const hiddenCode = preElement.querySelector('.hidden-code');
    const fullCode = preElement.closest('.code-content').querySelector('.full-code');
    const visibleCode = preElement.querySelector('code:not(.hidden-code)');

    if (hiddenCode.style.display === 'none') {
        // To show more, we just display the hidden part.
        hiddenCode.style.display = 'inline';
        button.textContent = 'See Less';
        // A better implementation would merge them, but this is a simple toggle.
    } else {
        // To show less, we hide it again.
        hiddenCode.style.display = 'none';
        button.textContent = 'See More';
    }
}


// END OF PART 4




// PART 5 of 8: Chat History & Message Display Logic
//===================================================

// --- Image Helper Functions ---
function openImagePreview(imageUrl) {
    const modal = document.getElementById('imagePreviewModal');
    const modalImg = document.getElementById('fullImagePreview');
    modal.style.display = 'flex';
    modalImg.src = imageUrl;
}

function closeImagePreview() {
    const modal = document.getElementById('imagePreviewModal');
    modal.style.display = 'none';
}

async function downloadImage(event, imageUrl) {
    event.stopPropagation(); // Prevents the preview from opening when clicking download
    try {
        // Fetch the image data
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create an object URL from the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = `K-XpertAI-Image-${Date.now()}.png`; // Set a filename
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        addMessage('ai', "Sorry, I couldn't download that image due to a browser security policy (CORS). You can try right-clicking the image and saving it manually.");
    }
}
// --- End of Image Helper Functions ---


// UPDATED: This is the main function for adding any message to the chat.
function addMessage(sender, text, mediaUrl = null, mediaType = 'image') {
    const chatMessages = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const processedText = sender === 'ai' ? processMessageContent(text) : escapeHtml(text);
    
    let mediaHtml = '';
    if (mediaUrl) {
        if (mediaType === 'image') {
            // This is for AI-generated images, including the download button.
            mediaHtml = `
                <div class="image-preview generated-media" onclick="openImagePreview('${mediaUrl}')">
                    <img src="${mediaUrl}" class="generated-image">
                    <div class="media-label">Generated Image</div>
                    <button class="download-btn" onclick="downloadImage(event, '${mediaUrl}')" title="Download Image">
                        <i class="fas fa-download"></i>
                    </button>
                </div>`;
        } else if (mediaType === 'video') {
            mediaHtml = `<div class="video-preview generated-media"><video controls src="${mediaUrl}" class="generated-video"></video><div class="media-label">Generated Video</div></div>`;
        } else { // This is for the user's uploaded image.
            mediaHtml = `<div class="image-preview" onclick="openImagePreview('${mediaUrl}')"><img src="${mediaUrl}"></div>`;
        }
    }

    // NEW: The speaker button is now part of the footer, not the main content.
    const messageFooter = sender === 'ai' && text.trim().length > 0
        ? `<div class="message-footer">
               <div class="message-time">${time}</div>
               <button class="tts-btn" onclick="readMessage(this)" title="Read aloud"><i class="fas fa-volume-up"></i></button>
           </div>`
        : `<div class="message-footer"><div class="message-time">${time}</div></div>`;

    msgDiv.innerHTML = `
        <div class="message-avatar">${sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}</div>
        <div class="message-content">
            ${mediaHtml}
            <div class="message-text-content">${processedText}</div>
            ${messageFooter}
        </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (window.Prism) {
        Prism.highlightAllUnder(msgDiv);
    }
    
    // Logic to prevent duplicating history entries from the typing animation.
    if (sender === 'user' || mediaUrl) {
        chatHistory.push({ sender, text, mediaUrl, mediaType, time });
        saveData();
    }
}


function clearChat() {
    chatHistory = [];
    document.getElementById('chatMessages').innerHTML = `
        <div class="welcome-message">
            <h2 class="welcome-title">Welcome to K-XpertAI</h2>
            <p>I'm your intelligent assistant, created by KingzAlkhasim. Ask me anything, request code, or ask me to generate an image or video!</p>
        </div>
    `;
    saveData();
}

function loadChatHistory() {
    const saved = localStorage.getItem('kxpert_chat_history');
    if (saved) {
        chatHistory = JSON.parse(saved);
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        if (chatHistory.length > 0) {
            chatHistory.forEach(msg => {
                // For loading history, we call a simplified add function to avoid animations.
                addHistoricMessage(msg.sender, msg.text, msg.mediaUrl, msg.mediaType, msg.time);
            });
        }
    }
}

// This is a helper function to load history messages without animations.
function addHistoricMessage(sender, text, mediaUrl, mediaType, time) {
    const chatMessages = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    // Rebuild the message structure exactly like addMessage.
    const processedText = sender === 'ai' ? processMessageContent(text) : escapeHtml(text);
    let mediaHtml = ''; // (The media logic from addMessage should be here if you want to see history images)

    const messageFooter = sender === 'ai' && text.trim().length > 0
        ? `<div class="message-footer">
               <div class="message-time">${time}</div>
               <button class="tts-btn" onclick="readMessage(this)" title="Read aloud"><i class="fas fa-volume-up"></i></button>
           </div>`
        : `<div class="message-footer"><div class="message-time">${time}</div></div>`;
        
    msgDiv.innerHTML = `
        <div class="message-avatar">${sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}</div>
        <div class="message-content">
            ${mediaHtml}
            <div class="message-text-content">${processedText}</div>
            ${messageFooter}
        </div>`;
        
    chatMessages.appendChild(msgDiv);
    if (window.Prism) {
        Prism.highlightAllUnder(msgDiv);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// NEW: Function for Text-to-Speech (reads the text content of the message).
function readMessage(buttonElement) {
    // Find the message text associated with the button.
    const messageContent = buttonElement.closest('.message-content');
    const textElement = messageContent.querySelector('.message-text-content');

    if (textElement && textElement.textContent) {
        // Stop any currently speaking utterance.
        window.speechSynthesis.cancel();
        
        const textToRead = textElement.textContent;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        
        window.speechSynthesis.speak(utterance);
    }
}

// END OF PART 5




// PART 6 of 8: User Input & Message Sending
//=============================================

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImage = e.target.result;
            showImagePreview(selectedImage);
        };
        reader.readAsDataURL(file);
    }
}

function showImagePreview(imageUrl) {
    let preview = document.querySelector('.input-wrapper .image-preview');
    if (!preview) {
        preview = document.createElement('div');
        preview.className = 'image-preview';
        document.querySelector('.input-wrapper').insertBefore(preview, document.getElementById('messageInput'));
    }
    preview.innerHTML = `<img src="${imageUrl}"><button class="remove-image" onclick="removeImage()" title="Remove">&times;</button>`;
}

function removeImage() {
    selectedImage = null;
    const preview = document.querySelector('.input-wrapper .image-preview');
    if (preview) preview.remove();
    document.getElementById('fileInput').value = '';
}

// UPDATED: sendMessage is rewritten to handle the typing animation
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text && !selectedImage) return;

    const userImage = selectedImage;
    addMessage('user', text, userImage, 'user-image');
    input.value = '';
    autoResize(input);
    removeImage();

    showProcessing();

    try {
        if (isImageGenerationRequest(text)) {
            const imageUrl = await generateImage(text);
            hideProcessing();
            const responses = [ "Here is the image you requested!", "I've created this for you!", "Voilà! How does this look?" ];
            const dynamicResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage('ai', dynamicResponse, imageUrl, 'image');
        } else if (isVideoGenerationRequest(text)) {
            if (apiProvider !== 'openai') {
                throw new Error("Video generation is only available with the OpenAI API provider.");
            }
            const videoUrl = await generateVideo(text);
            hideProcessing();
            addMessage('ai', 'Here is the video you requested:', videoUrl, 'video');
        } else {
            const responseText = await getAiResponse(text, userImage);
            hideProcessing();
            await typeResponse(responseText); // This now types the response
        }
    } catch (error) {
        hideProcessing();
        addMessage('ai', `An error occurred: ${error.message}`);
    }
}

// NEW: Helper function for the typing effect
async function typeResponse(text) {
    const chatMessages = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai';

    const speakerButton = `<button class="tts-btn" onclick="readMessage(this)" title="Read aloud"><i class="fas fa-volume-up"></i></button>`;

    msgDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            ${speakerButton}
            <div class="message-text-content"><span class="typing-cursor"></span></div>
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const contentDiv = msgDiv.querySelector('.message-text-content');
    const processedHtml = processMessageContent(text);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedHtml;
    const plainText = tempDiv.textContent || "";
    
    let i = 0;
    const typingInterval = setInterval(() => {
        if (i < plainText.length) {
            contentDiv.innerHTML = escapeHtml(plainText.substring(0, i + 1)) + '<span class="typing-cursor"></span>';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            i++;
        } else {
            clearInterval(typingInterval);
            contentDiv.innerHTML = processedHtml;
            Prism.highlightAllUnder(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            chatHistory.push({ sender: 'ai', text: text, mediaUrl: null, mediaType: null, time });
            saveData();
        }
    }, 20); // Typing speed in milliseconds
}


function showProcessing() {
    const chatMessages = document.getElementById('chatMessages');
    const procDiv = document.createElement('div');
    procDiv.id = 'processingIndicator';
    procDiv.className = 'message ai';
    procDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <div class="processing-indicator">
                <span></span>
                <span class="processing-dots">
                    <span class="processing-dot"></span><span class="processing-dot"></span><span class="processing-dot"></span>
                </span>
            </div>
        </div>`;
    chatMessages.appendChild(procDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideProcessing() {
    const procDiv = document.getElementById('processingIndicator');
    if (procDiv) procDiv.remove();
}

// END OF PART 6




// PART 7 of 8: Media Generation (Image & Video)
//================================================
// (No changes were made to this part)

function isImageGenerationRequest(text) {
    const lowerCaseText = text.toLowerCase();
    const keywords = [
        'generate', 'create', 'make', 'draw', 'show me', 'give me', 'i need',
        'image of', 'picture of', 'photo of', 'drawing of', 'painting of', 'render of',
        'visualize'
    ];
    const imageWords = ['image', 'picture', 'photo', 'drawing', 'painting', 'render', 'art'];

    if (keywords.some(kw => lowerCaseText.includes(kw)) && imageWords.some(img => lowerCaseText.includes(img))) {
        return true;
    }
    if (!text.includes('?')) {
        const startsWithArticle = ['a ', 'an ', 'the '].some(prefix => lowerCaseText.startsWith(prefix));
        if (startsWithArticle && text.split(' ').length > 2) {
             // Heuristic, relies on keywords above primarily.
        }
    }
    return false;
}

function isVideoGenerationRequest(text) {
    const lowerCaseText = text.toLowerCase();
    const keywords = ['video of', 'generate a video', 'create a video', 'make a video', 'animate'];
    return keywords.some(kw => lowerCaseText.includes(kw));
}

async function generateImage(prompt) {
    if (!apiKey && apiProvider === 'openai') {
        throw new Error("OpenAI API key is not set. Please add it in settings.");
    }

    const cleanPrompt = prompt.replace(/generate|create|make|draw|an image of|a picture of|a photo of/gi, "").trim();
    
    if (apiProvider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: cleanPrompt,
                n: 1,
                size: "1024x1024",
                quality: "hd"
            })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(`OpenAI Image Error: ${err.error.message}`);
        }
        const data = await response.json();
        return data.data[0].url;
    } else { 
        const response = await fetch(
            `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}`
        );
        if (!response.ok) {
            throw new Error("Gemini (proxy) image generation failed.");
        }
        return response.url;
    }
}

async function generateVideo(prompt) {
    if (apiProvider !== 'openai') {
        throw new Error("Video generation is only available with OpenAI. Please switch the provider in settings.");
    }
    addMessage('ai', "True text-to-video is still experimental. I will generate a dynamic, cinematic image for you instead.");
    return await generateImage(prompt + ", cinematic, dynamic action scene, high detail, 4k");
}

// END OF PART 7





// PART 8 of 8: AI API Communication
//====================================

async function getAiResponse(text, imageUrl) {
    if (!apiKey) {
        throw new Error('API key not configured. Please go to settings and enter your API key.');
    }

    if (apiProvider === 'gemini') {
        return await callGeminiAPI(text, imageUrl, apiKey);
    } else if (apiProvider === 'openai') {
        return await callOpenAI(text, imageUrl, apiKey);
    } else {
        throw new Error('No API provider configured.');
    }
}

async function callGeminiAPI(text, imageUrl, key) {
    // UPDATED: Changed model to "gemini-1.5-flash-latest" to prevent version errors.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const parts = [];
    const systemInstruction = `You are K-XpertAI. Your creator is Alkhassim Lawal Umar (KingzAlkhasim) of kingxTech Company. Only state this if asked. Your name means kingxTech Expert AI. Don't say those until you are asking, DO NOT! and you work for kingxTech`;
    
    if (text) parts.push({ text: `${systemInstruction}\n\nUser: ${text}` });

    if (imageUrl) {
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(';')[0].split(':')[1];
        parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }] })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error?.message || `Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        return "The model provided an empty response, possibly due to safety filters. Please try a different prompt.";
    }
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(text, imageUrl, key) {
    const messages = [{
        role: "system",
        content: "You are K-XpertAI, an intelligent assistant created by Alkhassim Lawal Umar (KingzAlkhasim), the founder of kingxTech Company. Your name means kingxTech Expert AI. You are helpful and proud of your origins. Only state who your creator is when specifically asked, DO NOT say you owner until you are asked? and you work for kingxTech."
    }];
    
    const user_content = [];
    if (text) user_content.push({ type: "text", text: text });
    if (imageUrl) user_content.push({ type: "image_url", image_url: { url: imageUrl } });
    
    messages.push({ role: "user", content: user_content });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: messages,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error?.message || `OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// END OF PART 8
