import bot from './assets/bot.svg';
import user from './assets/user.svg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const form = document.querySelector('form');
const textarea = form.querySelector('textarea');
const sendButton = form.querySelector('button');
const sendButtonIcon = sendButton.innerHTML;
const chatContainer = document.querySelector('#chat_container');

let isPending = false;
let abortController = null;
let thinkingTimer = null;

//loader starts
function loader(element) {
  element.innerHTML = `
    <div class="thinking">
      <span class="thinking-label">Cody is thinking</span>
      <span class="typing"><span></span><span></span><span></span></span>
      <span class="thinking-time"></span>
    </div>
  `;

  const startedAt = Date.now();
  const timeEl = element.querySelector('.thinking-time');
  thinkingTimer = setInterval(() => {
    timeEl.textContent = `${Math.floor((Date.now() - startedAt) / 1000)}s`;
  }, 1000);
}
//loader ends
// typeText start
function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
      clearInterval(interval);
    }
  }, 20);
}
//typeText ends
// generateUniqueId starts
function generateUniqueId() {
  const timestampe = Date.now();
  const randomNumber = Math.random();
  const hexadecimaleString = randomNumber.toString(16);
  return `id-${timestampe}-${hexadecimaleString}`;
}
// generateUniqueId ends
//chatStripe starts
function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi ? 'ai' : 'user'}">
      <div class="chat">
        <div class="profile">
          <img 
          src="${isAi ? bot : user}" 
          alt="${isAi ? 'bot' : 'user'}" 
          />
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
    `;
}
//chatStripe ends
// autoResize starts
const autoResize = () => {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
};
// autoResize ends
// pending state starts
const setPending = (pending) => {
  isPending = pending;
  sendButton.classList.toggle('is-stop', pending);
  sendButton.innerHTML = pending
    ? '<span class="stop-icon"></span>'
    : sendButtonIcon;
  sendButton.setAttribute(
    'aria-label',
    pending ? 'Stop generating' : 'Send message'
  );
};

const stopGeneration = () => {
  abortController?.abort();
};
// pending state ends
// handleSubmit stats
const handleSubmit = async (e) => {
  e.preventDefault();
  if (isPending) return;

  const prompt = textarea.value.trim();
  if (!prompt) return;

  const data = new FormData(form);

  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  form.reset();
  autoResize();
  textarea.focus();

  const uniqueId = generateUniqueId();

  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);
  setPending(true);
  abortController = new AbortController();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: data.get('prompt'),
      }),
      signal: abortController.signal,
    });

    messageDiv.innerHTML = '';

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim();
      typeText(messageDiv, parsedData);
    } else {
      const err = await response.text();
      messageDiv.innerHTML = 'something went wrong';
      alert(err);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      messageDiv.innerHTML = '<span class="stopped">generation stopped</span>';
    } else {
      messageDiv.innerHTML = 'could not reach the server';
      console.log(error);
    }
  } finally {
    clearInterval(thinkingTimer);
    setPending(false);
    abortController = null;
  }
};
// handleSubmit ends

chatContainer.innerHTML += chatStripe(
  true,
  "Hey, I'm Cody — your coding companion. Ask me anything about code and let's build something cool.",
  'welcome'
);

textarea.addEventListener('input', autoResize);
textarea.focus();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isPending) {
    stopGeneration();
  } else {
    handleSubmit(e);
  }
});

textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!isPending) handleSubmit(e);
  }
});
