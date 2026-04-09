// app/layout.js
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Proto-Research | MIST",
  description: "Research Discovery System",
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  
  // We still fetch the user and profile in case child components need it via the server,
  // but we are removing the Navbar that was causing the crash.
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*, departments(code)')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="en">
      <body className="antialiased">
        {/* REMOVED: The global Navbar import and logic.
            The Admin pages will now manually render their own AdminNavbar.
            The Student/User pages can use their specific headers (like UserHeader.js).
        */}
        
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}