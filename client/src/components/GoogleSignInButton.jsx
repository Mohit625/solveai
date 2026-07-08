import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();

  async function handleClick() {
    const { error } = await signInWithGoogle();
    // On success the browser navigates away to Google immediately — this
    // only ever returns while still on the page if it failed to even start
    // (e.g. the provider isn't enabled in Supabase yet).
    if (error) toast.error(error.message);
  }

  return (
    <Button type="button" variant="outline" className="w-full gap-2" onClick={handleClick}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
        />
        <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4-3.11Z" />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
