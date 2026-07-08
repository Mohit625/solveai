import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Sidebar } from "../components/Sidebar";
import { createChat, listChats, deleteChat, getErrorMessage } from "../services/api";

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function refreshChats() {
    try {
      setChats(await listChats());
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  useEffect(() => {
    refreshChats();
  }, []);

  async function handleNewChat() {
    try {
      const chat = await createChat("New Chat");
      setChats((prev) => [chat, ...prev]);
      setSidebarOpen(false);
      navigate(`/chat/${chat.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDeleteChat(chatId) {
    if (!window.confirm("Delete this chat and all its messages? This can't be undone.")) return;
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (location.pathname === `/chat/${chatId}`) navigate("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="flex h-screen">
      <button
        type="button"
        className="fixed left-3 top-3 z-30 rounded-md border border-border bg-background px-3 py-1.5 text-sm md:hidden"
        onClick={() => setSidebarOpen((open) => !open)}
      >
        Menu
      </button>

      <Sidebar
        chats={chats}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet context={{ refreshChats }} />
      </main>
    </div>
  );
}
