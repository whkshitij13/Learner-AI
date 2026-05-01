import "./globals.css";

export const metadata = {
  title: "Learner DEV",
  description: "AI study platform for LWC and Apex with topic cards, practice terminal, media modules, and mock tests."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
