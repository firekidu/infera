export const metadata = {
  title: 'Infera',
  description: 'AI-generated app builder'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
