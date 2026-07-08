import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "../utils/cn";

export function Sidebar({ chats, onNewChat, onDeleteChat, open, onClose }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-full w-64 -translate-x-full flex-col border-r border-border bg-muted/40 p-3 transition-transform duration-200",
          "md:static md:translate-x-0",
          open && "translate-x-0"
        )}
      >
        <div className="mb-3 flex gap-2">
          <Button className="flex-1" onClick={onNewChat}>
            New Chat
          </Button>
          <ThemeToggle />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {chats.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet — start one above.</p>
          )}
          {chats.map((chat) => (
            <div key={chat.id} className="group flex items-center gap-1">
              <NavLink
                to={`/chat/${chat.id}`}
                onClick={onClose}
                className={({ isActive }) =>
                  `block flex-1 truncate rounded-md px-3 py-2 text-sm ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`
                }
              >
                {chat.title}
              </NavLink>
              <button
                type="button"
                aria-label={`Delete chat "${chat.title}"`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="shrink-0 rounded-md px-2 py-2 text-muted-foreground opacity-0 hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-950"
              >
                ×
              </button>
            </div>
          ))}
        </nav>

        <Button variant="outline" className="mt-3 w-full" onClick={handleSignOut}>
          Sign out
        </Button>
      </aside>
    </>
  );
}
