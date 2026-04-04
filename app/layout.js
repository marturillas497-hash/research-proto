// app/layout.js
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Proto-Research | MIST",
  description: "Research Discovery System",
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  
  // Fetch the current user session
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;

  // If a user is logged in, get their profile and department info
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
      <body>
        {/* We pass the profile to the Navbar so it can show the right links */}
        <Navbar profile={profile} />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}