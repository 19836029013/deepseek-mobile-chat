import { useEffect, useMemo, useState } from "react";
import {
  ChatBubbleIcon, CheckIcon, ChevronDownIcon, ClipboardCopyIcon, ClockIcon,
  GearIcon, GlobeIcon, HamburgerMenuIcon, ImageIcon, LightningBoltIcon,
  MagicWandIcon, PaperPlaneIcon, PersonIcon, PlusIcon, ReaderIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, KeyboardTextarea, MobileScroll, useKeyboard, useKeyboardInsets } from "./mobile";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; reasoning?: string };
type Chat = { id: string; title: string; messages: Message[]; updatedAt: number };
type Depth = "low" | "medium" | "high";

const CHAT_KEY = "deepseek-mobile-chats-v2";
const API_KEY = "deepseek-mobile-api-key";
const MODEL_KEY = "deepseek-mobile-model";
const loadChats = (): Chat[] => { try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]") as Chat[]; } catch { return []; } };
const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const createChat = (): Chat => ({ id: newId(), title: "新对话", messages: [], updatedAt: Date.now() });

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return <button className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const { bottomInset, isKeyboardVisible } = useKeyboardInsets();
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeId, setActiveId] = useState<string | null>(() => loadChats()[0]?.id ?? null);
  const [model, setModel] = useState(() => localStorage.getItem(MODEL_KEY) || "deepseek-v4-flash");
  const [depth, setDepth] = useState<Depth>("high");
  const [deepThinking, setDeepThinking] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY) || "");
  const [apiDraft, setApiDraft] = useState(apiKey);

  useEffect(() => localStorage.setItem(CHAT_KEY, JSON.stringify(chats)), [chats]);
  useEffect(() => localStorage.setItem(MODEL_KEY, model), [model]);
  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeId) ?? null, [activeId, chats]);

  const updateChat = (chatId: string, update: (chat: Chat) => Chat) => setChats((current) => current.map((chat) => chat.id === chatId ? update(chat) : chat));
  const startNewChat = () => { keyboard.hide(); const chat = createChat(); setChats((current) => [chat, ...current]); setActiveId(chat.id); setDraft(""); };
  const selectChat = (id: string) => { keyboard.hide(); setActiveId(id); setHistoryOpen(false); };

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const key = localStorage.getItem(API_KEY) || apiKey;
    if (!key) { keyboard.hide(); setSettingsOpen(true); setApiDraft(""); return; }
    const chat = activeChat ?? createChat();
    const userMessage: Message = { id: newId(), role: "user", content: text };
    const messages = [...chat.messages, userMessage];
    const nextChat: Chat = { ...chat, title: chat.messages.length ? chat.title : text.slice(0, 28), messages, updatedAt: Date.now() };
    if (!activeChat) { setChats((current) => [nextChat, ...current]); setActiveId(nextChat.id); } else setChats((current) => current.map((item) => item.id === chat.id ? nextChat : item));
    setDraft(""); setBusy(true);
    try {
      // Original API conversation only: no system prompt, hidden instruction, or message rewriting.
      const body: Record<string, unknown> = { model, messages: messages.map(({ role, content }) => ({ role, content })), stream: false };
      if (model === "deepseek-v4-flash") { body.thinking = { type: deepThinking ? "enabled" : "disabled" }; body.reasoning_effort = depth; }
      const response = await fetch("https://api.deepseek.com/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
      const result = await response.json() as { choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>; error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message || `API 请求失败（${response.status}）`);
      const apiMessage = result.choices?.[0]?.message;
      const assistant: Message = { id: newId(), role: "assistant", content: apiMessage?.content || "", reasoning: apiMessage?.reasoning_content };
      updateChat(chat.id, (current) => ({ ...current, messages: [...current.messages, assistant], updatedAt: Date.now() }));
    } catch (error) {
      updateChat(chat.id, (current) => ({ ...current, messages: [...current.messages, { id: newId(), role: "assistant", content: `请求失败：${error instanceof Error ? error.message : "未知错误"}` }], updatedAt: Date.now() }));
    } finally { setBusy(false); }
  };

  const saveSettings = () => { const cleaned = apiDraft.trim(); setApiKey(cleaned); if (cleaned) localStorage.setItem(API_KEY, cleaned); else localStorage.removeItem(API_KEY); keyboard.hide(); setSettingsOpen(false); };

  return <div className={`app-shell ${isKeyboardVisible ? "keyboard-open" : ""}`}>
    <header className="app-header">
      <IconButton label="打开历史对话" onClick={() => { keyboard.hide(); setHistoryOpen(true); }}><HamburgerMenuIcon /></IconButton>
      <button className="model-heading" onClick={() => { keyboard.hide(); setSettingsOpen(true); }}><span className="brand-wordmark">DeepSeek <span className="model-badge">R1</span></span><span className="model-subtitle">深度思考模型</span></button>
      <IconButton label="设置" onClick={() => { keyboard.hide(); setSettingsOpen(true); }}><GearIcon /></IconButton>
    </header>
    <MobileScroll className="app-scroll"><div className="app-scroll-content"><main className="conversation" aria-label="DeepSeek 对话"><button className="new-chat-button" onClick={startNewChat}><PlusIcon /> 新对话</button>{!activeChat?.messages.length ? <div className="empty-state"><div className="empty-mark"><LightningBoltIcon /></div><h1>有什么可以帮你？</h1><p>原版 DeepSeek API 对话</p></div> : <div className="message-list">{activeChat.messages.map((message) => <MessageBubble key={message.id} message={message} />)}</div>}</main></div></MobileScroll>
    <section className="composer-stack" style={{ bottom: bottomInset }}>
      <div className="control-row"><button className="control-tile" onClick={() => setDepth(depth === "low" ? "medium" : depth === "medium" ? "high" : "low")}><BrainGlyph /><span><b>思考深度</b><small>{depth === "low" ? "低" : depth === "medium" ? "中" : "高"}</small></span><ChevronDownIcon /></button><button className={`control-tile deep-toggle ${deepThinking ? "on" : ""}`} onClick={() => setDeepThinking((current) => !current)}><MagicWandIcon /><span><b>深度思考</b><small>{deepThinking ? "已开启" : "已关闭"}</small></span><span className="switch"><span /></span></button></div>
      <div className="composer"><KeyboardTextarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="输入你的问题…" rows={1} aria-label="输入消息" /><div className="composer-footer"><div className="composer-tools"><button aria-label="添加图片"><ImageIcon /> 图片</button><button aria-label="联网搜索"><GlobeIcon /> 联网搜索</button></div><button className="send-button" aria-label="发送消息" disabled={busy || !draft.trim()} onClick={() => void send()}>{busy ? <span className="spinner" /> : <PaperPlaneIcon />}</button></div></div><p className="disclaimer">原版 API · 不附加系统提示词</p>
    </section>
    <nav className="bottom-tabs" aria-label="主导航"><button className="active"><ChatBubbleIcon /><span>对话</span></button><button onClick={() => { keyboard.hide(); setHistoryOpen(true); }}><ClockIcon /><span>历史</span></button><button onClick={() => { keyboard.hide(); setSettingsOpen(true); }}><PersonIcon /><span>我</span></button></nav>
    <BottomSheet open={historyOpen} onOpenChange={setHistoryOpen} title="历史对话" description="只保存在当前浏览器"><div className="sheet-actions"><button onClick={startNewChat}><PlusIcon /> 新建对话</button></div><div className="history-list">{chats.length ? chats.map((chat) => <button className={chat.id === activeId ? "selected" : ""} key={chat.id} onClick={() => selectChat(chat.id)}><ChatBubbleIcon /><span>{chat.title}</span>{chat.id === activeId ? <CheckIcon /> : null}</button>) : <p className="sheet-empty">还没有历史对话</p>}</div></BottomSheet>
    <BottomSheet open={settingsOpen} onOpenChange={setSettingsOpen} title="设置" description="API Key 只保存在本机浏览器"><div className="settings-form"><label>DeepSeek API Key<input value={apiDraft} onChange={(event) => setApiDraft(event.target.value)} placeholder="sk-…" type="password" autoComplete="off" /></label><label>模型<select value={model} onChange={(event) => setModel(event.target.value)}><option value="deepseek-v4-flash">DeepSeek V4 Flash</option><option value="deepseek-v4-pro">DeepSeek V4 Pro</option></select></label><button className="save-settings" onClick={saveSettings}>保存设置</button><p>网页只发送当前对话消息，不会附带隐藏 system prompt。</p></div></BottomSheet>
  </div>;
}

function MessageBubble({ message }: { message: Message }) { const isUser = message.role === "user"; return <article className={`message ${isUser ? "user-message" : "assistant-message"}`}><div className="message-avatar">{isUser ? "你" : <LightningBoltIcon />}</div><div className="bubble-wrap">{!isUser && <div className="assistant-label">DeepSeek {message.reasoning ? <span>思考完成</span> : null}</div>}{message.reasoning && <details className="reasoning"><summary>查看思考过程</summary><p>{message.reasoning}</p></details>}<div className="bubble">{message.content}</div><div className="message-meta"><span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>{!isUser && <button aria-label="复制回答" onClick={() => void navigator.clipboard?.writeText(message.content)}><ClipboardCopyIcon /></button>}</div></div></article>; }
function BrainGlyph() { return <span className="brain-glyph" aria-hidden="true"><ReaderIcon /></span>; }
