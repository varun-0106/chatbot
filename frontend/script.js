const chatsContainer = document.querySelector(".chats-container");
const form = document.querySelector(".prompt-form");
const input = document.querySelector(".prompt-input");
const sendBtn = document.getElementById("send-prompt-btn");
const stopBtn = document.getElementById("stop-response-btn");

let controller = null; // For stopping response

// Create a chat message element
// Create a chat message element
function createMessage(content, isUser = false) {
    const div = document.createElement("div");
    div.classList.add("message", isUser ? "user-message" : "bot-message");

    const avatar = document.createElement("div");
    avatar.classList.add("avatar");
    avatar.innerText = isUser ? "🧑" : "🤖";

    const text = document.createElement("div");
    text.classList.add("message-text");

    if (isUser) {
        text.textContent = content;
    } else {
        // Render bot response with Markdown
        text.innerHTML = marked.parse(content || "...");
    }

    div.appendChild(avatar);
    div.appendChild(text);
    chatsContainer.appendChild(div);
    chatsContainer.scrollTop = chatsContainer.scrollHeight;

    return text;
}


// Handle form submit
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    // Show user message
    createMessage(message, true);
    input.value = "";

    // Create bot message placeholder
    const botText = createMessage("...", false);

    // Enable stop button
    document.body.classList.add("bot-responding");
    controller = new AbortController();

    try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
            signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        botText.textContent = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            botText.textContent += decoder.decode(value, { stream: true });
            chatsContainer.scrollTop = chatsContainer.scrollHeight;
        }
    } catch (err) {
        botText.textContent = "[Error: " + err.message + "]";
    } finally {
        document.body.classList.remove("bot-responding");
    }
});

// Stop response
stopBtn.addEventListener("click", () => {
    if (controller) {
        controller.abort();
        document.body.classList.remove("bot-responding");
    }
});

// Function to handle sending a message (user or suggestion)
async function sendMessage(message) {
    if (!message) return;

    // Show user message
    createMessage(message, true);
    input.value = "";

    // Create bot message placeholder
    const botText = createMessage("...", false);

    // Enable stop button
    document.body.classList.add("bot-responding");
    controller = new AbortController();



    try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
            signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let renderTimer = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullText += decoder.decode(value, { stream: true });

            if (!renderTimer) {
                renderTimer = setTimeout(() => {
                    botText.innerHTML = marked.parse(fullText);
                    enhanceCodeBlocks(botText);
                    chatsContainer.scrollTop = chatsContainer.scrollHeight;
                    renderTimer = null;
                }, 50); // update every 50ms (like ChatGPT typing)
            }
        }

    } catch (err) {
        botText.textContent = "[Error: " + err.message + "]";
    } finally {
        document.body.classList.remove("bot-responding");
    }
}

// Handle form submit
form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value.trim());
});

// Handle suggestion clicks
document.querySelectorAll(".suggestions-item").forEach((item) => {
    item.addEventListener("click", () => {
        const text = item.querySelector(".text").textContent.trim();
        sendMessage(text);
    });
});

// Stop response
stopBtn.addEventListener("click", () => {
    if (controller) {
        controller.abort();
        document.body.classList.remove("bot-responding");
    }
});

function enhanceCodeBlocks(container) {
    const blocks = container.querySelectorAll("pre code");
    blocks.forEach((block) => {
        const pre = block.parentElement;

        if (!pre.querySelector(".copy-btn")) {
            const button = document.createElement("button");
            button.textContent = "📋";
            button.className = "copy-btn";
            button.addEventListener("click", () => {
                navigator.clipboard.writeText(block.innerText);
                button.textContent = "✅";
                setTimeout(() => (button.textContent = "📋"), 2000);
            });

            pre.style.position = "relative"; // so button stays inside <pre>
            pre.appendChild(button);
        }
    });
}

