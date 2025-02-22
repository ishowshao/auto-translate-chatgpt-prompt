// ==UserScript==
// @name         ChatGPT自动翻译成英文
// @namespace    http://tampermonkey.net/
// @version      2025-02-22
// @description  自动将输入文本翻译成英文
// @author       You
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  "use strict";

  // 翻译API
  const TRANSLATE_API = "translate api by yourself";

  // 翻译文本函数
  async function translateText(text) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("text", text);

      GM_xmlhttpRequest({
        method: "POST",
        url: TRANSLATE_API,
        data: formData,
        onload: function (response) {
          const translatedText = response.responseText.trim();
          resolve(translatedText || text); // 如果返回空则使用原文
        },
        onerror: function (error) {
          console.error("Translation Failed:", error);
          resolve(text); // 出错时返回原文
        },
      });
    });
  }

  // Your code here...
  console.log("installed");
  // 让光标保持在文本最后
  function moveCursorToEnd(el) {
    let range = document.createRange();
    let selection = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false); // 把光标移动到最后
    selection.removeAllRanges();
    selection.addRange(range);
  }
  async function handleKeyDown(event) {
    // **检查是否是我们自己触发的事件**
    if (event.isSimulated) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopImmediatePropagation();

      let editor = event.target;
      let text = editor.innerText.trim();

      // 翻译文本
      const translatedText = await translateText(text);

      // 更新编辑器内容
      editor.innerText = translatedText;
      moveCursorToEnd(editor);

      // **触发模拟的 Enter 事件**
      setTimeout(() => {
        let enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
        });

        // **添加自定义属性，防止重复进入**
        Object.defineProperty(enterEvent, "isSimulated", {
          value: true,
          writable: false,
        });

        editor.dispatchEvent(enterEvent);
      }, 0);
    }
  }

  // 添加事件监听到editor
  function attachEditorListener() {
    const editor = document.getElementById("prompt-textarea");
    if (editor && !editor._hasKeydownListener) {
      console.log("Attaching translation listener to editor");
      editor.addEventListener("keydown", handleKeyDown, true);
      // 标记已添加监听器
      editor._hasKeydownListener = true;
    }
  }

  // 监听DOM变化
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      attachEditorListener();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 监听URL变化
  function observeURLChanges() {
    let lastUrl = location.href;

    // 使用定时器检查URL变化
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("URL changed, checking editor...");
        attachEditorListener();
      }
    }, 1000);

    // 监听popstate事件
    window.addEventListener("popstate", () => {
      console.log("Navigation occurred, checking editor...");
      attachEditorListener();
    });
  }

  // 初始化
  function initialize() {
    attachEditorListener();
    observeDOM();
    observeURLChanges();
  }

  // 启动脚本
  initialize();
})();
