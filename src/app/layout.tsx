import "./globals.css";
import { FontProvider } from "./font-provider";

export const metadata = {
  title: "IoTRICITY // Season 3",
  description: "EE Students Chapter - Academy of Technology",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="font-wix-mode">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Display:ital,wght@0,400..800;1,400..800&family=Wix+Madefor+Text:ital,wght@0,400..800;1,400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-wix-mode">
        <FontProvider>{children}</FontProvider>
      </body>
    </html>
  );
}

