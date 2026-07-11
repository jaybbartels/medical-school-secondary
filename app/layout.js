import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Medical School Secondary Assistant',
  description: 'AI-powered help for medical school secondary applications'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p>Medical School Secondary Application Assistant © 2024</p>
            <p className="text-sm text-gray-500 mt-2">Powered by Claude AI and Supabase</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
